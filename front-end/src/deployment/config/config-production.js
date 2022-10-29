/**
 * Add your live production URL here
 */
const HOSTED_URL = 'https://main.d3bft3p6tuw3e.amplifyapp.com/';

const configProduction = {
    HOSTED_URL,
    MODE: 'PRODUCTION',
    REGION: 'eu-west-1',
    REDIRECT_SIGN_IN: `${HOSTED_URL}/`,
    REDIRECT_SIGN_OUT: `${HOSTED_URL}/signout/`,
    AUTHENTICATION_TYPE: 'AWS_IAM',

    /**
     * Add the details from the Pulumi output here, after running 'pulumi up'
     */
    USER_POOL_CLIENT_ID: '3eolescdga6k6b9udon51edpte',
    USER_POOL_ID: 'eu-west-1_Vkl3Quuxv',
    IDENTITY_POOL_ID: 'eu-west-1:37ff6da3-6f5d-4b29-b9e7-abde622cc39c',
    GRAPHQL_ENDPOINT: 'https://gf2hzh6iijbftowfiou7iwrujm.appsync-api.eu-west-1.amazonaws.com/graphql',
    GET_AUTH_LINK_API: 'https://6ydy5hu62b.execute-api.eu-west-1.amazonaws.com/stage',
    TWITTER_MEDIA_BUCKET: 'twitter-media-4570663',
    STRIPE_API: 'https://j3hgkn16a0.execute-api.eu-west-1.amazonaws.com/stage/',

    /*
    Other variables
     */
    UNLIMITED_SCHEDULING_YEARLY_PRICE: 'price_1LYrPLCInfj461oh6OO3jpHZ',
    UNLIMITED_SCHEDULING_MONTHLY_PRICE:'price_1LYrPLCInfj461ohaHy7Y6SI',
};

export default configProduction;
