import {Output, getStack} from '@pulumi/pulumi';

let stack = getStack();

function get_stripe_api_key() {
    const STRIPE_TEST_API_KEY = '<YOUR_API_KEY>';
    const STRIPE_PROD_API_KEY = '<YOUR_API_KEY>';

    let stripe_api_key;
    if (stack === 'dev') {
        stripe_api_key = STRIPE_TEST_API_KEY;
    } else if (stack === 'prod') {
        stripe_api_key = STRIPE_PROD_API_KEY;
    } else {
        console.log("invalid pulumi stack")
        console.log(variables.PULUMI_STACK)
    }
    return stripe_api_key;
}


export const variables = {
    region: 'eu-west-1',
    dynamoDBTables: {},
    CONSUMER_KEY: '<YOUR_API_KEY>',
    CONSUMER_SECRET: '<YOUR_API_KEY>',
    STRIPE_API_KEY: get_stripe_api_key(),
    TRIAL_PERIOD_DAYS: 30,
    FIRST_TRIAL_SUBSCRIPTION_ID: 'new_user_trial_30d_v_0_0_0',
    PULUMI_STACK: stack
};
