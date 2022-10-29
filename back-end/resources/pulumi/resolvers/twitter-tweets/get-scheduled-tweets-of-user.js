import AWS from 'aws-sdk';
import * as aws from '@pulumi/aws';
import {getScheduledTweetsOfUser} from '../../../../src/dynamodb/twitter-tweets.js';
import {createCallbackResponse} from '../../../../src/utils/response.js';
import {variables} from '../../variables.js';

/**
 * Get a user from the DynamoDB table.
 */
export const handler = async (event, context, callback) => {
    console.log('event', JSON.stringify(event, null, 2));
    const response = createCallbackResponse(callback);
    console.log(event)
    console.log(context)
    console.log(event.arguments)
    const toDateTime = event.arguments.toDateTime;
    const fromDateTime = event.arguments.fromDateTime;

    const jwtToken = event.request.headers['x-jwt-identity-token'];
    const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});

    try {
        const cognitoUser = await cognitoIdentity
            .getUser({
                AccessToken: jwtToken,
            })
            .promise();

        const sub = cognitoUser.UserAttributes.find((attr) => attr.Name === 'sub');

        if (!sub?.Value) {
            throw Error('Invalid user ID');
        }

        const cognitoUserId = sub.Value;

        const scheduledTweets = await getScheduledTweetsOfUser(cognitoUserId, toDateTime, fromDateTime);
        for (const tweets of scheduledTweets) {
            console.log(tweets)
            console.log(typeof tweets)
            console.log(tweets.cognitoUserId)
            console.log(tweets.tweets)
            for (const tweet of tweets.tweets) {
                console.log(tweet)
            }
        }
        if (!scheduledTweets) {
            return response({
                statusCode: 404,
                message: `No scheduled Tweets found for user with ID "${cognitoUserId}"`,
            });
        }

        return response({statusCode: 200, data: scheduledTweets});
    } catch (error) {
        console.error(error);

        const {message} = error;
        return response({statusCode: 500, message});
    }
};
