import AWS from 'aws-sdk';
import { variables } from '../../resources/pulumi/variables.js';

AWS.config.update({ region: variables.region });

/**
 * Get all items from a table
 * Helper function
 * @param params
 */
const getAllItems = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    let items = [];
    const result = await docdbb.scan(params).promise();

    if (!result.Items) {
        return null;
    }

    items = [...result.Items];

    if (result.LastEvaluatedKey) {
        const nextItems = await getAllItems({
            ...params,
            ExclusiveStartKey: result.LastEvaluatedKey,
        });

        if (nextItems) {
            items = [...items, ...nextItems];
        }
    }

    return items;
};

/**
 * Get all items from a query
 * Helper function
 * @param params
 */
const getItems = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    let items = [];
    const result = await docdbb.query(params).promise();

    if (!result.Items) {
        return null;
    }

    items = [...result.Items];

    if (result.LastEvaluatedKey) {
        const nextItems = await getItems({
            ...params,
            ExclusiveStartKey: result.LastEvaluatedKey,
        });

        if (nextItems) {
            items = [...items, ...nextItems];
        }
    }

    return items;
};

/**
 * Get count from a query
 * Helper function
 * @param params
 * @returns
 */
const getCount = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    const result = await docdbb.query(params).promise();

    if (result.Count === undefined) {
        return null;
    }

    return result.Count;
};

/**
 * Get a specific item
 * @param params
 */
const getItem = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    const result = await docdbb.get(params).promise();

    if (!result.Item) {
        return null;
    }

    return result.Item;
};

/**
 * Update a specific item
 * @param params
 */
const updateItem = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    const result = await docdbb.update({ ...params, ReturnValues: 'ALL_NEW' }).promise();

    if (!result.$response.data) {
        return null;
    }

    return result.$response.data.Attributes;
};

const updateDynamicItem = async(tableName, item, identifier) => {
    const updateItem= { ...item };
    delete updateItem[identifier];

    Object.entries(updateItem).forEach(([key, value]) => {
        if (value === undefined) {
            delete updateItem[key];
        }
    });

    const UpdateExpression = Object.keys(updateItem).reduce(
        (expr, key, i, arr) => `${expr} #${key} = :${key}${i !== arr.length - 1 ? ',' : ''}`,
        'SET ',
    );

    const ExpressionAttributeNames = Object.keys(updateItem).reduce((values, key) => {
        values[`#${key}`] = key;
        return values;
    }, {});

    const ExpressionAttributeValues = Object.entries(updateItem).reduce((values, [key, value]) => {
        values[`:${key}`] = value;
        return values;
    }, {} );

    const params = {
        TableName: `${tableName}`,
        Key: { [identifier]: item[identifier] },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
    };

    return client.updateItem(params);
};

/**
 * Add an item
 * @param params
 */
const putItem = async (params) => {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    await docdbb.put(params).promise();

    return params.Item;
};

/**
 * Delete an item
 * @param params
 * @returns
 */
const deleteItem = async (params)=> {
    const docdbb = new AWS.DynamoDB.DocumentClient();

    const result = await docdbb.delete({ ...params, ReturnValues: 'ALL_OLD' }).promise();

    if (!result.$response.data) {
        return null;
    }

    return result.$response.data.Attributes;
};

export const client = {
    getAllItems,
    getItems,
    getCount,
    getItem,
    updateItem,
    updateDynamicItem,
    putItem,
    deleteItem,
};
