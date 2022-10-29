import AWS from 'aws-sdk';
import {client} from './client.js';


export const createScheduledTweet = async (scheduledTweet) => {
    if (!('tweetId' in scheduledTweet)) {
        scheduledTweet["tweetId"] = AWS.util.uuid.v4();
    }
    const params = {
        TableName: process.env.DYNAMO_TWITTER_TWEETS_TABLE,
        Item: scheduledTweet,
    };

    return client.putItem(params);
};


export const updateTweet = async (tweet) => {
    return client.updateDynamicItem(process.env.DYNAMO_TWITTER_TWEETS_TABLE, tweet, 'tweetId');
};


export const allTweetsToSchedule = async (toDateTime, fromDateTime) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_TWEETS_TABLE,
        ExpressionAttributeNames: {
            "#scheduledDateTime": "scheduledDateTime",
            "#isPosted": "isPosted"
        },
        ExpressionAttributeValues: {
            ":toDateTimeValue": toDateTime,
            ":fromDateTimeValue": fromDateTime,
            ":isPosted": false
        },
        FilterExpression: "#isPosted = :isPosted AND #scheduledDateTime BETWEEN :fromDateTimeValue AND :toDateTimeValue",
        IndexName: "scheduledDateTimeIndex"

    };

    return client.getAllItems(params);
};


export const getScheduledTweetsOfUser = async (cognitoUserId, toDateTime, fromDateTime) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_TWEETS_TABLE,
        KeyConditionExpression: '#cognitoUserId = :cognitoUserId AND #scheduledDateTime BETWEEN :fromDateTimeValue AND :toDateTimeValue',
        ExpressionAttributeNames: {
            "#scheduledDateTime": "scheduledDateTime",
            "#isPosted": "isPosted",
            "#cognitoUserId": "cognitoUserId"
        },
        ExpressionAttributeValues: {
            ":toDateTimeValue": toDateTime,
            ":fromDateTimeValue": fromDateTime,
            ":isPosted": false,
            ":cognitoUserId": cognitoUserId
        },
        FilterExpression: "#isPosted = :isPosted",
        IndexName: "cognitoUserIdAndScheduledDateTimeIndex"

    };

    return client.getItems(params);
};


export const deleteTwitterTweet = async (tweetId) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_TWEETS_TABLE,
        Key: {tweetId},
    };

    return client.deleteItem(params);
};

