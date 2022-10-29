import * as aws from '@pulumi/aws';
import {variables} from './variables.js';

/**
 * DynamoDB tables
 */
const user_db = new aws.dynamodb.Table('users', {
    attributes: [
        {name: 'id', type: 'S'},
        {name: 'stripeCustomerId', type: 'S'}],
    hashKey: 'id',
    readCapacity: 1,
    writeCapacity: 1,
    globalSecondaryIndexes: [{
        hashKey: "stripeCustomerId",
        name: "stripeCustomerIdIndex",
        projectionType: "ALL",
        readCapacity: 1,
        writeCapacity: 1,
    }],
});

const twitter_user_db = new aws.dynamodb.Table('twitter_users', {
    attributes: [
        {name: 'cognitoUserId', type: 'S'},
        {name: 'twitterUserId', type: 'S'},
        //{name: 'accessToken', type: 'S'},
        //{name: 'accessSecret', type: 'S'},
        //{name: 'tokenCreationDateTime', type: 'S'}
    ],
    hashKey: 'cognitoUserId',
    globalSecondaryIndexes: [{
        hashKey: "twitterUserId",
        name: "twitterUserIdIndex",
        nonKeyAttributes: ["cognitoUserId"],
        projectionType: "INCLUDE",
        readCapacity: 1,
        writeCapacity: 1,
    }],
    readCapacity: 1,
    writeCapacity: 1,
});

const tweets_db = new aws.dynamodb.Table('tweets', {
    attributes: [
        {name: 'tweetId', type: 'S'},
        {name: 'cognitoUserId', type: 'S'},
        {name: 'twitterUserId', type: 'S'},
        {name: 'scheduledDateTime', type: 'S'},
    ],
    hashKey: 'tweetId',
    globalSecondaryIndexes: [
        {
            hashKey: "scheduledDateTime",
            name: "scheduledDateTimeIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "twitterUserId",
            name: "twitterUserIdIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "cognitoUserId",
            rangeKey: "scheduledDateTime",
            name: "cognitoUserIdAndScheduledDateTimeIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        }
    ],
    readCapacity: 1,
    writeCapacity: 1,
})


const queued_tweets_db = new aws.dynamodb.Table('queued_tweets', {
    attributes: [
        {name: 'tweetId', type: 'S'},
        {name: 'cognitoUserId', type: 'S'},
        {name: 'twitterUserId', type: 'S'},
        {name: 'year', type: 'S'},
        {name: 'month', type: 'S'},
        {name: 'date', type: 'S'},
        {name: 'time', type: 'S'},
        {name: 'yearMonthDate', type: 'S'}
    ],
    hashKey: 'tweetId',
    globalSecondaryIndexes: [
        {
            hashKey: "year",
            name: "yearIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "month",
            name: "monthIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "date",
            name: "dateIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "time",
            name: "timeIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "twitterUserId",
            name: "twitterUserIdIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        },
        {
            hashKey: "cognitoUserId",
            rangeKey: "yearMonthDate",
            name: "cognitoUserIdAndYearMonthDateIndex",
            projectionType: "ALL",
            readCapacity: 1,
            writeCapacity: 1,
        }
    ],
    readCapacity: 1,
    writeCapacity: 1,
})

/**
 * Set table variables
 */
variables.dynamoDBTables['user-table'] = user_db.name;
variables.dynamoDBTables['twitter-user-table'] = twitter_user_db.name;
variables.dynamoDBTables['tweets-table'] = tweets_db.name;
variables.dynamoDBTables['queued-tweets-table'] = queued_tweets_db.name;

export const userDynamoID = user_db.id;
export const twitterUserDynamoId = twitter_user_db.id;
export const tweetsDynamoId = tweets_db.id;
