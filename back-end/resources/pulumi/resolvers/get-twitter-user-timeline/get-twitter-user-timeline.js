import AWS from 'aws-sdk';
import * as aws from '@pulumi/aws';
import {createCallbackResponse} from '../../../../src/utils/response.js';
import {variables} from '../../variables.js';
import {get_tweet_user_timeline} from "../../twitter_utils.js";

export const handler = async (event, context, callback) => {
    console.log('event', JSON.stringify(event, null, 2));
    const response = createCallbackResponse(callback);
    //TODO test this
    console.log("TODO test this")
    console.log(event)
    console.log(context)
    console.log(event.arguments)
    const twitterUserId = event.arguments.twitterUserId;
    const accessToken = event.arguments.accessToken;
    const accessSecret = event.arguments.accessSecret;

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

        const userTimeline = await get_tweet_user_timeline(twitterUserId, accessToken, accessSecret);

        if (!userTimeline) {
            return response({
                statusCode: 404,
                message: `Error getting user timeline for user "${twitterUserId}"`,
            });
        }

        return response({statusCode: 200, data: userTimeline});
    } catch (error) {
        console.error(error);

        const {message} = error;
        return response({statusCode: 500, message});
    }
};
