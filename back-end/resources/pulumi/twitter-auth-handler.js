// Create an API endpoint.
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import twitter_api_v2_1 from "twitter-api-v2";
import {createTwitterUser, getTwitterUser} from "../../src/dynamodb/twitter-user.js";
import {createScheduledTweet} from "../../src/dynamodb/twitter-tweets.js"
import AWS from "aws-sdk";
import {variables} from "./variables.js";
import {userPool} from "./userpool.js";
import {get_tweet_user_timeline, postTweets} from "./twitter_utils.js";
import {allQueuedTweetsFromUser, createQueuedTweet} from "../../src/dynamodb/twitter-queued-tweets.js";


const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'X-Amz-Date,X-Api-Key,X-Amz-Security-Token,Origin,X-Requested-With,Content-Type,Accept,Authorization,x-jwt-identity-token',
};

const DEFAULT_SCHEDULE = [
    ['08:00', '16:00'],
    ['08:00', '16:00'],
    ['08:00', '16:00'],
    ['08:00', '16:00'],
    ['08:00', '16:00'],
    ['08:00', '16:00'],
    ['08:00', '16:00']
]

const DEFAULT_AUTHORIZERS = [{
    parameterName: "Authorization",
    identitySource: ["method.request.header.Authorization"],
    providerARNs: [userPool.arn],
}];

async function getUserSub(jwtToken) {
    const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
    const cognitoUser = await cognitoIdentity
        .getUser({
            AccessToken: jwtToken,
        })
        .promise();
    const sub = cognitoUser.UserAttributes.find((attr) => attr.Name === 'sub');
    return sub;
}

async function getNextEmptySlot(currentSchedule, cognitoUserId) {
    // month 0 = January, ..., 11 = December
    // day 0 = sunday, 1 = monday, ..., 6 = saturday
    // date = current date, for example if today 2022-12-30 then date = 30
    console.log("currentSchedule")
    console.log(currentSchedule)
    let currentDate = new Date();
    const today = new Date();
    while (true) {
        let year = currentDate.getFullYear() + '';
        let month = currentDate.getMonth();
        let date = currentDate.getDate();
        let day = currentDate.getDay();
        let currentHours = currentDate.getHours();
        if (currentHours < 10) {
            currentHours = '0' + currentHours;
        }
        let currentMinutes = currentDate.getMinutes();
        if (currentMinutes < 10) {
            currentMinutes = '0' + currentMinutes;
        }
        let currentTime = currentHours + ":" + currentMinutes;
        console.log("check for empty slot (year, month, date, day): " + year + " " + month + " " + date + " " + day)
        let yearMonthDate = year;
        if (month < 10) {
            month = '0' + month + '';
        } else {
            month = '' + month;
        }
        yearMonthDate += month;
        if (date < 10) {
            date = '0' + date;
        } else {
            date = '' + date;
        }
        yearMonthDate += date;

        console.log(yearMonthDate)
        let alreadyQueuedPosts = await allQueuedTweetsFromUser(yearMonthDate, cognitoUserId);
        console.log("alreadyQueuedPosts")
        console.log(alreadyQueuedPosts)
        for (const postTime of currentSchedule[day]) {
            console.log("postTime")
            console.log(postTime)
            //for all postTimes in currentSchedule check if not scheduled so far
            let foundASlot = true;
            for (const alreadyQueued of alreadyQueuedPosts) {
                if (alreadyQueued.time === postTime) {
                    foundASlot = false;
                    break;
                }
            }
            if (foundASlot) {
                //not existing, thus use as slot, if next line
                if (currentDate <= today && postTime < currentTime) {
                    //postTime has to be in the future
                    //need some offset like 10 minutes from now, remember to handle 23:55 + 10 = 00:05 and thus next day?
                    continue;
                }
                //found slot
                let hours = parseInt(postTime.split(":")[0]);
                let minutes = parseInt(postTime.split(":")[1]);
                const emptySlotDateTime = new Date(year, month, date, hours, minutes).toISOString();

                const emptySlot = {
                    postTime: postTime,
                    year: year,
                    month: month,
                    date: date,
                    emptySlotDateTime: emptySlotDateTime,
                    yearMonthDate: yearMonthDate
                }
                console.log("found slot");
                console.log(emptySlot);
                return emptySlot;
            }
        }
        //no empty slot, increase date
        currentDate.setDate((currentDate.getDate() + 1));
        currentDate.setHours(0, 0, 0, 0)
        console.log("next Date");
        console.log(currentDate)
    }
    throw "Error: no empty slot found"
}

