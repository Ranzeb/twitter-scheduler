/**
 * Add your hosted dev URL here
 */
const HOSTED_URL = 'https://develop.d3bft3p6tuw3e.amplifyapp.com';

const configDevelopment = {
    HOSTED_URL,
    MODE: 'DEVELOPMENT',
    REGION: 'eu-west-1',
    REDIRECT_SIGN_IN: `${HOSTED_URL}/`,
    REDIRECT_SIGN_OUT: `${HOSTED_URL}/signout/`,
    AUTHENTICATION_TYPE: 'AWS_IAM',

    /**
     * Add the details from the Pulumi output here, after running 'pulumi up'
     */
    USER_POOL_CLIENT_ID: 'in1e23g80trosuoh7q164inkr',
    USER_POOL_ID: 'eu-west-1_aD5Aam80b',
    IDENTITY_POOL_ID: 'eu-west-1:bd94fd11-91e7-4869-b5f1-5212fc61dd8e',
    GRAPHQL_ENDPOINT: 'https://32m62rc76ba2pjrrslltacf3yy.appsync-api.eu-west-1.amazonaws.com/graphql',
    GET_AUTH_LINK_API: 'https://mzacagvjvj.execute-api.eu-west-1.amazonaws.com/stage',
    TWITTER_MEDIA_BUCKET: 'twitter-media-4fc7929',
    STRIPE_API: 'https://ucv1iuv3wh.execute-api.eu-west-1.amazonaws.com/stage/',

    /*
    Other variables
     */
    UNLIMITED_SCHEDULING_YEARLY_PRICE: 'price_1LSQk9CInfj461ohND41R7hO',
    UNLIMITED_SCHEDULING_MONTHLY_PRICE:'price_1LSQXvCInfj461ohtu1RJ8jk',
};

export default configDevelopment;
