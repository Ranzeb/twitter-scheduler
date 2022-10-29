import * as aws from "@pulumi/aws";
import {allTweetsToSchedule, updateTweet} from "../../src/dynamodb/twitter-tweets.js";
import {getTwitterUser} from "../../src/dynamodb/twitter-user.js";
import {variables} from './variables.js';
import {postTweets} from "./twitter_utils.js";


async function postScheduledTweetOrThread(tweetOrThread) {
    //TODO handle refresh of tokens, maybe do it periodically with another cron job?
    //in the beginnig just do it here
    //TODO: implement logging and error logging, like email to user and to us, so we can figure out the issue
    //TODO: remove scheduled tweets if user unsubscribes or deletes account
    //TODO maybe save tweet not in plain text
    //TODO figure out if it is possible to include media and emojis
    try {
        //TODO handle stuff like user is no longer in db ???
        const twitterUser = await getTwitterUser(tweetOrThread.cognitoUserId);
        console.log(twitterUser)
        console.log(tweetOrThread)
        const result = postTweets(
            tweetOrThread.tweets,
            tweetOrThread.usesThreadFinisher,
            tweetOrThread.twitterUserId,
            twitterUser.accessToken,
            twitterUser.accessSecret)
        return result
    } catch (error) {
        console.log("error postScheduledTweetOrThread")
        console.log(error)
        return new Promise((resolve, reject) => {
            reject(error)
        })
    }


}

async function waitForPostJobsToBeExecuted(postPromises, toScheduleTweets) {
    console.log("Wait for postPromises to settle...")
    try {
        const results = await Promise.allSettled(postPromises);
        console.log("postPromises settled")
        for (const idx in results) {
            try {
                let currentTweetOrThread = toScheduleTweets[idx]
                const result = results[idx]
                if (result.status === 'fulfilled') {
                    const postedTwitterTweetIds = [];
                    console.log("result.value")
                    console.log(result.value)
                    for (const postedTweet of result.value) {
                        postedTwitterTweetIds.push(postedTweet.data.id)
                    }
                    console.log("postedTwitterTweetIds")
                    console.log(postedTwitterTweetIds)
                    currentTweetOrThread.twitterTweetIds = postedTwitterTweetIds;
                    currentTweetOrThread.isPosted = true;
                    currentTweetOrThread.postDateTime = (new Date()).toISOString()
                    if ('reason' in currentTweetOrThread) {
                        delete currentTweetOrThread.reason;
                    }
                    try {
                        console.log("currentTweetOrThread update")
                        console.log(currentTweetOrThread)
                        const updatedTweet = await updateTweet(currentTweetOrThread);
                        console.log("success in updating tweet")
                    } catch (e) {
                        console.log("failure in updating tweet")
                        console.log(e)
                    }
                } else { //rejected
                    console.log("some error while scheduling tweet")
                    console.log(currentTweetOrThread)
                    console.log(result)
                    const reason = result.reason;
                    console.log(reason)
                    try {
                        console.log(reason.message)
                        currentTweetOrThread.reason = reason.toString()
                        const updatedTweet = await updateTweet(currentTweetOrThread);
                        console.log("success in adding reason to tweet")
                    } catch (e) {
                        console.log("failure in adding reason to tweet")
                        console.log(e)
                    }
                }
            } catch (error) {
                console.log("error waitForPostJobsToBeExecuted")
                console.log(results[idx])
                console.log(error)
            }
        }
    } catch (error) {
        console.log("error in allSettled")
        console.log(error)
    }
}

// A handler function that will post tweets periodically objects in the bucket and bulk delete them
const postScheduledTweets = async (event) => {
    //TODO get from dynamodb tweets table, no matter the user, get to schedule tweets
    //TODO order by user and then fetch user info like accessToken and secret
    //maybe when reading from Dynamo add rangekey = cognitouserid and set primary key to tweetid
    let todatetime = new Date().toISOString();
    let fromdatetime = new Date();
    fromdatetime.setFullYear(2021);
    fromdatetime.setMonth(11);
    fromdatetime = fromdatetime.toISOString();
    console.log("fromdatetime/todatetime")
    console.log(fromdatetime)
    console.log(todatetime)

    process.env.DYNAMO_TWITTER_TWEETS_TABLE = variables.dynamoDBTables['tweets-table'].value
    process.env.DYNAMO_TWITTER_USER_TABLE = variables.dynamoDBTables['twitter-user-table'].value

    const toScheduleTweets = await allTweetsToSchedule(todatetime, fromdatetime);
    console.log("number of tweets, that need to be scheduled " + toScheduleTweets.length);
    console.log(toScheduleTweets);
    if (toScheduleTweets.length === 0) {
        return
    }

    //TODO: to speed up, do it in chunks, like per user or so
    //TODO we can also use pagination to only get x tweets and do it in parallel or at least have one scheduler which calls lambda functions which each works on x tweets
    try {
        const postPromises = [];
        for (const tweetOrThread of toScheduleTweets) {
            try {
                postPromises.push(postScheduledTweetOrThread(tweetOrThread));
            } catch (error) {
                console.log("error waitForPostJobsToBeExecuted")
                console.log(tweetOrThread)
                console.log(error)
            }

        }

        //wait for all tweets to be posted (at least it was tried, maybe some error)
        //TODO implement notifaction for user and us, so we know if something fails and can fix it
        //maybe we can fix some errors, like old tokens automatically
        await waitForPostJobsToBeExecuted(postPromises, toScheduleTweets);
    } catch (error) {
        console.log("error overall")
        console.log(error)
    }

};


// Schedule the function to run every minute
// More info on Schedule Expressions at
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
export const postScheduledTweetsSchedule = aws.cloudwatch.onSchedule(
    "postScheduledTweets",
    "cron(0/1 * * * ? *)",
    postScheduledTweets,
);