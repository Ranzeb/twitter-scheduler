import * as React from 'react';
import '../App.css';
import '../components/TweetBox/Tweetbox.css'
import {API, Auth, graphqlOperation} from "aws-amplify";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getTwitterUser} from "../graphql/queries";
import {
    Chip,
    CircularProgress,
    Switch
} from "@mui/material";
import Box from '@mui/material/Box';
import {useGetUser} from "../hooks/useSyncUser";
import "./styles/settings.css";
import Button from 'react-bootstrap/Button';
import {config} from "../deployment/config";
import Divider from '@mui/material/Divider';
import {useSelector} from "react-redux";
import {selectUserJwtToken} from "../redux/slicer/userDataSlice";

function choosePlanComponent(setPayAnnually, payAnnually, onCheckoutAndPortalButton) {
    return (
        <ProductDisplay
            setPayAnnually={setPayAnnually}
            payAnnually={payAnnually}
            onCheckoutAndPortalButton={onCheckoutAndPortalButton}/>
    )
}

function Billing() {
    let navigate = useNavigate();
    const [isLoading, setLoading] = useState(true)
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const [cognitoUser, setCognitoUser] = useState();
    const [payAnnually, setPayAnnually] = useState(true);
    let [success, setSuccess] = useState(false);
    let [sessionId, setSessionId] = useState('')
    //TODO show success modal (if sessionid and success then show)
    const jwtToken = useSelector(selectUserJwtToken);

    useEffect(() => {
        getUser().then((response) => {
            const currentCognitoUser = response.data.getCognitoUser;
            setCognitoUser(currentCognitoUser)
            if (currentCognitoUser.subscriptionId !== null) { //TODO in prod don't allow null
                let startOfCurrentSubscription = new Date(currentCognitoUser.startOfCurrentSubscription);
                let endOfCurrentSubscription;
                if (currentCognitoUser.endOfCurrentSubscription) {
                    endOfCurrentSubscription = new Date(currentCognitoUser.endOfCurrentSubscription);
                } else {
                    endOfCurrentSubscription = new Date(currentCognitoUser.startOfCurrentSubscription)
                        .setDate((startOfCurrentSubscription.getDate() + currentCognitoUser.subscriptionDurationInDays))
                    endOfCurrentSubscription = new Date(endOfCurrentSubscription);
                }
                if (endOfCurrentSubscription < new Date() || currentCognitoUser.subscriptionStatus === 'deactivate') {
                    //TODO if sessionid and success, don't show it, but refetch cognitouser
                    alert("Your subscription expired, go and extend it")
                }
            }
        })
        Auth.currentAuthenticatedUser({bypassCache: true}).then((user) => {
            const cognitoUserId = user.attributes.sub;
            API.graphql(graphqlOperation(getTwitterUser, {cognitoUserId: cognitoUserId}))
                .then((res) => {
                    if (res.data.getTwitterUser === null) {
                        navigate('/link_twitter')
                    }
                    if ('error' in res) {
                        if (res.error.message.startsWith('The provided key element does not match the schema')) {
                            navigate('/link_twitter')
                        }
                    } else {
                        setLoading(false);
                    }
                })
                .catch((error) => {
                    console.log("error from graphql query")
                    console.log(error)
                })
        });


        //STRIPE
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            setSuccess(true);
            setSessionId(query.get('session_id'));
        }

        if (query.get('canceled')) {
            setSuccess(false);
        }

    }, []);


    function onCheckoutAndPortalButton(event, price_id) {
        setLoading(true);
        console.log(cognitoUser)
        if (cognitoUser === undefined) {
            return;
        }
        if (cognitoUser.stripeCustomerId === undefined) {
            console.log("no stripe user")
            return
        }
        if (jwtToken === undefined) {
            console.log("no jwttoken")
            return;
        }
        const apiName = "stripe-api";
        const path = "/create-checkout-session";
        const headers = {'x-jwt-identity-token': jwtToken};
        const body_ = {
            price_id: price_id,
            stripeCustomerId: cognitoUser.stripeCustomerId
        }
        const myInit = {
            headers: headers,
            body: body_
        };
        API.post(apiName, path, myInit)
            .then(response => {
                if ('url' in response) {
                    window.location.href = response.url
                    return;
                }
                setLoading(false)
                alert("Some error occured")
            })
            .catch(error => {
                console.log("error");
                console.log(error);
                console.log(error.response);
                setLoading(false)
                alert("Some error occured")
            });
    }

    function billingComponent() {
        if (cognitoUser) {
            let startOfCurrentSubscription = new Date(cognitoUser.startOfCurrentSubscription);
            let endOfCurrentSubscription;
            if (cognitoUser.endOfCurrentSubscription) {
                endOfCurrentSubscription = new Date(cognitoUser.endOfCurrentSubscription);
            } else {
                endOfCurrentSubscription = new Date(cognitoUser.startOfCurrentSubscription)
                    .setDate((startOfCurrentSubscription.getDate() + cognitoUser.subscriptionDurationInDays))
                endOfCurrentSubscription = new Date(endOfCurrentSubscription);
            }
            const diffTime = endOfCurrentSubscription - new Date();
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffTime < (1000 * 60 * 60 * 24)) {
                diffDays = 0;
            }

            if (cognitoUser.subscriptionId === null) {
                //only possible if no active subscription => needs to make one
                return choosePlanComponent(setPayAnnually, payAnnually, onCheckoutAndPortalButton);
            } else if (cognitoUser.subscriptionId === 'free_scheduling') {
                const currentPlan = 'Free Unlimited Scheduling';
                return (
                    <Box sx={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        flexGrow: 1,
                        p: 3
                    }}>
                        <h4>Subscription</h4>
                        <Box>
                            <p>Current plan: {currentPlan}</p>
                            <p>You are a test user and thus we give you the unlimited scheduling for free!</p>
                            <p>Thanks for your support</p>
                        </Box>
                    </Box>
                );
            } else if (cognitoUser.subscriptionId === 'new_user_trial_30d_v_0_0_0') {
                //user in new user trial, thus choose plan
                return (
                    <Box sx={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        flexGrow: 1,
                    }}>
                        <div className="settings-title">
                            <h4>Billing</h4>
                        </div>
                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Your current plan</p>
                            {diffDays === 0 && diffTime > 0 && (
                                <p className="common-settings-box sub-end-date">Your trial ends today at
                                    ({endOfCurrentSubscription.toLocaleTimeString()})</p>)}
                            {diffDays === 0 && diffTime < 0 && (
                                <p className="common-settings-box sub-end-date">Your trial ended today
                                    at {endOfCurrentSubscription.toLocaleTimeString()}</p>)}
                            {diffDays < 0 && (<p className="common-settings-box sub-end-date">Your trial ended
                                on {endOfCurrentSubscription.toLocaleDateString()}</p>)}
                            {diffDays > 0 && (
                                <p className="common-settings-box sub-end-date">Your trial ends in {diffDays} Days
                                    ({endOfCurrentSubscription.toLocaleDateString()})</p>)}
                            <div>
                                <Button id="twitter-settings-btn">Upgrade your plan</Button>
                            </div>
                            <Divider
                                sx={{mb: 2, mt: 2}}
                            />
                            {choosePlanComponent(setPayAnnually, payAnnually, onCheckoutAndPortalButton)}
                        </Box>
                    </Box>
                );
            } else {
                //user already in some subscription
                const subscriptionStatus = cognitoUser.subscriptionStatus;
                const isActive = subscriptionStatus === 'active';
                const isCanceled = subscriptionStatus === 'canceled';
                const currentPlan = 'Unlimited Scheduling'; //TODO recieve that instead of hard coding it
                return (
                    <Box sx={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        flexGrow: 1,
                        p: 3
                    }}>

                        <h4>Subscription</h4>
                        <Box>
                            <p>Current plan: {currentPlan}</p>
                            {isCanceled && (<p>Canceled on {endOfCurrentSubscription.toLocaleDateString()}</p>)}
                            {isActive && (
                                <p>Next payment of subscription: {endOfCurrentSubscription.toLocaleDateString()}</p>)}
                        </Box>
                        <Box sx={{display: 'none'}}>
                            TODO
                            show billing info
                            show payment method
                            show update plan
                            show resubscribe or cancel depending if valid subscription
                        </Box>
                        {isCanceled && (
                            <Button
                                onClick={() => onCreatePortalSession({customer_id: cognitoUser.stripeCustomerId})}>Resubscribe</Button>)}
                        {!isCanceled && (
                            <Button
                                onClick={() => onCreatePortalSession({customer_id: cognitoUser.stripeCustomerId})}>Update
                                Subscription</Button>)}
                    </Box>
                )
            }

            //<p>Your journey started on {new Date(cognitoUser.createdAt).toLocaleDateString()}</p>


        }
    }


    function onCreatePortalSession(body_) {
        if (!('session_id' in body_ || 'customer_id' in body_)) {
            throw 'session_id or customer_id is required'
        }
        setLoading(true);
        const apiName = "stripe-api";
        const path = "/create-portal-session"
        const headers = {'x-jwt-identity-token': jwtToken};

        const myInit = {
            headers: headers,
            body: body_
        };
        API.post(apiName, path, myInit)
            .then(response => {
                if ('url' in response) {
                    window.location.href = response.url
                    return;
                }
                setLoading(false)
                alert("Some error occured")
            })
            .catch(error => {
                console.log("error");
                console.log(error);
                console.log(error.response);
                setLoading(false)
                alert("Some error occured")
            })
    }

    //TODO show success message after successfully subscribing to a plan

    function renderPage() {
        if (!isLoading && !getUserLoading) {
            return (
                <Box component="main"
                     sx={{
                         display: 'flex',
                         justifyItems: 'center',
                         alignItems: 'center',
                         flexDirection: 'column',
                         flexGrow: 1,
                         p: 3
                     }}>
                    {billingComponent()}
                </Box>
            )
        } else {
            return (
                <Box component="main"
                     sx={{
                         display: 'flex',
                         justifyItems: 'center',
                         alignItems: 'center',
                         flexDirection: 'column',
                         flexGrow: 1,
                         p: 3
                     }}>
                    <CircularProgress/>
                </Box>
            )
        }
    }

    return renderPage();
}

