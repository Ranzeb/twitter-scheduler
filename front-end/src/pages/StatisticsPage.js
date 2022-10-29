import * as React from 'react';
import '../App.css';
import '../components/TweetBox/Tweetbox.css'
import {API, graphqlOperation} from "aws-amplify";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getTwitterUserDailyStatistics, getTwitterUser} from "../graphql/queries";
import {
    CircularProgress,
} from "@mui/material";
import Box from '@mui/material/Box';
import {useGetUser} from "../hooks/useSyncUser";
import "./styles/statisticspage.css";
import {useDispatch, useSelector} from "react-redux";
import {selectCognitoUserId, selectTwitterUser} from "../redux/slicer/userDataSlice";


function StatisticsPage() {
    let navigate = useNavigate();
    const [isLoading, setLoading] = useState(true)
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    //const [twitterUser, setTwitterUser] = useState();
    const twitterUser = useSelector(selectTwitterUser)
    const cognitoUserId = useSelector(selectCognitoUserId)
    const dispatch = useDispatch()

    const [dailyStatistics, setDailyStatistics] = useState({});
    const [isFetchingStats, setIsFetchingStats] = useState(false);

    function getStats(currentTwitterUser) {
        if (isFetchingStats) {
            return
        }
        setIsFetchingStats(true);
        const apiName = "get-auth-link-api";
        const path = "/daily_twitter_stats";
        const body_ = { //data you want to send to the backend, can be empty
            usedDateTime: "usedDateTime",
            twitterUserId: currentTwitterUser.twitterUserId,
            accessToken: currentTwitterUser.accessToken,
            accessSecret: currentTwitterUser.accessSecret
        }
        const myInit = {
            body: body_
        };
        API.post(apiName, path, myInit)
            .then((result) => {
                setDailyStatistics(result);
            })
            .catch((error) => {
                //TODO: handle error
                console.log("error")
                console.log(error)
            })
            .finally(() => {
                setLoading(false);
                setIsFetchingStats(false);
            })
    }

    useEffect(() => {
        getUser().then((response) => {
            const currentCognitoUser = response.data.getCognitoUser;
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
                if (endOfCurrentSubscription < new Date() || currentCognitoUser.subscriptionStatus === 'inactive') {
                    //TODO handle subscription expired
                    alert("Your subscription expired, go and extend it")
                }
            }
        })
        if (twitterUser) {
            getStats(twitterUser);
        }

    }, [cognitoUserId, twitterUser]);

    function renderPage() {
        if (!isLoading && !getUserLoading) {
            return (
                <Box id="main"
                     component="main"
                     sx={{
                         display: 'flex',
                         justifyItems: 'center',
                         alignItems: 'center',
                         flexDirection: 'column',
                         flexGrow: 1,
                         p: 3
                     }}>
                    <div className="settings-title">
                        <h4>Statistics</h4>
                    </div>

                    <Box id="common-settings-box"
                         sx={{
                             width: '80%',
                             minWidth: '300px',
                             maxWidth: '600px',
                             bgcolor: 'red'
                         }}>
                        <p className="common-settings-box header">Today</p>
                        <div>
                            <p className="common-settings-box footer">
                                Tweets or Threads: {dailyStatistics.tweetCounter}
                            </p>
                            <p className="common-settings-box footer" style={{display: 'none'}}>
                                Threads: {dailyStatistics.threadCounter}
                            </p>
                            <p className="common-settings-box footer">
                                Replies: {dailyStatistics.replyCounter}
                            </p>
                            <p className="common-settings-box footer" style={{display: 'none'}}>
                                Likes: {dailyStatistics.likesCounter}
                            </p>
                            <p className="common-settings-box footer">
                                Retweets: {dailyStatistics.retweetCounter}
                            </p>
                            <p className="common-settings-box footer">
                                Quoted Tweets: {dailyStatistics.quoteCounter}
                            </p>
                        </div>
                    </Box>
                </Box>
            )
        } else {
            return (
                <Box id="main"
                     component="main"
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


export default StatisticsPage;