import '../App.css';
import '@aws-amplify/ui-react/styles.css';
import {Auth} from "aws-amplify";
import {useEffect, useState} from "react";
import {ApolloProvider} from '@apollo/client';
import {createAppSyncClient} from "../appsync/AppSyncClient";
import {useNavigate, useSearchParams} from "react-router-dom";
import {executeCallback} from "../utils/twitter_utils";
import {Box} from "@mui/material";

function TwitterCallback() {
    let firstCall = true;
    let navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [twitterUser, setTwitterUser] = useState({});
    const [successfullyConnected, setSuccessfullyConnected] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        console.log("callback page")
        passCallbackToGetUserTokens();
    }, []);


    function passCallbackToGetUserTokens() {
        if (!firstCall) {
            return
        }
        firstCall = false;
        getAccessTokenForCognito()
            .then((jwtToken) => {
                console.log(jwtToken)
                console.log("executeCallback = ")

                executeCallback(searchParams, setTwitterUser, jwtToken)
                    .then(response => {
                        console.log("response")
                        console.log(response)
                        console.log(response.data)
                        setLoading(false)
                        if ('failure' in response.data) {
                            console.log("something is wrong")
                            console.log(response.data)
                            setError("Something went wrong, please go back and try again");
                        } else {
                            console.log("SuccessfullyConnected")
                            setSuccessfullyConnected(true);
                            setTwitterUser({
                                userAccessToken: response.data.accessToken,
                                userAccessSecret: response.data.accessSecret,
                                screenName: response.data.screenName,
                                userId: response.data.userId
                            });
                            sessionStorage.setItem('userAccessToken', response.data.accessToken)
                            sessionStorage.setItem('userAccessSecret', response.data.accessSecret)
                        }
                    })
                    .catch(error => {
                        console.log("error in executeCallback")
                        setLoading(false)
                        console.log(error)
                        setError(error);
                    })
            })
            .catch((error) => {
                console.log("error in getAccessTokenForCognito");
                console.log(error)
                setError(error);
                setLoading(false)
            });
    }

    async function getAccessTokenForCognito() {
        const currentSession = await Auth.currentSession()
        const accessToken = currentSession.getAccessToken();
        return accessToken.getJwtToken();
    }


    const validateUserSession = async () => {
        try {
            console.log("validateUserSession")
            await Auth.currentSession();
        } catch (error) {
            console.error("error in validateUserSession");
            console.error(error);
        }
    };

    async function signOut() {
        try {
            console.log("sign")
            await Auth.signOut();
            navigate('/goodbye')
        } catch (error) {
            console.log('error signing out: ', error);
        }
    }


    function renderWait() {
        if (isLoading && !error) {
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
                    {twitterUser.length !== 0 && (
                        <div>
                            <p>{twitterUser.userAccessToken}</p>
                            <p>{twitterUser.userAccessSecret}</p>
                            <p>{twitterUser.screenName}</p>
                            <p>{twitterUser.userId}</p>
                        </div>
                    )}
                    please wait while we connect your Twitter Account
                </Box>
            );
        }
    }

    function renderSuccess() {
        if (!isLoading && !error && successfullyConnected) {
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
                    {twitterUser.length !== 0 && (
                        <div>
                            <p>{twitterUser.userAccessToken}</p>
                            <p>{twitterUser.userAccessSecret}</p>
                            <p>{twitterUser.screenName}</p>
                            <p>{twitterUser.userId}</p>
                        </div>
                    )}
                    <p>Linked, great continue</p>
                    <button onClick={() => {
                        navigate('/')
                    }}>Get started
                    </button>
                </Box>
            );
        }
    }

    function renderError() {
        if (!isLoading && error) {
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
                    <button onClick={signOut}>Sign out</button>
                    {twitterUser.length !== 0 && (
                        <div>
                            <p>{twitterUser.userAccessToken}</p>
                            <p>{twitterUser.userAccessSecret}</p>
                            <p>{twitterUser.screenName}</p>
                            <p>{twitterUser.userId}</p>
                        </div>
                    )}
                    <p>Error</p>
                    <p>{error}</p>
                    <p>TODO add button to do sign in again / route to /create</p>
                </Box>
            );
        }
    }

    return (
        <ApolloProvider client={createAppSyncClient(validateUserSession)}>
            <Box sx={{display: 'flex'}}>
                {renderWait()}
                {renderSuccess()}
                {renderError()}
            </Box>
        </ApolloProvider>);
}

export default TwitterCallback;
