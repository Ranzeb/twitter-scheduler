import {API, Storage} from "aws-amplify";
import {v4 as uuidv4} from 'uuid';


export const scheduleTweetsAndUploadMediaToS3 = async (tweets, scheduledDateTime, usesThreadFinisher, jwtToken, identityId) => {
    const currentTweets = [...tweets]
    const processedTweets = await uploadMediaToS3(currentTweets, identityId);
    await _scheduleProcessedTweets(processedTweets, scheduledDateTime, usesThreadFinisher, jwtToken);
}

export const uploadMediaToS3 = async (tweets, identityId) => {
    const processedTweets = [];

    for (const index in tweets) {
        let mediaS3Urls = [];
        for (const mediaObj of tweets[index].media) {
            if ('s3Url' in mediaObj) {
                console.log("already s3url")
                console.log(mediaObj)
                mediaS3Urls.push(mediaObj.s3Url);
                continue;
            }
            const fileKey = `${uuidv4()}.${mediaObj.extension}`
            console.log(mediaObj)
            console.log(fileKey)
            try {
                const res = await Storage.put(fileKey, mediaObj.file, {
                    //TODO show upload progress to user, so user nows stuff is uploading, maybe in the place where
                    //normally media is displayed, there show some progress bar
                    //we can pass a function progressCallback from TweetBox down until here and use it
                    //so we know which position the media progress bar should be located at
                    level: "private",
                    progressCallback(progress) {
                        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
                    },
                });
                console.log(res);
            } catch (error) {
                console.log("error in uploadMediaToS3")
                console.log(error)
            }
            mediaS3Urls.push("private/" + identityId + "/" + fileKey)
        }
        console.log(tweets)
        processedTweets.push({
            tweetText: tweets[index].tweetText,
            mediaS3Urls: mediaS3Urls,
            poll: convertFrontendPollToBackendPoll(tweets[index].poll)
        })
    }
    return processedTweets;
}
const _addProcessedTweetsToQueue = async (tweets, usesThreadFinisher, jwtToken) => {
    //TODO this is slow, how to fix that?
    //maybe return more quickly and do it async in background, if some error occures, send email to user and us
    //pay attention that all tokens and all other data is available, since these errors can be reported immedately
    const apiName = "get-auth-link-api";
    const path = "/add_tweet_to_queue";
    const headers = {'x-jwt-identity-token': jwtToken};

    const body_ = {
        tweets: tweets,
        creationDateTime: new Date().toISOString(),
        usesThreadFinisher: usesThreadFinisher,
    }
    console.log(body_);

    const myInit = {
        headers: headers,
        body: body_
    };
    console.log(myInit)
    await API.post(apiName, path, myInit)
}
const _scheduleProcessedTweets = async (tweets, scheduledDateTime, usesThreadFinisher, jwtToken) => {
    //TODO this is slow, how to fix that?
    //Probably use graphql dynamo instead of lambda request.
    //look at handleUpdateTweet function, this way should be faster, if no lambda involved?
    //I think createTwitterTweetResolver is already correct, but need to double check and also test if it is actually faster
    const apiName = "get-auth-link-api";
    const path = "/schedule_tweets";

    console.log("scheduledDateTime")
    console.log(scheduledDateTime)

    const headers = {'x-jwt-identity-token': jwtToken};

    const body_ = {
        tweets: tweets,
        scheduledDateTime: scheduledDateTime.toISOString(),
        creationDateTime: new Date().toISOString(),
        usesThreadFinisher: usesThreadFinisher,
    }
    console.log(body_);

    const myInit = {
        headers: headers,
        body: body_
    };
    console.log(myInit)
    await API.post(apiName, path, myInit)
}

