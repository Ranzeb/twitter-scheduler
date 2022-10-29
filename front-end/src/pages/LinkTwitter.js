import '../App.css';
import '@aws-amplify/ui-react/styles.css';
import {API, Auth, graphqlOperation} from "aws-amplify";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import {createTwitterUser} from "../graphql/mutations";
import {createTwitterTweet} from "../graphql/mutations";

import {useGetUser} from "../hooks/useSyncUser";
import {useSelector} from "react-redux";
import {selectUserJwtToken} from "../redux/slicer/userDataSlice";
import Box from "@mui/material/Box";
import * as React from "react";
import Button from "@mui/material/Button";

function LinkTwitter() {

    let navigate = useNavigate();
    const [authLink, setAuthLink] = useState("no auth link");
    const [savedSecret, setSavedSecret] = useState("no");
    const [accessToken, setAccessToken] = useState("no");
    const [accessSecret, setAccessSecret] = useState("no");
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const jwtToken = useSelector(selectUserJwtToken);

    const validateUserSession = async () => {
        try {
            console.log("validateUserSession")
            await Auth.currentSession();
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        console.log("getUser() in Home")
        validateUserSession();
        getUser();
        getAuthLink()
    }, []);

    async function signOut() {
        try {
            console.log("sign")
            await Auth.signOut();
            navigate('/goodbye')
        } catch (error) {
            console.log('error signing out: ', error);
        }
    }

    const getAuthLink = async () => {
        const apiName = "get-auth-link-api";
        const path = "/get_auth_link";
        API.get(apiName, path, {})
            .then(response => {
                console.log("response")
                console.log(response.authLink)
                setAuthLink(response.authLink);
                setSavedSecret(response.oauth_token_secret)
                sessionStorage.setItem('userAccessSecret', response.oauth_token_secret)
                console.log("stored userAccessSecret: " + response.oauth_token_secret)
            })
            .catch(error => {
                console.log("error");
                console.log(error);
                console.log(error.response);
            })
    };

    function testInsertUserViaGraphQL() {
        const testuser = {
            cognitoUserId: getUserData.id,
            accessToken: "this_userAccessToken",
            accessSecret: "this_userAccessSecret",
            screenName: "this_screenName",
            twitterUserId: "this_userId",
            tokenCreationDateTime: new Date().toISOString()
        }
        console.log(testuser)
        API.graphql(graphqlOperation(createTwitterUser, {...testuser}))

        console.log(getUserData)
    }

    function testInsertTweet() {
        const tweetToSchedule = {
            cognitoUserId: getUserData.id,
            tweet: "This tweet was successfully scheduled",
            scheduledDateTime: "$scheduledDateTime",
            isPosted: false,
            twitterUserId: "this_userId",
            creationDateTime: new Date().toISOString()
        }
        console.log(tweetToSchedule)
        API.graphql(graphqlOperation(createTwitterTweet, {...tweetToSchedule}))
            .then((res) => {
                console.log("result of graphql mutation");
                console.log(res)
            })
            .catch((error) => {
                console.log("error from graphql mutation")
                console.log(error)
            })

    }


    function testInsertUser() {
        const body_ = {
            accessToken: "this_userAccessToken",
            accessSecret: "this_userAccessSecret",
            screenName: "this_screenName",
            twitterUserId: "this_userId",
        }

        const apiName = "get-auth-link-api";
        const path = "/set_user_tokens";
        const myInit = {
            headers: {'x-jwt-identity-token': jwtToken},
            body: body_
        };
        API.post(apiName, path, myInit)
            .then(response => {
                console.log("response")
                console.log(response)
                console.log(response.data.tweet)
                console.log(response.data.tweetId)
                console.log(response.data.success)
            })
            .catch(error => {
                console.log("error");
                console.log(error);
                console.log(error.response);
            })
    }

    function renderLoading() {
        if (getUserLoading || !authLink) {
            return (<header className="App-header"><p>loading user ...</p></header>)
        }
    }

    function renderMain() {
        if (getUserData && authLink) {
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
                    <h1>Hello {getUserData.username}</h1>
                    <p>You have not yet linked your account to Twitter.</p>
                    <Button
                        variant="outlined"
                        color="success"
                        onClick={() => {
                            window.open(authLink, "_self");
                        }}>Connect your Twitter Account
                    </Button>
                </Box>
            )
        }
    }

    return (
        <Box sx={{display: 'flex'}}>
            {renderLoading()}
            {renderMain()}
        </Box>
    );
}

export default LinkTwitter;