const ProductDisplay = (props) => (
    <Box sx={{
        display: 'flex',
        justifyItems: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        flexGrow: 1,
    }}>
        <Box sx={{
            display: 'flex',
            justifyItems: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            p: 1,
        }}>
            <div className="settings-title">
                <h4>Plans & Pricing</h4>
            </div>
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <Switch checked={props.payAnnually}
                        onClick={() => props.setPayAnnually(!props.payAnnually)}/>
                <p className="common-settings-box header">Pay annually and {" "}<span style={{color: 'red'}}>save up to 17 %</span>
                </p>
            </Box>
        </Box>
        <Box sx={{
            display: 'flex',
            justifyItems: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        }}>
            <Box sx={{
                display: 'flex',
                justifyItems: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                textAlign: 'center'
            }}>
                <Box>
                    <div className="settings-title">
                        <h4>Scheduling</h4>
                    </div>
                    {props.payAnnually && (<Chip label="DISCOUNTED" color="success" variant="outlined"/>)}
                    {!props.payAnnually && (<p className="common-settings-box header">$ 6.00 / month </p>)}
                    {props.payAnnually && (<p className="common-settings-box header">$ 5.00 / month</p>)}
                    <Box sx={{p: 1, textAlign: 'left', mr: 5}}>
                        <ul>
                            <li className='common-settings-box sub-end-date'>Unlimited Scheduling of Tweets (incl.
                                Media, Emojis and Polls)
                            </li>
                            <li className='common-settings-box sub-end-date'>Unlimited Scheduling of Threads (incl.
                                Media, Emojis and Polls)
                            </li>
                            <li className='common-settings-box sub-end-date'>Thread finisher</li>
                        </ul>
                    </Box>
                </Box>
                <Box
                    sx={{mb: 2, width: 200}}
                >
                    <Button
                        id="twitter-settings-btn-sub"
                        onClick={(event) => props.onCheckoutAndPortalButton(event, props.payAnnually ? config.UNLIMITED_SCHEDULING_YEARLY_PRICE : config.UNLIMITED_SCHEDULING_MONTHLY_PRICE)}>
                        Subscribe
                    </Button>
                </Box>
            </Box>
        </Box>

    </Box>
);


const SuccessDisplay = ({sessionId, onCreatePortalSession}) => {
    return (
        <Box sx={{
            display: 'flex',
            justifyItems: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            flexGrow: 1,
            p: 3
        }}>
            <div className="product Box-root">
                <div className="description Box-root">
                    <h3>Subscribing was successful!</h3>
                </div>
            </div>
            <form>
                <input
                    type="hidden"
                    id="session-id"
                    name="session_id"
                    value={sessionId}
                />
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => onCreatePortalSession({session_id: sessionId})}>
                    Manage your billing information
                </Button>
            </form>
        </Box>
    );
};

export default Billing;