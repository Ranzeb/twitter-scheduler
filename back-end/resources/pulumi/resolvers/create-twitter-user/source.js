import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {appSyncRole, baseRole} from '../../iam.js';
import {variables} from '../../variables.js';

export const setupTwitterUserSource = (appSyncID) => {

    /**
     * Data Source
     */
    const dataSource = new aws.appsync.DataSource('twitter-user-ds', {
        apiId: appSyncID,
        name: 'TwitterUserDs',
        type: 'AMAZON_DYNAMODB',
        serviceRoleArn: appSyncRole.arn,
        dynamodbConfig: {
            tableName: variables.dynamoDBTables['twitter-user-table']
        },
    });

    /**
     * Resolver
     */
    const getTwitterUserResolver = new aws.appsync.Resolver('get-twitter-user-rs', {
        apiId: appSyncID,
        field: 'getTwitterUser',
        type: 'Query',
        dataSource: dataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation": "GetItem",
        "key": {
            "cognitoUserId": $util.dynamodb.toDynamoDBJson($context.args.cognitoUserId)
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });

    const createTwitterUserResolver = new aws.appsync.Resolver('create-twitter-user-rs', {
        apiId: appSyncID,
        field: 'createTwitterUser',
        type: 'Mutation',
        dataSource: dataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key" : {
            "cognitoUserId" : $util.dynamodb.toDynamoDBJson($context.args.cognitoUserId)
        },
        "attributeValues" : {
            "accessToken": $util.dynamodb.toDynamoDBJson($context.args.accessToken),
            "accessSecret": $util.dynamodb.toDynamoDBJson($context.args.accessSecret),
            "screenName": $util.dynamodb.toDynamoDBJson($context.args.screenName),
            "twitterUserId": $util.dynamodb.toDynamoDBJson($context.args.twitterUserId),
            "tokenCreationDateTime": $util.dynamodb.toDynamoDBJson($context.args.tokenCreationDateTime)
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });


    const updateTwitterUserScheduleResolver = new aws.appsync.Resolver('update-twitter-user-schedule-rs', {
        apiId: appSyncID,
        field: 'updateTwitterUserSchedule',
        type: 'Mutation',
        dataSource: dataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation" : "UpdateItem",
        "key": {
            "cognitoUserId": $util.dynamodb.toDynamoDBJson($context.arguments.cognitoUserId)
        },
        "update": {
            "expression" : "SET schedule = :schedule",
            "expressionValues": {
                ":schedule" : $util.dynamodb.toDynamoDBJson($context.arguments.schedule)
            }
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    })
};
