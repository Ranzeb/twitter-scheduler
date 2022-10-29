import {Output, getStack} from '@pulumi/pulumi';

let stack = getStack();

function get_stripe_api_key() {
    const STRIPE_TEST_API_KEY = 'sk_test_51LRJ6GCInfj461oh2cqMm8lShgzgoeQILm454J20wSdf5flyoAmy74hkTtVkJ5eTsb6ZEj7vyfZOyFfsYCXlUTRS00HTHJkrYo';
    const STRIPE_PROD_API_KEY = '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';

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
    CONSUMER_KEY: 'XTePkvyHMV1k4vVk7ZxD2fsf9',
    CONSUMER_SECRET: 'fQOx1SQKOQhhfkQ83Q9YB6aTiE35aNtNgHoGGNBHggU7q4HxKM',
    STRIPE_API_KEY: get_stripe_api_key(),
    TRIAL_PERIOD_DAYS: 30,
    FIRST_TRIAL_SUBSCRIPTION_ID: 'new_user_trial_30d_v_0_0_0',
    PULUMI_STACK: stack
};
