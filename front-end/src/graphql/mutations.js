/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTwitterUser = /* GraphQL */ `
  mutation CreateTwitterUser(
    $cognitoUserId: ID!
    $accessToken: String!
    $accessSecret: String!
    $screenName: String!
    $twitterUserId: String!
    $tokenCreationDateTime: String!
  ) {
    createTwitterUser(
      cognitoUserId: $cognitoUserId
      accessToken: $accessToken
      accessSecret: $accessSecret
      screenName: $screenName
      twitterUserId: $twitterUserId
      tokenCreationDateTime: $tokenCreationDateTime
    ) {
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
export const createTwitterTweet = /* GraphQL */ `
  mutation CreateTwitterTweet(
    $tweets: String!
    $cognitoUserId: ID!
    $scheduledDateTime: String
    $creationDateTime: String!
    $postDateTime: String
    $twitterUserId: String!
    $isPosted: Boolean!
    $usesThreadFinisher: Boolean!
  ) {
    createTwitterTweet(
      tweets: $tweets
      cognitoUserId: $cognitoUserId
      scheduledDateTime: $scheduledDateTime
      creationDateTime: $creationDateTime
      postDateTime: $postDateTime
      twitterUserId: $twitterUserId
      isPosted: $isPosted
      usesThreadFinisher: $usesThreadFinisher
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
export const deleteTwitterTweet = /* GraphQL */ `
  mutation DeleteTwitterTweet($tweetId: ID!) {
    deleteTwitterTweet(tweetId: $tweetId) {
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
export const updateTwitterTweet = /* GraphQL */ `
  mutation UpdateTwitterTweet(
    $tweetId: ID!
    $tweets: [TweetsInput]!
    $scheduledDateTime: String!
    $updateDateTime: String!
    $usesThreadFinisher: Boolean!
  ) {
    updateTwitterTweet(
      tweetId: $tweetId
      tweets: $tweets
      scheduledDateTime: $scheduledDateTime
      updateDateTime: $updateDateTime
      usesThreadFinisher: $usesThreadFinisher
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
export const updateTwitterUserSchedule = /* GraphQL */ `
  mutation UpdateTwitterUserSchedule(
    $cognitoUserId: ID!
    $schedule: [[String]]!
  ) {
    updateTwitterUserSchedule(
      cognitoUserId: $cognitoUserId
      schedule: $schedule
    ) {
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
export const updateCognitoUserBasedOnStripeCustomerId = /* GraphQL */ `
  mutation UpdateCognitoUserBasedOnStripeCustomerId(
    $id: ID!
    $subscriptionId: String
    $startOfCurrentSubscription: String
    $subscriptionDurationInDays: Int
    $subscriptionStatus: String
  ) {
    updateCognitoUserBasedOnStripeCustomerId(
      id: $id
      subscriptionId: $subscriptionId
      startOfCurrentSubscription: $startOfCurrentSubscription
      subscriptionDurationInDays: $subscriptionDurationInDays
      subscriptionStatus: $subscriptionStatus
    ) {
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
