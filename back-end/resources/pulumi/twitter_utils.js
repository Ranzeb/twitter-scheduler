import {variables} from "./variables.js";
import twitter_api_v2_1 from "twitter-api-v2";
import {twitterMediaBucket} from "./storage-s3.js";
import AWS from "aws-sdk";
import {EUploadMimeType} from "twitter-api-v2/dist/types/v1/tweet.v1.types.js";


//https://docs.aws.amazon.com/AmazonS3/latest/userguide/example_s3_GetObject_section.html
// Create a helper function to convert a ReadableStream to a string.


function encode(data) {
    let str = data.reduce(function (a, b) {
        return a + String.fromCharCode(b)
    }, '');
    return Buffer.from(str).toString('base64').replace(/.{76}(?=.)/g, '$&\n');
}

const getMediaFromS3 = async (mediaS3Urls) => {
    let mediaList = [];
    let s3 = new AWS.S3();
    console.log(twitterMediaBucket.bucket.get())
    console.log(twitterMediaBucket.bucket)
    const extensionToMimeType = {
        'jpeg': EUploadMimeType.Jpeg,
        'jpg': EUploadMimeType.Jpeg,
        'png': EUploadMimeType.Png,
        'mp4': EUploadMimeType.Mp4,
        'webp': EUploadMimeType.Webp,
        'gif': EUploadMimeType.Gif
    }
    for (const mediaUrl of mediaS3Urls) {
        console.log("wait for promise")

        const bucketParams = {
            Bucket: twitterMediaBucket.bucket.get(),
            Key: mediaUrl,
        };
        const extension = mediaUrl.split('.').pop().toLowerCase()
        const mimeType = extensionToMimeType[extension];
        console.log(extension)
        console.log(mimeType)
        const mediaObj = await s3.getObject(bucketParams).promise()
        mediaList.push({media: mediaObj.Body, mimeType: mimeType})
    }
    return mediaList;
}

export async function postTweets(tweets, usesThreadFinisher, screenName, accessToken, accessSecret) {
    /**
     * Requires tweets to be list of objects with properties:
     * tweetText, mediaList
     * @type {{appKey: string, appSecret: string, accessToken, accessSecret}}
     */
    const tokens = {
        appKey: variables.CONSUMER_KEY,
        appSecret: variables.CONSUMER_SECRET,
        accessToken: accessToken,
        accessSecret: accessSecret
    };
    console.log("tokens");
    console.log(tokens);
    if (tweets.length === 1) {
        return _postSingleTweet(tweets[0], tokens);
    } else {
        return _postTweetThread(tweets, usesThreadFinisher, screenName, tokens)
    }
}

async function uploadMediaListToTwitter(mediaList, client) {
    const media_ids = [];
    for (const mediaItem of mediaList) {
        media_ids.push(await client.v1.uploadMedia(
            Buffer.from(mediaItem.media),
            {mimeType: mediaItem.mimeType}
        ));
    }
    return media_ids;
}

async function _postSingleTweet(tweet, tokens) {
    try {
        const client = new twitter_api_v2_1.TwitterApi(tokens);
        let payload = {};
        if (tweet.mediaS3Urls.length > 0) {
            console.log("get media from s3")
            //TEST IF IMAGE UPLOAD WORKS, I added type, maybe use other buffer in getmediafroms3
            const mediaList = await getMediaFromS3(tweet.mediaS3Urls);
            payload['media'] = {media_ids: await uploadMediaListToTwitter(mediaList, client)};
        } else if ('poll' in tweet && tweet.poll !== null && tweet.poll !== undefined && Object.keys(tweet.poll).length > 0) {
            payload['poll'] = tweet.poll;
        }
        console.log(payload);
        let postedTweet;
        if (Object.keys(payload).length === 0) {
            postedTweet = await client.v2.tweet(tweet.tweetText);
        } else {
            postedTweet = await client.v2.tweet(tweet.tweetText, payload);
        }

        return [postedTweet];
    } catch (error) {
        console.log("error in _postTweetThread")
        console.log(error)
    }
    return [];
}

