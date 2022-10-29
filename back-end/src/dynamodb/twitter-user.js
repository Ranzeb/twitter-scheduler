import {client} from './client.js';

/**
 * Get a twitter user given an (cognito) id
 * @param id
 */
export const getTwitterUser = async (cognitoUserId) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_USER_TABLE,
        Key: {cognitoUserId},
    };

    return client.getItem(params);
};


export const createTwitterUser = async (user) => {
    const params = {
        TableName: process.env.DYNAMO_TWITTER_USER_TABLE,
        Item: user,
    };

    return client.putItem(params);
};