const endpoint = new awsx.apigateway.API("twitter-get-auth-link", {
    gatewayResponses: {
        DEFAULT_4XX: {
            statusCode: 400,
            responseTemplates: {
                'application/json': '{"message":$context.error.messageString}',
            },
            responseParameters: {
                'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Methods': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Credentials': "'*'",
            },
        },
    },
    stageArgs: {
        variables: {
            DYNAMO_TWITTER_USER_TABLE: variables.dynamoDBTables['twitter-user-table'],
            DYNAMO_TWITTER_TWEETS_TABLE: variables.dynamoDBTables['tweets-table'],
            DYNAMO_TWITTER_QUEUED_TWEETS_TABLE: variables.dynamoDBTables['queued-tweets-table'],
            CONSUMER_KEY: variables.CONSUMER_KEY,
            CONSUMER_SECRET: variables.CONSUMER_SECRET
        }
    },
    routes: [
        {
            path: "/set_user_tokens",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_set_user_tokens", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            //authorizers: DEFAULT_AUTHORIZERS,
            path: "/set_user_tokens",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_set_user_tokens", {
                callback: async (event) => {
                    try {
                        const jwtToken = event.headers['x-jwt-identity-token'];
                        const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
                        const buff = new Buffer(event.body, 'base64');
                        const text = buff.toString('utf-8');
                        const data = JSON.parse(text);
                        const tokenCreationDateTime = new Date().toISOString()

                        const cognitoUser = await cognitoIdentity
                            .getUser({
                                AccessToken: jwtToken,
                            })
                            .promise();

                        const sub = cognitoUser.UserAttributes.find((attr) => attr.Name === 'sub');

                        if (!sub.Value) {
                            return {
                                statusCode: 200, body: JSON.stringify({
                                    error: "Invalid user ID"
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                        process.env.DYNAMO_TWITTER_USER_TABLE = event.stageVariables.DYNAMO_TWITTER_USER_TABLE;

                        const twitterUser = {
                            accessToken: data.accessToken,
                            accessSecret: data.accessSecret,
                            screenName: data.screenName,
                            twitterUserId: data.twitterUserId,
                            tokenCreationDateTime: tokenCreationDateTime,
                            cognitoUserId: sub.Value,
                            schedule: DEFAULT_SCHEDULE

                        };
                        console.log("twitterUser")
                        console.log(twitterUser)

                        const twitterUserReturned = await createTwitterUser(twitterUser);
                        console.log("twitterUserReturned")
                        console.log(twitterUserReturned)
                        const json_response = JSON.stringify({
                            success: 1,
                            insertedTwitterUser: twitterUserReturned
                        })
                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }

            })
        },


        {
            path: "/get_auth_link",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_get_auth_link", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/get_auth_link",
            method: "GET",
            eventHandler: new aws.lambda.CallbackFunction("GET_get_auth_link", {
                callback: async (event) => {
                    try {
                        // Create client used to generate auth links only
                        console.log("twitterAPI")

                        //bearer token AAAAAAAAAAAAAAAAAAAAALUMbwEAAAAAUn9m8jUIKQXwB1IK5N2y5THrPF0%3Do9maOplHMI6OYGjLyalPOuR9UCD2gKYoS5rLbmKalMuj1yn8Wh
                        //myaccesstoken 196133010-E1mNFHk9JmNpoo2bFi18Qtd6QxmdC2N9QOtX8SnG
                        //mysecret 14ZGAU8cLWmvuCc47GUAtBpBNO1So6UmVEZqoSPFktX39
                        const tokens = {
                            appKey: event.stageVariables.CONSUMER_KEY,
                            appSecret: event.stageVariables.CONSUMER_SECRET
                        };
                        console.log(tokens)

                        const twitter_client = new twitter_api_v2_1.TwitterApi(tokens);

                        console.log("serve authlink")
                        let originUrl = event.headers.origin;
                        console.log(originUrl)
                        let callbackUrl = originUrl + '/twitter_callback';
                        console.log("callbackUrl: " + callbackUrl)

                        const link = await twitter_client.generateAuthLink(callbackUrl);

                        console.log("link created")

                        //'Content-Type', 'application/json');
                        const json_response = JSON.stringify({
                            success: 1,
                            authLink: link.url,
                            authMode: 'callback',
                            oauth_token: link.oauth_token,
                            oauth_token_secret: link.oauth_token_secret
                        })
                        console.log("json_response created")
                        console.log(json_response)

                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },


        {
            path: "/twitter_callback",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_twitter_callback", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/twitter_callback",
            method: "GET",
            eventHandler: new aws.lambda.CallbackFunction("GET_twitter_callback", {
                callback: async (event) => {
                    try {
                        //TODO implement betterflow
                        //something like this:
                        //twitter calls twitter_callback frontend endpoint
                        //on the page we directly call this route to get accesstoken and secret for the user and store it directly in db
                        //probably no need to have the tokens in frontend, since we can get them via cognitouser, but maybe
                        //hold it in state, to easily use it when we immediately post a tweet, but sound stupid when I think about it
                        //because in backend we can use cognitouser to verify stuff, so do it there?

                        // Create client used to generate auth links only
                        console.log("twitterAPI")
                        const oauth_token = event.queryStringParameters.oauth_token;
                        const oauth_token_secret = event.queryStringParameters.oauth_token_secret;
                        const oauth_verifier = event.queryStringParameters.oauth_verifier;
                        console.log(oauth_token)
                        console.log(oauth_token_secret)
                        console.log(oauth_verifier)

                        const tokens = {
                            appKey: event.stageVariables.CONSUMER_KEY,
                            appSecret: event.stageVariables.CONSUMER_SECRET,
                            accessToken: oauth_token,
                            accessSecret: oauth_token_secret
                        };
                        console.log(tokens)

                        const twitter_client = new twitter_api_v2_1.TwitterApi(tokens);
                        const tokenCreationDateTime = new Date().toISOString();
                        const {
                            accessToken,
                            accessSecret,
                            screenName,
                            userId
                        } = await twitter_client.login(oauth_verifier);
                        console.log("jwt");
                        console.log(event.headers['x-jwt-identity-token'])
                        const sub = await getUserSub(event.headers['x-jwt-identity-token']);
                        if (!sub.Value) {
                            return {
                                statusCode: 200, body: JSON.stringify({
                                    error: "Invalid user ID"
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                        const cognitoUserId = sub.Value;
                        process.env.DYNAMO_TWITTER_USER_TABLE = event.stageVariables.DYNAMO_TWITTER_USER_TABLE;

                        const twitterUserToCreate = {
                            accessToken: accessToken,
                            accessSecret: accessSecret,
                            screenName: screenName,
                            twitterUserId: userId,
                            tokenCreationDateTime: tokenCreationDateTime,
                            cognitoUserId: cognitoUserId,
                            schedule: DEFAULT_SCHEDULE
                        };
                        console.log("twitterUser")
                        console.log(twitterUserToCreate)

                        const createdTwitterUser = await createTwitterUser(twitterUserToCreate);

                        //'Content-Type', 'application/json');
                        const json_response = JSON.stringify({
                            success: 1,
                            createdTwitterUser: createdTwitterUser
                        })
                        console.log("json_response created")
                        console.log(json_response)

                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },


        {
            path: "/send_tweets",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_send_tweets", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/send_tweets",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_send_tweets", {
                callback: async (event) => {
                    try {
                        const sub = await getUserSub(event.headers['x-jwt-identity-token']);
                        if (!sub.Value) {
                            return {
                                statusCode: 200, body: JSON.stringify({
                                    error: "Invalid user ID"
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                        const cognitoUserId = sub.Value;

                        process.env.DYNAMO_TWITTER_USER_TABLE = event.stageVariables.DYNAMO_TWITTER_USER_TABLE;
                        process.env.DYNAMO_TWITTER_TWEETS_TABLE = event.stageVariables.DYNAMO_TWITTER_TWEETS_TABLE;
                        const twitterUser = await getTwitterUser(cognitoUserId);


                        const buff = new Buffer(event.body, 'base64');
                        const text = buff.toString('utf-8');
                        const data = JSON.parse(text);
                        console.log(data)
                        try {
                            const postedTweets = await postTweets(data.tweets, data.usesThreadFinisher, twitterUser.screenName, twitterUser.accessToken, twitterUser.accessSecret)
                            const json_response = JSON.stringify({
                                success: 1,
                                postedTweets: postedTweets
                            })
                            console.log("json_response created")
                            console.log(json_response)

                            return {
                                statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                            };
                        } catch (error) {
                            console.log(error)
                            const json_response = JSON.stringify({
                                failure: "cannot send tweet"
                            })
                            console.log(json_response)
                            return {
                                statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                            };
                        }
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },

        {
            path: "/schedule_tweets",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_schedule_tweets", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/schedule_tweets",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_schedule_tweets", {
                callback: async (event) => {
                    try {
                        console.log(event.headers['x-jwt-identity-token'])
                        const sub = await getUserSub(event.headers['x-jwt-identity-token']);
                        if (!sub.Value) {
                            return {
                                statusCode: 200, body: JSON.stringify({
                                    error: "Invalid user ID"
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                        const cognitoUserId = sub.Value;
                        process.env.DYNAMO_TWITTER_USER_TABLE = event.stageVariables.DYNAMO_TWITTER_USER_TABLE;
                        process.env.DYNAMO_TWITTER_TWEETS_TABLE = event.stageVariables.DYNAMO_TWITTER_TWEETS_TABLE;

                        const text = new Buffer(event.body, 'base64').toString('utf-8')
                        const data = JSON.parse(text);
                        console.log("data");
                        console.log(data);
                        //TODO send and correctly decode images

                        const twitterUser = await getTwitterUser(cognitoUserId);
                        console.log("twitterUser")
                        console.log(twitterUser)

                        const tweetToSchedule = {
                            tweets: data.tweets,
                            scheduledDateTime: data.scheduledDateTime,
                            creationDateTime: data.creationDateTime,
                            cognitoUserId: cognitoUserId,
                            twitterUserId: twitterUser.twitterUserId,
                            isPosted: false,
                            usesThreadFinisher: data.usesThreadFinisher
                        }

                        console.log("tweetToSchedule")
                        console.log(tweetToSchedule)
                        const scheduledTweetResult = await createScheduledTweet(tweetToSchedule);

                        const json_response = JSON.stringify({
                            success: 1,
                            scheduledTweetResult: scheduledTweetResult
                        })

                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },

        {
            path: "/add_tweet_to_queue",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_add_tweet_to_queue", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/add_tweet_to_queue",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_add_tweet_to_queue", {
                callback: async (event) => {
                    try {
                        const sub = await getUserSub(event.headers['x-jwt-identity-token']);
                        if (!sub.Value) {
                            return {
                                statusCode: 200, body: JSON.stringify({
                                    error: "Invalid user ID"
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                        const cognitoUserId = sub.Value;
                        process.env.DYNAMO_TWITTER_USER_TABLE = event.stageVariables.DYNAMO_TWITTER_USER_TABLE;
                        process.env.DYNAMO_TWITTER_TWEETS_TABLE = event.stageVariables.DYNAMO_TWITTER_TWEETS_TABLE;
                        process.env.DYNAMO_TWITTER_QUEUED_TWEETS_TABLE = event.stageVariables.DYNAMO_TWITTER_QUEUED_TWEETS_TABLE;
                        process.env.DYNAMO_USER_TABLE = variables.dynamoDBTables['user-table'];
                        const text = new Buffer(event.body, 'base64').toString('utf-8')
                        const data = JSON.parse(text);
                        console.log("data");
                        console.log(data);
                        const twitterUser = await getTwitterUser(cognitoUserId);
                        if (twitterUser.schedule === undefined) {
                            twitterUser.schedule = DEFAULT_SCHEDULE;
                        }
                        console.log("twitterUser")
                        console.log(twitterUser)

                        const emptySlot = await getNextEmptySlot(twitterUser.schedule, cognitoUserId); // TODO: fix race condition, if a tweet is not scheduled, maybe two have the same time

                        const tweetId = AWS.util.uuid.v4();
                        const queuedTweet = {
                            tweetId: tweetId,
                            cognitoUserId: cognitoUserId,
                            twitterUserId: twitterUser.twitterUserId,
                            year: emptySlot.year,
                            month: emptySlot.month,
                            date: emptySlot.date,
                            time: emptySlot.postTime,
                            yearMonthDate: emptySlot.yearMonthDate
                        }
                        const tweetToSchedule = {
                            tweets: data.tweets,
                            scheduledDateTime: emptySlot.emptySlotDateTime,
                            creationDateTime: data.creationDateTime,
                            cognitoUserId: cognitoUserId,
                            twitterUserId: twitterUser.twitterUserId,
                            isPosted: false,
                            usesThreadFinisher: data.usesThreadFinisher,
                            tweetId: tweetId,
                            isQueued: true
                        }

                        console.log("tweetToSchedule")
                        console.log(queuedTweet)
                        console.log(tweetToSchedule)

                        const queuedTweetResult = await createQueuedTweet(queuedTweet);
                        const scheduledTweetResult = await createScheduledTweet(tweetToSchedule);
                        const json_response = JSON.stringify({
                            queuedTweetResult: queuedTweetResult,
                            scheduledTweetResult: scheduledTweetResult
                        })

                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },


        //example how to implement a twitter backend feature
        // options thing is required by aws
        // main stuff happens in the method: "POST"
        {
            path: "/daily_twitter_stats",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_daily_twitter_stats", { //It's important to give a name, so you can easily find the correct logs in aws.
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/daily_twitter_stats", //has to match path of the above options method
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_daily_twitter_stats", {
                callback: async (event) => {
                    try {
                        //Get data from request:
                        const buff = new Buffer(event.body, 'base64');
                        const text = buff.toString('utf-8');
                        const data = JSON.parse(text);
                        console.log(data);
                        const twitterUserId = data.twitterUserId;
                        const accessToken = data.accessToken;
                        const accessSecret = data.accessSecret;
                        const onlyTodayTweets = true;

                        // get all tweets/replies/retweets/quotes
                        const userTimeline = await get_tweet_user_timeline(twitterUserId, accessToken, accessSecret, onlyTodayTweets);
                        console.log(userTimeline)

                        //now aggregate data
                        let tweetCounter = 0;
                        let threadCounter = 0;
                        let replyCounter = 0;
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

                        //prepare result
                        let json_response = JSON.stringify({
                            tweetCounter: tweetCounter,
                            threadCounter: threadCounter,
                            replyCounter: replyCounter,
                            retweetCounter: retweetCounter,
                            quoteCounter: quoteCounter
                        })
                        return {
                            statusCode: 200, body: json_response, headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)
                        const {message} = error;
                        return {
                            statusCode: 500,
                            body: JSON.stringify({
                                failure: 1,
                                message: message,
                            }),
                            headers: DEFAULT_HEADERS,
                        };
                    }
                }

            })
        },


    ],
});


export const twitterAuthLinkEndpoint = endpoint.url;
