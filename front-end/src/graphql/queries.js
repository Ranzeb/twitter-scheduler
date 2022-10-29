/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getCognitoUser = /* GraphQL */ `
  query GetCognitoUser {
    getCognitoUser {
      id
      username
      email
      createdAt
      subscriptionId
      startOfCurrentSubscription
      subscriptionDurationInDays
      endOfCurrentSubscription
      subscriptionStatus
      stripeCustomerId
      familyName
      givenName
    }
  }
`;
export const getTwitterUser = /* GraphQL */ `
  query GetTwitterUser($cognitoUserId: ID!) {
    getTwitterUser(cognitoUserId: $cognitoUserId) {
      cognitoUserId
      accessToken
      accessSecret
      screenName
      twitterUserId
      tokenCreationDateTime
      schedule
    }
  }
`;
export const getTwitterTweet = /* GraphQL */ `
  query GetTwitterTweet {
    getTwitterTweet {
      tweetId
      tweets {
        tweetText
        mediaS3Urls
        poll {
          duration_minutes
          options
        }
      }
      cognitoUserId
      scheduledDateTime
      creationDateTime
      postDateTime
      twitterUserId
      isPosted
      usesThreadFinisher
    }
  }
`;
export const getScheduledTweetsOfUser = /* GraphQL */ `
  query GetScheduledTweetsOfUser(
    $cognitoUserId: ID!
    $toDateTime: String!
    $fromDateTime: String!
  ) {
    getScheduledTweetsOfUser(
      cognitoUserId: $cognitoUserId
      toDateTime: $toDateTime
      fromDateTime: $fromDateTime
    ) {
      tweetId
      tweets {
        tweetText
        mediaS3Urls
        poll {
          duration_minutes
          options
        }
      }
      cognitoUserId
      scheduledDateTime
      creationDateTime
      postDateTime
      twitterUserId
      isPosted
      usesThreadFinisher
    }
  }
`;
export const getTwitterUserDailyStatistics = /* GraphQL */ `
  query GetTwitterUserDailyStatistics(
    $usedDateTime: String!
    $twitterUserId: String!
    $accessToken: String!
    $accessSecret: String!
  ) {
    getTwitterUserDailyStatistics(
      usedDateTime: $usedDateTime
      twitterUserId: $twitterUserId
      accessToken: $accessToken
      accessSecret: $accessSecret
    ) {
      tweetCounter
      threadCounter
      replyCounter
      likesCounter
      quoteCounter
      retweetCounter
    }
  }
`;
