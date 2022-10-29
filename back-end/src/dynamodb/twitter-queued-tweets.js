import AWS from 'aws-sdk';
import {client} from './client.js';

export const createQueuedTweet = async (queuedTweet) => {
    console.log("createQueuedTweet")
    console.log(queuedTweet)
    const paramsForQueuedTweetsTable = {
        TableName: process.env.DYNAMO_TWITTER_QUEUED_TWEETS_TABLE,
        Item: queuedTweet,
    };
    return client.putItem(paramsForQueuedTweetsTable);
}

export const updateQueuedTweet = async (tweet) => {
    return client.updateDynamicItem(process.env.DYNAMO_TWITTER_QUEUED_TWEETS_TABLE, tweet, 'tweetId');
};


export const allQueuedTweetsFromUser = async (yearMonthDate, cognitoUserId) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_QUEUED_TWEETS_TABLE,
        ExpressionAttributeNames: {
            "#yearMonthDate": "yearMonthDate",
            "#cognitoUserId": "cognitoUserId"
        },
        ExpressionAttributeValues: {
            ":yearMonthDate": yearMonthDate,
            ":cognitoUserId": cognitoUserId
        },
        FilterExpression: "#cognitoUserId = :cognitoUserId AND #yearMonthDate = :yearMonthDate",
        IndexName: "cognitoUserIdAndYearMonthDateIndex"
    };
    console.log(params)

    return client.getAllItems(params);
};

export const deleteTwitterTweet = async (tweetId) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_TWEETS_TABLE,
        Key: {tweetId},
    };

    return client.deleteItem(params);
};

