import fs from "fs";
import aws from "@pulumi/aws";
import path from "path";
import {fileURLToPath} from 'url';
import {setupGetCognitoUserSource} from "./resolvers/get-cognito-user/source.js";
import {setupTwitterUserSource} from "./resolvers/create-twitter-user/source.js";
import {setupTwitterTweetsSource} from "./resolvers/twitter-tweets/source.js";
import {setupTwitterUserDailyStatisticsSource} from "./resolvers/get-twitter-user-daily-statistics/source.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schema = fs.readFileSync(path.resolve(__dirname, '../schema/schema.graphql'), 'utf8');

if (!schema || typeof schema !== 'string') {
    throw Error('Could not read GraphQL schema');
}


/**
 * AppSync
 */
const appSync = new aws.appsync.GraphQLApi('appsync', {
    schema,
    authenticationType: 'AWS_IAM',
});

/**
 * Sources
 */
setupGetCognitoUserSource(appSync.id);
setupTwitterUserSource(appSync.id);
setupTwitterTweetsSource(appSync.id);
setupTwitterUserDailyStatisticsSource(appSync.id);

export const appSyncID = appSync.id;
export const graphQLEndpoint = appSync.uris;
