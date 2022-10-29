import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {appSyncRole, baseRole} from '../../iam.js';
import {handler} from "./get-twitter-user-timeline.js";

export const setupTwitterUserTimelineSource = (appSyncID) => {

    /**
     * Lambda Function
     */
    const getTwitterUserTimelineResolver = new aws.lambda.CallbackFunction('get-twitter-user-timeline-fn', {
        runtime: 'nodejs14.x',
        callback: handler,
        role: baseRole
    });

    /**
     * Data Source
     */
    const dataSource = new aws.appsync.DataSource('get-twitter-user-timeline-ds', {
        apiId: appSyncID,
        name: 'GetTwitterUserTimelineDs',
        type: 'AWS_LAMBDA',
        serviceRoleArn: appSyncRole.arn,
        lambdaConfig: {
            functionArn: getTwitterUserTimelineResolver.arn,
        },
    });

    /**
     * Resolver
     */
    new aws.appsync.Resolver('get-twitter-user-timeline-rs', {
        apiId: appSyncID,
        field: 'getTwitterUserTimeline',
        type: 'Query',
        dataSource: dataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation": "Invoke",
        "payload": $util.toJson($context)
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });

};
