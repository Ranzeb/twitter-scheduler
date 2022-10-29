/**
 * Helper function for creating a Lambda Function response.
 */
export const response = (responseData) => {
    const {statusCode, message, data} = responseData;

    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            success: !!data || statusCode < 300,
            message,
            data,
        }),
    };
};

/**
 * Helper function for creating a Lambda Function callback response.
 */
export const createCallbackResponse = (callback) => (responseData) => {
    const {statusCode, message, data} = responseData;

    if (!!data || statusCode < 300) {
        return callback(null, data);
    }

    return callback(message ? new Error(message) : 'An unknown error occured');
};
