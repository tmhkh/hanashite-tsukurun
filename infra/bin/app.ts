#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HanashiteTsukurunStack } from '../lib/hanashite-tsukurun-stack';

const app = new cdk.App();

const stackName = app.node.tryGetContext('stackName') || 'hanashite-tsukurun';

const stack = new HanashiteTsukurunStack(app, stackName, {
  description: 'はなして・つくるん - Secure Deployment Stack',
});

// スタック内の全リソースに name:hanashite タグを付与
cdk.Tags.of(stack).add('name', 'hanashite');