export const sendTweets = async (tweets, usesThreadFinisher, jwtToken, identityId) => {
    let currentTweets = [...tweets];
    currentTweets = await uploadMediaToS3(currentTweets, identityId);
    const processedTweets = [];
    for (const tweet of currentTweets) {
        processedTweets.push({
            tweetText: tweet.tweetText,
            mediaS3Urls: tweet.mediaS3Urls,
            poll: tweet.poll
        })
    }
    await _sendProcessedTweets(processedTweets, usesThreadFinisher, jwtToken);
}
export const addTweetsToQueue = async (tweets, usesThreadFinisher, jwtToken, identityId) => {
    const currentTweets = [...tweets]
    const processedTweets = await uploadMediaToS3(currentTweets, identityId);
    await _addProcessedTweetsToQueue(processedTweets, usesThreadFinisher, jwtToken);
}


const _sendProcessedTweets = async (tweets, usesThreadFinisher, jwtToken) => {
    const apiName = "get-auth-link-api";
    const path = "/send_tweets";

    const body_ = {
        tweets: tweets,
        usesThreadFinisher: usesThreadFinisher
    }
    const headers = {'x-jwt-identity-token': jwtToken};
    const myInit = {
        body: body_,
        headers: headers
    };
    console.log(myInit)
    await API.post(apiName, path, myInit)
}

export const executeCallback = async (searchParams, setTwitterUser, jwtToken) => {
    const oauth_token = searchParams.get("oauth_token")
    const oauth_verifier = searchParams.get("oauth_verifier");
    let userAccessSecret = sessionStorage.getItem('userAccessSecret')
    console.log("userAccessSecret is " + userAccessSecret)

    const apiName = "get-auth-link-api";
    const path = "/twitter_callback";

    const headers = {'x-jwt-identity-token': jwtToken};
    const myInit = { // OPTIONAL
        headers: headers,
        response: true,
        queryStringParameters: {  // OPTIONAL
            oauth_token: oauth_token,
            oauth_verifier: oauth_verifier,
            oauth_token_secret: userAccessSecret
        },
    };
    const response = await API.get(apiName, path, myInit)
    return response;
};

const MAX_NUMBER_OF_CHARS_PER_TWEET = 280
const TWEET_TO_LONG_MESSAGE = 'The maximum number of characters per tweet is 280 (Twitter requirement).'
const TWEET_NEEDS_TEXT_OR_MEDIA_MESSAGE = 'Your tweet cannot be empty, you need some text or media.'
const INVALID = 'invalid';
const VALID = 'valid'
const IMAGE_EXTENSIONS = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_EXTENSIONS = ["video/mp4",];
const GIF_EXTENSIONS = ["image/gif"];
//const IMAGE_MAX_WIDTH = 1280;
//const IMAGE_MAX_HEIGHT = 1080;
const IMAGE_FILE_SIZE_LIMIT = 5;
const IMAGE_SIZE_TOO_LARGE_MESSAGE = 'Your image is too large. Twitter allows only images up to a size of ' + IMAGE_FILE_SIZE_LIMIT + ' MB'

const VIDEO_MAX_WIDTH = 1280;
const VIDEO_MAX_HEIGHT = 1024;
const VIDEO_MIN_WIDTH = 32;
const VIDEO_MIN_HEIGHT = 32;
const VIDEO_FILE_SIZE_LIMIT = 512;
const VIDEO_SIZE_TOO_LARGE_MESSAGE = 'Your video is too large. Twitter allows only videos up to a size of ' + VIDEO_FILE_SIZE_LIMIT + ' MB'
const VIDEO_TOO_LARGE_RESOLUTION_MESSAGE = "Your video's resolution is too large. Twitter only allows videos of a resolution <= " + VIDEO_MAX_WIDTH + "x" + VIDEO_MAX_HEIGHT
const VIDEO_TOO_SMALL_RESOLUTION_MESSAGE = "Your video's resolution is too small. Twitter only allows videos with a minimum resolution >= " + VIDEO_MIN_WIDTH + "x" + VIDEO_MIN_HEIGHT
const VIDEO_MAX_DURATION = 0.5;
const VIDEO_MIN_DURATION = 120;
const VIDEO_INVALID_DURATION_MESSAGE = "Videos must have a duration between " + VIDEO_MIN_DURATION + " and " + VIDEO_MAX_DURATION + " seconds"

