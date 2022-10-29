import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import {variables} from "./variables.js";
import Stripe from 'stripe';
import twitter_api_v2_1 from "twitter-api-v2";
import {createTwitterUser} from "../../src/dynamodb/twitter-user.js";
import AWS from "aws-sdk";
import {
    getCognitoUserByStripeCustomerId, updateCognitoUser,
} from "../../src/dynamodb/cognito-user.js";


const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'X-Amz-Date,X-Api-Key,X-Amz-Security-Token,Origin,X-Requested-With,Content-Type,Accept,Authorization,x-jwt-identity-token',
};

async function getUserSub(jwtToken) {
    const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
    const cognitoUser = await cognitoIdentity
        .getUser({
            AccessToken: jwtToken,
        })
        .promise();
    const sub = cognitoUser.UserAttributes.find((attr) => attr.Name === 'sub');
    return sub;
}

async function handleSubscriptionCreated(subscription) {
    //TODO user could update subscription and thus have a new subscription after current finishes, so handle this case
    console.log("handleSubscriptionCreated")
    //TODO implement, user could have one or 2 subscriptions, one active and one being active after current one is deactivated
    let cognitoUser = await getCognitoUserByStripeCustomerId(subscription.customer);
    console.log("cognitoUser")
    console.log(cognitoUser)
    console.log(typeof cognitoUser)
    cognitoUser = cognitoUser[0]
    console.log(cognitoUser)
    console.log(typeof cognitoUser)
    const cognitoUserId = cognitoUser.id;
    console.log(cognitoUser.id)
    console.log(cognitoUser['id'])
    console.log(cognitoUserId)
    const data = {
        id: cognitoUserId,
        subscriptionId: subscription.id,
        startOfCurrentSubscription: new Date(subscription.start_date * 1000).toISOString(),
        subscriptionStatus: subscription.status,
        endOfCurrentSubscription: new Date(subscription.current_period_end * 1000).toISOString(),
        subscriptionDurationInDays: null
    };
    console.log(data)
    await updateCognitoUser(data)
}

async function handleSubscriptionUpdated(subscription) {
    //TODO user could update subscription and thus have a new subscription after current finishes, so handle this case
    console.log("handleSubscriptionUpdated")
    console.log(subscription.customer)
    let cognitoUser = await getCognitoUserByStripeCustomerId(subscription.customer);
    console.log("cognitoUser")
    console.log(cognitoUser)
    console.log(typeof cognitoUser)
    cognitoUser = cognitoUser[0]
    console.log(cognitoUser)
    console.log(typeof cognitoUser)
    const cognitoUserId = cognitoUser.id;
    console.log(cognitoUser.id)
    console.log(cognitoUser['id'])
    console.log(cognitoUserId)
    const data = {
        id: cognitoUserId,
        subscriptionId: subscription.id,
        startOfCurrentSubscription: new Date(subscription.start_date * 1000).toISOString(),
        subscriptionStatus: subscription.status,
        endOfCurrentSubscription: new Date(subscription.current_period_end * 1000).toISOString(),
        subscriptionDurationInDays: null
    };
    console.log(data)
    await updateCognitoUser(data)

    /*
    old
    createdAt: "2022-08-04T07:00:31.087Z"
    email: "nic@nicolashoferer.com"
    id: "11d75f61-a7af-477d-ad6a-ae97a8fd0890"
    startOfCurrentSubscription: "2022-08-04T07:00:30.025Z"
    stripeCustomerId: "cus_MBKiqTBCXOYr7f"
    subscriptionDurationInDays: 30
    subscriptionId: "sub_1LSy2kCInfj461ohn7yB9jSm"
    subscriptionStatus: "trialing"
    username: "Nicolas Hoferer"
    __typename: "CognitoUser"
     */
}

