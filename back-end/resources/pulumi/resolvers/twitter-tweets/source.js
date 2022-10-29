import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {appSyncRole, baseRole} from '../../iam.js';
import {handler} from './get-scheduled-tweets-of-user.js';
import {variables} from '../../variables.js';

export const setupTwitterTweetsSource = (appSyncID) => {
    /**
     * Lambda Function
     */
    const getScheduledTweetsOfUserLambdaResolver = new aws.lambda.CallbackFunction(
        'get-scheduled-tweets-of-user-lambda-fn', {
        runtime: 'nodejs14.x',
        callback: handler,
        role: baseRole,
        environment: {
            variables: {
                DYNAMO_TWITTER_TWEETS_TABLE: variables.dynamoDBTables['tweets-table']
            },
        },
    });

    /**
     * Lambda Data Source
     */
    const lambdaDataSource = new aws.appsync.DataSource('get-scheduled-tweets-of-user-ds', {
        apiId: appSyncID,
        name: 'TwitterTweetsLambdaDs',
        type: 'AWS_LAMBDA',
        serviceRoleArn: appSyncRole.arn,
        lambdaConfig: {
            functionArn: getScheduledTweetsOfUserLambdaResolver.arn,
        },
    });

    /**
     * Resolver
     */
    const getScheduledTweetsOfUserResolver = new aws.appsync.Resolver('get-scheduled-tweets-of-user-rs', {
        apiId: appSyncID,
        field: 'getScheduledTweetsOfUser',
        type: 'Query',
        dataSource: lambdaDataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation": "Invoke",
        "payload": $util.toJson($context)
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });


    /**
     * Data Source
     */
    const dynamodbDataSource = new aws.appsync.DataSource('twitter-tweets-ds', {
        apiId: appSyncID,
        name: 'TwitterTweetsDynamoDBDs',
        type: 'AMAZON_DYNAMODB',
        serviceRoleArn: appSyncRole.arn,
        dynamodbConfig: {
            tableName: variables.dynamoDBTables['tweets-table']
        },
    });

    /**
     * Resolver
    const getScheduledTweetsOfUser = new aws.appsync.Resolver('get-scheduled-tweets-of-user-rs', {
        apiId: appSyncID,
        field: 'getScheduledTweetsOfUser',
        type: 'Query',
        dataSource: dataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation": "Query",
        "index": "scheduledDateTimeIndex",
        "query": {
            "expression": "scheduledDateTime <= :toDateTime, scheduledDateTime >= :fromDateTime",
            "expressionValues": {
                ":toDateTime": $util.dynamodb.toDynamoDBJson($context.args.toDateTime),
                ":fromDateTime": $util.dynamodb.toDynamoDBJson($context.args.fromDateTime),
            }
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });
     */

    /**
     * Resolver
     */
    const getTwitterTweetResolver = new aws.appsync.Resolver('get-twitter-tweet-rs', {
        apiId: appSyncID,
        field: 'getTwitterTweet',
        type: 'Query',
        dataSource: dynamodbDataSource.name,
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

    const createTwitterTweetResolver = new aws.appsync.Resolver('create-twitter-tweet-rs', {
        apiId: appSyncID,
        field: 'createTwitterTweet',
        type: 'Mutation',
        dataSource: dynamodbDataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation" : "PutItem",
        "key": {
            "tweetId" : $util.dynamodb.toDynamoDBJson($util.autoId())
        },
        "attributeValues" : $util.dynamodb.toMapValuesJson($context.args)
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    });

    const deleteTwitterTweetResolver = new aws.appsync.Resolver('delete-twitter-tweet-rs', {
        apiId: appSyncID,
        field: 'deleteTwitterTweet',
        type: 'Mutation',
        dataSource: dynamodbDataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation" : "DeleteItem",
        "key": {
            "tweetId": $util.dynamodb.toDynamoDBJson($context.arguments.tweetId)
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    })

    const updateTwitterTweetResolver = new aws.appsync.Resolver('update-twitter-tweet-rs', {
        apiId: appSyncID,
        field: 'updateTwitterTweet',
        type: 'Mutation',
        dataSource: dynamodbDataSource.name,
        requestTemplate: `
      {
        "version" : "2017-02-28",
        "operation" : "UpdateItem",
        "key": {
            "tweetId": $util.dynamodb.toDynamoDBJson($context.arguments.tweetId)
        },
        "update": {
            "expression" : "SET tweets = :tweets, scheduledDateTime = :scheduledDateTime, updateDateTime = :updateDateTime",
            "expressionValues": {
                ":tweets" : $util.dynamodb.toDynamoDBJson($context.arguments.tweets),
                ":scheduledDateTime" : $util.dynamodb.toDynamoDBJson($context.arguments.scheduledDateTime),
                ":updateDateTime" : $util.dynamodb.toDynamoDBJson($context.arguments.updateDateTime)
            }
        }
      }
    `,
        responseTemplate: '$util.toJson($context.result)',
    })
};