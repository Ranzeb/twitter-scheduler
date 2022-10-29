import {client} from './client.js';

/**
 * Get a cognito user given an id
 * @param id
 */
export const getCognitoUser = async (id) => {
    const params = {
        TableName: process.env.DYNAMO_USER_TABLE,
        Key: {id},
    };

    return client.getItem(params);
};

export const createCognitoUser = async (user) => {
    const params = {
        TableName: process.env.DYNAMO_USER_TABLE,
        Item: user,
    };

    return client.putItem(params);
};

export const updateCognitoUser = async (cognitoUser) => {
    return client.updateDynamicItem(process.env.DYNAMO_USER_TABLE, cognitoUser, 'id');
};

export const getCognitoUserByStripeCustomerId = async (stripeCustomerId) => {
    console.log("table")
    console.log(process.env.DYNAMO_USER_TABLE)
    const params = {
        TableName: process.env.DYNAMO_USER_TABLE,
        KeyConditionExpression: '#stripeCustomerId = :stripeCustomerId',
        ExpressionAttributeNames: {
            "#stripeCustomerId": "stripeCustomerId"
        },
        ExpressionAttributeValues: {
            ":stripeCustomerId": stripeCustomerId
        },
        IndexName: "stripeCustomerIdIndex"

    };

    return client.getItems(params);
};