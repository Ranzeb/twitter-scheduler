import * as aws from '@pulumi/aws';
import {baseRole} from '../iam.js';
import {createCognitoUser, getCognitoUser} from '../../../src/dynamodb/cognito-user.js';
import {variables} from '../variables.js';
import Stripe from "stripe";

/**
 * This lambda triggers when a user is confirmed (after enterering the confirmation code).
 * It will create a user entry in the DynamoDB table which maps to the cognito user.
 */
const handler = async (event, context, callback) => {
    console.log('event', JSON.stringify(event, null, 2));

    try {
        const {name, email, given_name, family_name, sub} = event.request.userAttributes;
        const existingUser = await getCognitoUser(sub);

        if (existingUser) {
            callback(null, event);
            return;
        }
        const stripe = new Stripe(variables.STRIPE_API_KEY);
        const stripeCustomer = await stripe.customers.create({
            email: email,
            name: name,
        });
        console.log("successfully created stripe customer")
        console.log(stripeCustomer)
        const startOfCurrentSubscription = new Date().toISOString();


        await createCognitoUser({
            id: sub,
            username: name,
            email,
            createdAt: new Date().toISOString(),
            subscriptionId: process.env.FIRST_TRIAL_SUBSCRIPTION_ID,
            startOfCurrentSubscription: startOfCurrentSubscription,
            subscriptionDurationInDays: process.env.TRIAL_PERIOD_DAYS,
            subscriptionStatus: 'trialing',
            stripeCustomerId: stripeCustomer.id,
            familyName: family_name,
            givenName: given_name
        });

        callback(null, event);
    } catch (error) {
        console.error(error);
        callback(error);
    }
};

export const postConfirmationLambda = new aws.lambda.CallbackFunction('post-confirmation-fn', {
    runtime: 'nodejs14.x',
    callback: handler,
    role: baseRole,
    environment: {
        variables: {
            DYNAMO_USER_TABLE: variables.dynamoDBTables['user-table'],
            STRIPE_API_KEY: variables.STRIPE_API_KEY,
            FIRST_TRIAL_SUBSCRIPTION_ID: variables.FIRST_TRIAL_SUBSCRIPTION_ID,
            TRIAL_PERIOD_DAYS: variables.TRIAL_PERIOD_DAYS
        },
    },
});
