import AWS from 'aws-sdk';
import * as aws from '@pulumi/aws';
import {getCognitoUser} from '../../../../src/dynamodb/cognito-user.js';
import {createCallbackResponse} from '../../../../src/utils/response.js';
import {variables} from '../../variables.js';
import {get_tweet_user_timeline} from "../../twitter_utils.js";

/**
 * Get a user from the DynamoDB table.
 */
export const handler = async (event, context, callback) => {
    console.log('event', JSON.stringify(event, null, 2));
    const response = createCallbackResponse(callback);

    console.log(event)
    console.log(context)
    console.log(event.arguments)
    const usedDateTime = event.arguments.usedDateTime;
    const twitterUserId = event.arguments.twitterUserId;
    const accessToken = event.arguments.accessToken;
    const accessSecret = event.arguments.accessSecret;

    try {
        const userTimeline = await get_tweet_user_timeline(twitterUserId, accessToken, accessSecret);
        console.log(userTimeline)
        //TODO aggregate and return statistics

        let tweetCounter = 0;
        let threadCounter = 0;
        let replyCounter = 0;
        let likesCounter = 0;
        let retweetCounter = 0;
        let quoteCounter = 0;
        for (const tweet of userTimeline) {
            console.log(tweet)
            if (tweet.in_reply_to_user_id !== null) {
                //is reply or part of thread???
                if (tweet.in_reply_to_user_id === tweet.user.id) {
                    //thread???
                    console.log("part of thread")
                } else {
                    replyCounter += 1;
                    console.log("reply")
                }
            } else if (tweet.is_quote_status === true) {
                //is quoted tweet
                console.log("quoted")
                quoteCounter += 1;
            } else if ('retweeted_status' in tweet && tweet.retweeted_status !== null) {
                //is retweet
                console.log("retweet")
                retweetCounter += 1;
            } else {
                //is regular tweet / thread
                console.log("regular tweet or thread")
                tweetCounter += 1;
                threadCounter += 1;
            }
        }

        if (!userTimeline) {
            return response({
                statusCode: 500,
                message: `Error getting user timeline for user "${twitterUserId}"`,
            });
        }

        return response({
            statusCode: 200, data: {
                tweetCounter: tweetCounter,
                threadCounter: threadCounter,
                replyCounter: replyCounter,
                likesCounter: likesCounter,
                retweetCounter: retweetCounter,
                quoteCounter: quoteCounter
            }
        });
    } catch (error) {
        console.error(error);

        const {message} = error;
        return response({statusCode: 500, message});
    }
};
