import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { Construct } from 'constructs';

export class HanashiteTsukurunStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly distribution: cloudfront.Distribution;
  public readonly lambdaFunction: lambda.Function;
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stackName = this.node.tryGetContext('stackName') || 'hanashite-tsukurun';

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${stackName}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        username: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito App Client
    this.userPoolClient = this.userPool.addClient('AppClient', {
      userPoolClientName: `${stackName}-app-client`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
      },
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // S3 Bucket - パブリックアクセスを全ブロック
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${stackName}-website`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution with Origin Access Control (OAC)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${stackName} - Frontend Distribution`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
    });

    // BucketDeployment - dist/ を S3 にアップロード
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../dist'))],
      destinationBucket: websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // Lambda Function - Python 3.13, 30s timeout
    this.lambdaFunction = new lambda.Function(this, 'SlideApiHandler', {
      functionName: `${stackName}-slide-api-handler`,
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BEDROCK_MODEL_ID: 'anthropic.claude-haiku-4-5-20251001-v1:0',
        BEDROCK_MONTHLY_LIMIT: '500',
        RATE_LIMIT_PARAM_PREFIX: `/${stackName}/bedrock-invoke-count`,
      },
    });

    // Grant Bedrock InvokeModel permission
    this.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    // Grant SSM Parameter Store access for rate limiting
    this.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:PutParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${stackName}/bedrock-invoke-count-*`],
    }));

    // HTTP API (API Gateway v2) with CORS
    const lambdaIntegration = new HttpLambdaIntegration('SlideApiIntegration', this.lambdaFunction);

    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: `${stackName}-api`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognito JWT Authorizer
    const authorizer = new HttpUserPoolAuthorizer(`${stackName}-cognito-authorizer`, this.userPool, {
      userPoolClients: [this.userPoolClient],
    });

    // POST /api/create-slide route with Lambda integration and JWT Authorizer
    this.httpApi.addRoutes({
      path: '/api/create-slide',
      methods: [apigwv2.HttpMethod.POST],
      integration: lambdaIntegration,
      authorizer,
    });

    // CfnOutput — デプロイ後に .env.production に設定するための参照値
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID (VITE_COGNITO_USER_POOL_ID)',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID (VITE_COGNITO_CLIENT_ID)',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'API Gateway endpoint (VITE_API_ENDPOINT)',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    // API Gateway スロットリング — バースト10、レート5リクエスト/秒
    const defaultStage = this.httpApi.defaultStage?.node.defaultChild as apigwv2.CfnStage;
    if (defaultStage) {
      defaultStage.defaultRouteSettings = {
        throttlingBurstLimit: 10,
        throttlingRateLimit: 5,
      };
    }
  }
}
