import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {appSyncRole, baseRole} from '../../iam.js';
import {handler} from "./get-twitter-user-daily-statistics.js";

export const setupTwitterUserDailyStatisticsSource = (appSyncID) => {

    /**
     * Lambda Function
     */
    const getTwitterUserDailyStatisticsResolver = new aws.lambda.CallbackFunction('get-twitter-user-daily-statistics-fn', {
        runtime: 'nodejs14.x',
        callback: handler,
        role: baseRole
    });

    /**
     * Data Source
     */
    const dataSource = new aws.appsync.DataSource('get-twitter-user-daily-statistics-ds', {
        apiId: appSyncID,
        name: 'GetTwitterUserDailyStatisticsDs',
        type: 'AWS_LAMBDA',
        serviceRoleArn: appSyncRole.arn,
        lambdaConfig: {
            functionArn: getTwitterUserDailyStatisticsResolver.arn,
        },
    });

    /**
     * Resolver
     */
    new aws.appsync.Resolver('get-twitter-user-daily-statistics-rs', {
        apiId: appSyncID,
        field: 'getTwitterUserDailyStatistics',
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
