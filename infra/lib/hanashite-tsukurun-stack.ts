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
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as path from 'path';
import { Construct } from 'constructs';

export class HanashiteTsukurunStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly lambdaFunction: lambda.Function;
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stackName = this.node.tryGetContext('stackName') || 'hanashite-tsukurun';

    // ========================================
    // カスタムドメイン設定 (hanashite.<domainName>)
    // ========================================
    const domainName = this.node.tryGetContext('domainName') || process.env.DOMAIN_NAME || '';
    const subDomain = `hanashite.${domainName}`;

    const hostedZone = route53.HostedZone.fromLookup(this, 'KurashiDevZone', {
      domainName,
    });

    // ACM 証明書 (us-east-1 で作成済みの ARN をコンテキストから取得)
    const certificateArn = this.node.tryGetContext('certificateArn')
      || ssm.StringParameter.valueForStringParameter(this, '/kurashi-dev/certificate-arn');
    const certificate = acm.Certificate.fromCertificateArn(this, 'WildcardCert', certificateArn);

    // ========================================
    // 共有認証基盤の参照 (AuthPlatformStack の出力値を SSM 経由で取得)
    // ========================================
    const userPoolId = ssm.StringParameter.valueForStringParameter(
      this, '/auth-platform/user-pool-id'
    );
    const userPoolClientId = ssm.StringParameter.valueForStringParameter(
      this, '/auth-platform/hanashite-tsukurun-client-id'
    );

    // 共有 User Pool を参照 (JWT Authorizer 用)
    const userPool = cognito.UserPool.fromUserPoolId(this, 'SharedUserPool', userPoolId);
    const userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this, 'SharedUserPoolClient', userPoolClientId
    );

    // ========================================
    // S3 Bucket - フロントエンド配信
    // ========================================
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${stackName}-website`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    cdk.Tags.of(websiteBucket).add('name', `${stackName}-website`);

    // ========================================
    // CloudFront Distribution
    // ========================================
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${stackName} - Frontend Distribution`,
      domainNames: [subDomain],
      certificate,
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
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0),
        },
      ],
    });
    cdk.Tags.of(this.distribution).add('name', `${stackName}-cdn`);

    // Route 53 A レコード (hanashite.<domainName> → CloudFront)
    new route53.ARecord(this, 'CloudFrontAliasRecord', {
      zone: hostedZone,
      recordName: 'hanashite',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
      comment: `hanashite.${domainName} → CloudFront`,
    });

    // BucketDeployment
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../dist'))],
      destinationBucket: websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // ========================================
    // Lambda Function
    // ========================================
    this.lambdaFunction = new lambda.Function(this, 'SlideApiHandler', {
      functionName: `${stackName}-slide-api-handler`,
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BEDROCK_MODEL_ID: 'jp.anthropic.claude-haiku-4-5-20251001-v1:0',
        BEDROCK_MONTHLY_LIMIT: '500',
        RATE_LIMIT_PARAM_PREFIX: `/${stackName}/bedrock-invoke-count`,
      },
    });
    cdk.Tags.of(this.lambdaFunction).add('name', `${stackName}-slide-api-handler`);

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

    // ========================================
    // HTTP API (API Gateway v2)
    // ========================================
    const lambdaIntegration = new HttpLambdaIntegration('SlideApiIntegration', this.lambdaFunction);

    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: `${stackName}-api`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.POST, apigwv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    cdk.Tags.of(this.httpApi).add('name', `${stackName}-api`);

    // Cognito JWT Authorizer (共有 User Pool を参照)
    const authorizer = new HttpUserPoolAuthorizer(`${stackName}-cognito-authorizer`, userPool, {
      userPoolClients: [userPoolClient],
    });

    // POST /api/create-slide
    this.httpApi.addRoutes({
      path: '/api/create-slide',
      methods: [apigwv2.HttpMethod.POST],
      integration: lambdaIntegration,
      authorizer,
    });

    // ========================================
    // Outputs
    // ========================================
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'API Gateway endpoint (VITE_API_ENDPOINT)',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${subDomain}`,
      description: 'Frontend URL (カスタムドメイン)',
    });

    // API Gateway スロットリング
    const defaultStage = this.httpApi.defaultStage?.node.defaultChild as apigwv2.CfnStage;
    if (defaultStage) {
      defaultStage.defaultRouteSettings = {
        throttlingBurstLimit: 10,
        throttlingRateLimit: 5,
      };
    }
  }
}