const endpoint = new awsx.apigateway.API("stripe-endpoint", {
    gatewayResponses: {
        DEFAULT_4XX: {
            statusCode: 400,
            responseTemplates: {
                'application/json': '{"message":$context.error.messageString}',
            },
            responseParameters: {
                'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Methods': "'*'",
                'gatewayresponse.header.Access-Control-Allow-Credentials': "'*'",
            },
        },
    },
    stageArgs: {
        variables: {
            DYNAMO_USER_TABLE: variables.dynamoDBTables['user-table']
        }
    },
    routes: [
        {
            path: "/create-checkout-session",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_create_checkout_session", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/create-checkout-session",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_create_checkout_session", {
                callback: async (event) => {
                    try {
                        //const jwtToken = event.headers['x-jwt-identity-token'];
                        //const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
                        const buff = new Buffer(event.body, 'base64');
                        const text = buff.toString('utf-8');
                        const data = JSON.parse(text);

                        console.log(data)
                        console.log("api key determining")
                        console.log(variables.STRIPE_API_KEY)
                        const stripe = new Stripe(variables.STRIPE_API_KEY);

                        console.log("stripe")
                        console.log(stripe)

                        let originUrl = event.headers.origin;
                        console.log(originUrl)
                        console.log(originUrl.includes('localhost'))
                        let hostedUrl = originUrl + '/billing';
                        console.log("hostedUrl: " + hostedUrl)
                        const successUrl = `${hostedUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`;
                        const cancelUrl = `${hostedUrl}/?canceled=true`;
                        console.log(successUrl)
                        console.log(cancelUrl)
                        const session = await stripe.checkout.sessions.create({
                            customer: data.stripeCustomerId, //TODO create this when use registers or login, if not existing, then save alongside of cognitouser, then pass to use here
                            //when in webhook some update, we can use customer id to search cognitouser in dyanomdb and update information. store to congito user to avoid having to make many requests in frontend to different endpoints
                            billing_address_collection: 'auto',
                            line_items: [
                                {
                                    price: data.price_id,
                                    // For metered billing, do not pass quantity
                                    quantity: 1,
                                },
                            ],
                            mode: 'subscription',
                            success_url: successUrl,
                            cancel_url: cancelUrl,
                        });
                        console.log(session)
                        console.log(session.url)

                        return {
                            statusCode: 200,
                            body: JSON.stringify({url: session.url}),
                            headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        },


        {
            path: "/webhook",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_webhook", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/webhook",
            method: "POST",
            eventHandler:
                new aws.lambda.CallbackFunction("POST_webhook", {
                    callback: async (event) => {
                        //TODO implement stuff to update subscription status
                        try {
                            //const jwtToken = event.headers['x-jwt-identity-token'];
                            //const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
                            const buff = new Buffer(event.body, 'base64');
                            const text = buff.toString('utf-8');
                            //const data = JSON.parse(text);

                            console.log(text)

                            const stripe = new Stripe(variables.STRIPE_API_KEY);


                            process.env.DYNAMO_USER_TABLE = event.stageVariables.DYNAMO_USER_TABLE;
                            // Replace this endpoint secret with your endpoint's unique secret
                            // If you are testing with the CLI, find the secret by running 'stripe listen'
                            // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
                            // at https://dashboard.stripe.com/webhooks

                            //const endpointSecret = 'whsec_93omOnEjaH7u3De9C6jHdTZPCPOzIL0w'//'whsec_e34bf59a4164feb2fb56242f46f7763fc1797763326508e7a378dcfa76407459' //TESTING ENDPOINT;
                            const endpointSecret = 'whsec_INnCvEO5mMpCsCQjiiz06KEkekr6bbl6'; // test
                            // Only verify the event if you have an endpoint secret defined.
                            // Otherwise, use the basic event deserialized with JSON.parse
                            console.log("endpointSecret")
                            console.log(endpointSecret)
                            console.log(event.headers)
                            let stripeEvent;
                            if (endpointSecret) {
                                // Get the signature sent by Stripe
                                const signature = event.headers['Stripe-Signature'];
                                console.log("signature")
                                console.log(signature)
                                try {
                                    stripeEvent = stripe.webhooks.constructEvent(
                                        text,
                                        signature,
                                        endpointSecret
                                    );
                                } catch (err) {
                                    console.log(err)
                                    console.log(`⚠️  Webhook signature verification failed.`, err.message);
                                    return {
                                        statusCode: 400,
                                        body: JSON.stringify({reason: 'signature verification failed'}),
                                        headers: DEFAULT_HEADERS
                                    };
                                }
                            }
                            let subscription;
                            let status;
                            // Handle the stripeEvent
                            let result = {}
                            console.log(stripeEvent.type)
                            console.log(stripeEvent)
                            switch (stripeEvent.type) {
                                case 'customer.subscription.trial_will_end':
                                    subscription = stripeEvent.data.object;
                                    status = subscription.status;
                                    console.log(`Subscription status is ${status}.`);
                                    console.log(subscription)
                                    // Then define and call a method to handle the subscription trial ending.
                                    // handleSubscriptionTrialEnding(subscription);
                                    break;
                                case 'customer.subscription.deleted':
                                    subscription = stripeEvent.data.object;
                                    status = subscription.status;
                                    console.log(`Subscription status is ${status}.`);
                                    console.log(subscription)
                                    // Then define and call a method to handle the subscription deleted.
                                    // handleSubscriptionDeleted(subscriptionDeleted);
                                    break;
                                case 'customer.subscription.created':
                                    subscription = stripeEvent.data.object;
                                    status = subscription.status;
                                    console.log(`Subscription status is ${status}.`);
                                    console.log(subscription)
                                    // Then define and call a method to handle the subscription created.
                                    await handleSubscriptionCreated(subscription);
                                    break;
                                case 'customer.subscription.updated':
                                    subscription = stripeEvent.data.object;
                                    status = subscription.status;
                                    console.log(`Subscription status is ${status}.`);
                                    console.log(subscription)
                                    // Then define and call a method to handle the subscription update.
                                    await handleSubscriptionUpdated(subscription);
                                    break;
                                default:
                                    // Unexpected stripeEvent type
                                    console.log(`Unhandled stripeEvent type ${stripeEvent.type}.`);
                            }
                            // Return a 200 response to acknowledge receipt of the stripeEvent
                            return {
                                statusCode: 200,
                                body: JSON.stringify(result),
                                headers: DEFAULT_HEADERS
                            };
                        } catch (error) {
                            console.log("error")
                            console.log(error)

                            return {
                                statusCode: 200, body: JSON.stringify({
                                    failure: 1
                                }), headers: DEFAULT_HEADERS,
                            };
                        }
                    }
                })
        },


        {
            path: "/create-portal-session",
            method: 'OPTIONS',
            eventHandler: new aws.lambda.CallbackFunction("OPTIONS_create_portal_session", {
                callback: async () => {
                    return {
                        body: JSON.stringify({
                            success: 1,
                        }), statusCode: 200, headers: DEFAULT_HEADERS
                    }
                }
            })
        },
        {
            path: "/create-portal-session",
            method: "POST",
            eventHandler: new aws.lambda.CallbackFunction("POST_create_portal_session", {
                callback: async (event) => {
                    try {
                        //const jwtToken = event.headers['x-jwt-identity-token'];
                        //const cognitoIdentity = new AWS.CognitoIdentityServiceProvider({region: variables.region});
                        const buff = new Buffer(event.body, 'base64');
                        const text = buff.toString('utf-8');
                        const data = JSON.parse(text);

                        console.log("data")
                        console.log(data)


                        console.log("api key determining")
                        console.log(event.stageVariables)
                        console.log(process.env)
                        console.log("pulumi stack")
                        console.log(variables.STRIPE_API_KEY);
                        const stripe = new Stripe(variables.STRIPE_API_KEY);
                        // This is the url to which the customer will be redirected when they are done
                        // managing their billing with the portal.

                        let originUrl = event.headers.origin;
                        console.log(originUrl)
                        let returnUrl = originUrl + '/billing';
                        console.log("returnUrl: " + returnUrl)

                        let stripeCustomer;
                        if (!('customer_id' in data)) {
                            const session_id = data.session_id;
                            const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
                            stripeCustomer = checkoutSession.customer;
                        } else {
                            stripeCustomer = data.customer_id;
                        }
                        const portalSession = await stripe.billingPortal.sessions.create({
                            customer: stripeCustomer,
                            return_url: returnUrl,
                        });
                        console.log("portalSession")
                        console.log(portalSession)

                        return {
                            statusCode: 200,
                            body: JSON.stringify({url: portalSession.url}),
                            headers: DEFAULT_HEADERS
                        };
                    } catch (error) {
                        console.log("error")
                        console.log(error)

                        return {
                            statusCode: 200, body: JSON.stringify({
                                failure: 1
                            }), headers: DEFAULT_HEADERS,
                        };
                    }
                }
            })
        }
    ],
});

export const stripeEndpoint = endpoint.url;