const GIF_FILE_SIZE_LIMIT = 15;
const GIF_SIZE_TOO_LARGE_MESSAGE = 'Your gif is too large. Twitter allows only gifs up to a size of ' + GIF_FILE_SIZE_LIMIT + ' MB'
const GIF_MAX_WIDTH = 1280;
const GIF_MAX_HEIGHT = 1080;
const GIF_TOO_LARGE_RESOLUTION_MESSAGE = "Your gif's resolution is too large. Twitter only allows gifs of a resolution <= " + GIF_MAX_WIDTH + "x" + GIF_MAX_HEIGHT

const validateTweetTextNotTooLong = (tweet) => {
    if (tweet.tweetText.length > MAX_NUMBER_OF_CHARS_PER_TWEET) {
        return {
            status: INVALID,
            message: TWEET_TO_LONG_MESSAGE
        }
    }
    return {status: VALID}
}

const validateMediaOrText = (tweet) => {
    if (tweet.tweetText.length === 0 && tweet.media.length === 0) { //TODO add poll  && tweet.poll.length === 0
        return {
            status: INVALID,
            message: TWEET_NEEDS_TEXT_OR_MEDIA_MESSAGE
        }
    }
    return {status: VALID}
}
const validateImageElement = (imageElement) => {
    const fileSizeInMb = imageElement.size / 1024 / 1024;
    if (fileSizeInMb > IMAGE_FILE_SIZE_LIMIT) {
        return {status: INVALID, message: IMAGE_SIZE_TOO_LARGE_MESSAGE}
    }

    let img = new Image();
    img.src = URL.createObjectURL(imageElement);
    //TODO not specified in twitter?
    //if (img.width > IMAGE_MAX_WIDTH || img.height > IMAGE_MAX_HEIGHT) {
    //    return {status: INVALID, message: IMAGE_TOO_LARGE_RESOLUTION_MESSAGE}
    //}

    return {status: VALID}
}
const loadVideo = file => new Promise((resolve, reject) => {
    try {
        let video = document.createElement('video')
        video.preload = 'metadata'

        video.onloadedmetadata = function () {
            resolve(this)
        }

        video.onerror = function () {
            reject("Invalid video. Please select a video file.")
        }

        video.src = window.URL.createObjectURL(file)
    } catch (e) {
        reject(e)
    }
})
const validateVideoElement = async (videoElement) => {
    const fileSizeInMb = videoElement.size / 1024 / 1024;
    if (fileSizeInMb > VIDEO_FILE_SIZE_LIMIT) {
        return {status: INVALID, message: VIDEO_SIZE_TOO_LARGE_MESSAGE}
    }

    const video = await loadVideo(videoElement);
    if (video.videoWidth > VIDEO_MAX_WIDTH || video.videoHeight > VIDEO_MAX_HEIGHT) {
        return {status: INVALID, message: VIDEO_TOO_LARGE_RESOLUTION_MESSAGE}
    }
    if (video.videoWidth < VIDEO_MIN_WIDTH || video.videoHeight < VIDEO_MIN_HEIGHT) {
        return {status: INVALID, message: VIDEO_TOO_SMALL_RESOLUTION_MESSAGE}
    }
    if (video.duration > VIDEO_MAX_DURATION || video.duration < VIDEO_MIN_DURATION) {
        return {status: INVALID, message: VIDEO_INVALID_DURATION_MESSAGE}
    }

    return {status: VALID}
}
const validateGifElement = (gifElement) => {
    const fileSizeInMb = gifElement.size / 1024 / 1024;
    if (fileSizeInMb > GIF_FILE_SIZE_LIMIT) {
        return {status: INVALID, message: GIF_SIZE_TOO_LARGE_MESSAGE}
    }
    let img = new Image();
    img.src = URL.createObjectURL(gifElement);
    if (img.width > GIF_MAX_WIDTH || img.height > GIF_MAX_HEIGHT) {
        return {status: INVALID, message: GIF_TOO_LARGE_RESOLUTION_MESSAGE}
    }
    return {status: VALID}
}
export const validateMediaElement = async (mediaElement) => {
    if (IMAGE_EXTENSIONS.includes(mediaElement.type)) {
        return validateImageElement(mediaElement);
    } else if (VIDEO_EXTENSIONS.includes(mediaElement.type)) {
        return await validateVideoElement(mediaElement);
    } else if (GIF_EXTENSIONS.includes(mediaElement.type)) {
        return validateGifElement(mediaElement);
    } else {
        throw "invalid type"
    }
}
const validateMediaRequirements = async (tweet) => {
    if (tweet.media.length !== 0) {
        for (const mediaElement of tweet.media) {
            const intermediateValidationResult = await validateMediaElement(mediaElement)
            if (intermediateValidationResult.status === 'invalid') {
                return intermediateValidationResult
            }
        }
    }
    return {status: VALID}
}

