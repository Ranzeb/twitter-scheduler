import Scheduler from "./pages/Scheduler";
import '@aws-amplify/ui-react/styles.css';
import {API, Auth, graphqlOperation} from "aws-amplify";
import {useEffect, useState} from "react";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import {
    Routes,
    Route, useNavigate, useLocation,
} from "react-router-dom";
import GoodBye from "./pages/GoodBye";
import ConfirmSignUp from "./pages/ConfirmSignUp";
import TwitterCallback from "./pages/TwitterCallbackPage";
import Queue from "./pages/Queue";
import {useGetUser} from "./hooks/useSyncUser";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import ResetPassword from "./pages/ResetPassword";
import LinkTwitter from "./pages/LinkTwitter";
import "./App.css";
import "./index.css";
import {useDispatch, useSelector} from "react-redux";
import {
    setIdentityId,
    setJwtToken,
    setCognitoUserId,
    setUserEmail,
    setUserEmailIsVerified, selectCognitoUserId, selectUserIdentityId, setTwitterUser
} from "./redux/slicer/userDataSlice";
import Sidebar from "./components/Sidebar/Sidebar";
import * as React from "react";
import {Box} from "@mui/material";
import {getTwitterUser} from "./graphql/queries";
import StatisticsPage from "./pages/StatisticsPage";

const UNAUTHENTICATED_PATHS = ['/goodbye', '/signin', '/signup', '/reset_password'];

function App() {
    let navigate = useNavigate();
    let location = useLocation()
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const dispatch = useDispatch()
    const cognitoUserId = useSelector(selectCognitoUserId)
    const identityId = useSelector(selectUserIdentityId)
    let isGettingData = false;
    const getUserSession = async () => {
        try {
            const currentSession = await Auth.currentSession();
            dispatch(setJwtToken(currentSession.getAccessToken().getJwtToken()));
        } catch (error) {
            console.log("error currentSession")
            console.log(error)
            //User is not authenticated.
            //In case the user visited none of the allowed unauthenticated pages, the user is routed to /signin
            const currentPath = location.pathname;
            for (const noReroutingPath of UNAUTHENTICATED_PATHS) {
                if (currentPath.includes(noReroutingPath)) {
                    return;
                }
            }
            navigate('/signin')
            //TODO show some error or just redirect to signin?
        }
    };

    function fetchTwitterUser(currentCognitoUserId) {
        if (currentCognitoUserId.length > 0) {
            API.graphql(graphqlOperation(getTwitterUser, {cognitoUserId: currentCognitoUserId}))
                .then((res) => {
                    let currentTwitterUser = res.data.getTwitterUser;
                    dispatch(setTwitterUser(currentTwitterUser))
                    if (res.data.getTwitterUser === null) {
                        navigate('/link_twitter')
                    }
                    if ('error' in res) {
                        if (res.error.message.startsWith('The provided key element does not match the schema')) {
                            navigate('/link_twitter')
                        }
                    }
                })
                .catch((error) => {
                    console.log("error from graphql query")
                    console.log(error)
                })
        }
    }

    const getRequiredData = () => {
        isGettingData = true;
        const currentPath = location.pathname;
        console.log("render App: " + currentPath)
        for (const path of UNAUTHENTICATED_PATHS) {
            if (currentPath.includes(path)) {
                return;
            }
        }
        if(currentPath.includes('twitter_callback')) {
            return;
        }
        Auth.currentAuthenticatedUser().then((user) => {
            dispatch(setCognitoUserId(user.attributes.sub));
            dispatch(setUserEmail(user.attributes.email));
            dispatch(setUserEmailIsVerified(user.attributes.email_verified));
            fetchTwitterUser(user.attributes.sub)
        }).catch((error) => {
            console.log("error currentAuthenticatedUser")
            console.log(error)
        })
        getUserSession();
        Auth.currentUserCredentials().then((credentials) => {
            dispatch(setIdentityId(credentials.identityId))
        }).catch((error) => {
            console.log("error currentUserCredentials")
            console.log(error)
        })

        isGettingData = false;
    }

    useEffect(() => {
        if (!isGettingData) {
            console.log("get in useeffect")
            getRequiredData()
        }
    }, []);

    function usesSidebar() {
        const noSidebarPaths = ['/goodbye', '/signin', '/signup', '/reset_password', '/confirm', '/twitter_callback', '/link_twitter'];
        for (const noSidebarPath of noSidebarPaths) {
            if (location.pathname.includes(noSidebarPath)) {
                return false;
            }
        }

        if (cognitoUserId === undefined || identityId === undefined) {
            console.log("get:  " + isGettingData)
            if (!isGettingData) {
                getRequiredData();
            }
        }
        return true
    }

    return (
        <Box>
            {usesSidebar() && <Sidebar/>}
            <Routes>
                <Route exact path="/signin" element={<SignIn/>}/>
                <Route exact path="/signup" element={<SignUp/>}/>
                <Route exact path="/confirm" element={<ConfirmSignUp/>}/>
                <Route exact path="/twitter_callback" element={<TwitterCallback/>}/>
                <Route exact path="/reset_password" element={<ResetPassword/>}/>
                <Route exact path="/link_twitter" element={<LinkTwitter/>}/>

                <Route exact path="/goodbye" element={<GoodBye/>}/>


                <Route exact path="/create" element={<Scheduler/>}/>
                <Route exact path="/queue" element={<Queue/>}/>
                <Route exact path="/statistics" element={<StatisticsPage/>}/>
                <Route exact path="/" element={<Scheduler/>}/>
                <Route exact path="/settings" element={<Settings/>}/>
                <Route exact path="/billing" element={<Billing/>}/>
            </Routes>
        </Box>

    );
}

export default App;