async function tweetThreadWithFinisher(tweets, client, screenName) {
    /**
     * Post a series of tweets + thread finisher
     * basically like tweetThread() of the library, but additionally handling thread finisher (=> add first tweet reference in last tweet)
     */
    const postedTweets = [];
    for (const tweet of tweets) {
        // Retrieve the last sent tweet
        const lastTweet = postedTweets.length ? postedTweets[postedTweets.length - 1] : null;
        // Build the tweet query params
        let queryParams = {};
        const isLastTweet = postedTweets.length === tweets.length - 1
        if (isLastTweet === true) {
            const urlToFirstTweet = 'https://twitter.com/' + screenName + "/status/" + postedTweets[0].data.id;
            console.log("last tweet")
            console.log(urlToFirstTweet)
            console.log(tweet)
            //TODO just assumed it is string, since useThreadFinisher requires it
            queryParams = {text: tweet.text + '\n' + urlToFirstTweet + '\n'}
        } else {
            console.log("not last tweet")
            queryParams = {...(typeof tweet === 'string' ? ({text: tweet}) : tweet)}
        }
        // Reply to an existing tweet if needed
        let inReplyToId = null;
        if ('reply' in queryParams) {
            inReplyToId = queryParams.reply.in_reply_to_tweet_id;
        }
        if (lastTweet !== null) {
            inReplyToId = lastTweet.data.id;
        }
        let status = '';
        if ('text' in queryParams && queryParams.text !== null && queryParams.text !== undefined) {
            status = queryParams.text;
        }
        if (inReplyToId !== null) {
            postedTweets.push(await client.v2.reply(status, inReplyToId, queryParams));
        } else {
            postedTweets.push(await client.v2.tweet(status, queryParams));
        }
    }

    return postedTweets;

}

async function _postTweetThread(tweets, usesThreadFinisher, screenName, tokens) {
    try {
        const client = new twitter_api_v2_1.TwitterApi(tokens);
        const processedTweets = [];
        for (const tweet of tweets) {
            console.log(tweet)
            if (tweet.mediaS3Urls.length > 0) {
                const mediaList = await getMediaFromS3(tweet.mediaS3Urls);
                const media_ids = await uploadMediaListToTwitter(mediaList, client);
                processedTweets.push({
                    text: tweet.tweetText,
                    media: {media_ids: media_ids}
                })
            } else if ('poll' in tweet && tweet.poll !== null && tweet.poll !== undefined && Object.keys(tweet.poll).length > 0) {
                processedTweets.push({
                    text: tweet.tweetText,
                    poll: tweet.poll
                })
            } else {
                processedTweets.push({
                    text: tweet.tweetText
                })
            }
        }
        console.log("_postTweetThread")
        console.log(processedTweets)
        let postedTweets;
        if (usesThreadFinisher) {
            postedTweets = await tweetThreadWithFinisher(processedTweets, client, screenName);
        } else {
            postedTweets = await client.v2.tweetThread(processedTweets);
        }
        console.log("success")
        console.log(postedTweets)
        return postedTweets;
    } catch (error) {
        console.log("error in _postTweetThread")
        console.log(error)
    }

    return [];
}


export async function get_tweet_user_timeline(twitterUserId, accessToken, accessSecret, onlyTodayTweets) {
    /*
    Gets tweets/replies/retweets/quotes of a user.
    If onlyTodayTweets=true then this function gets only data for today.
    Twitter API allows only to get up to 3500 tweets, but I guess it doesn't make sense to get that much data.
    If we want to access more data, we would need to aggregate stuff and save it in dynamodb.
    This might make sense at some point, also just for saving data from the day before, so we don't have to refetch it everytime.
    For example when we want to display statistics over the past 7 days, we could fetch past days once and store it. Then only fetch current day (since might change) and new days in the future.
     */
    const tokens = {
        appKey: variables.CONSUMER_KEY,
        appSecret: variables.CONSUMER_SECRET,
        accessToken: accessToken,
        accessSecret: accessSecret
    };
    const client = new twitter_api_v2_1.TwitterApi(tokens);
    const tweets = await client.v1.userTimeline(twitterUserId); // to use v2 just do client.v2.METHOD

    let userTweets = [];
    let startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0)
    for await (const tweet of tweets) {
        if (onlyTodayTweets && new Date(tweet.created_at) < startOfToday) {
            break;
        }
        userTweets.push(tweet)
    }
    return userTweets;
}