const POLL_OPTION_TEXT_TOO_LARGE = "Twitter only allows poll options of up to 25 characters"
const POLL_OPTION_IS_EMPTY = "Twitter does not allow empty poll options."
const POLL_INVALID_NUMBER_OF_OPTIONS = "Twitter only allows polls including between 2 and 4 options."
const POLL_DURATION_INVALID = "A twitter poll has to have a duration between 5 minutes and 7 days"
const POLL_OPTION_MAX_LENGTH = 25;
const validatePollRequirements = async (tweet) => {
    if (Object.keys(tweet.poll).length === 0) {
        return {status: VALID}
    }
    const pollChoices = tweet.poll.rows;
    const numberOfOptions = pollChoices.length;
    const durationInMinutes = tweet.poll.days * 24 * 60 + tweet.poll.hours * 60 + tweet.poll.minutes;

    if (numberOfOptions !== 0) {
        if (numberOfOptions > 4 || numberOfOptions < 2) {
            return {status: INVALID, message: POLL_INVALID_NUMBER_OF_OPTIONS}
        }
        if (durationInMinutes > 7 * 24 * 60 || durationInMinutes < 5) {
            return {status: INVALID, message: POLL_DURATION_INVALID}
        }
        for (const pollChoice of pollChoices) {
            if (pollChoice.value.length > POLL_OPTION_MAX_LENGTH) {
                return {status: INVALID, message: POLL_OPTION_TEXT_TOO_LARGE}
            } else if (pollChoice.value.length === 0) {
                return {status: INVALID, message: POLL_OPTION_IS_EMPTY}
            }
        }
    }
    return {status: VALID}
}

const validations = [
    validateTweetTextNotTooLong,
    validateMediaOrText,
    validateMediaRequirements,
    validatePollRequirements
];
export const validateTweets = async (tweets) => {
    for (const tweet of tweets) {
        for (const validation of validations) {
            const intermediateValidationResult = await validation(tweet);
            if (intermediateValidationResult.status === 'invalid') {
                return intermediateValidationResult
            }
        }
    }
    return {status: VALID}
}


function convertFrontendPollToBackendPoll(frontendPoll) {
    let backendPoll = {};
    if (Object.keys(frontendPoll).length === 0) {
        return backendPoll;
    } else if (frontendPoll.rows.length > 0) {
        const options = [];
        frontendPoll.rows.forEach((row) => {
            options.push(row.value);
        })
        backendPoll = {
            duration_minutes: (frontendPoll.days * 24 * 60 + frontendPoll.hours * 60 + frontendPoll.minutes),
            options: options
        }
    }
    return backendPoll;
}

export function convertBackendPollToFrontendPoll(poll) {
    if (poll.options === null) {
        return {};
    } else {
        const duration_minutes = poll.duration_minutes;
        const days = Math.floor(duration_minutes / (60 * 24));
        const hours = Math.floor(duration_minutes % (60 * 24) / 60);
        const minutes = Math.floor(duration_minutes % 60);
        const rows = [];
        for (const option of poll.options) {
            rows.push({key: uuidv4(), value: option, count: option.length})
        }
        return {
            days: days,
            hours: hours,
            minutes: minutes,
            rows: rows
        }
    }
}