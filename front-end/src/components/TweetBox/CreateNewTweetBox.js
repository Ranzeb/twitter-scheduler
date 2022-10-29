import React, {useEffect, useState} from 'react'
import './Tweetbox.css'
import Button from '@mui/material/Button';
import {
    addTweetsToQueue,
    scheduleTweetsAndUploadMediaToS3,
    sendTweets,
    validateTweets
} from "../../utils/twitter_utils";
import ScheduleDateTimePickerDialog from "./ScheduleDateTimePickerDialog";
import {Box, CircularProgress} from "@mui/material";
import TweetBox, {generateTweet} from "./TweetBox";
import {useGetUser} from "../../hooks/useSyncUser";
import {checkValidSubscription} from "../../utils/billing_utils";
import {
    selectTwitterUser,
    selectUserIdentityId,
    selectUserJwtToken
} from "../../redux/slicer/userDataSlice";
import {useSelector} from "react-redux";


function CreateNewTweetBox() {
    const [scheduledDateTime, setScheduledDateTime] = useState(new Date());
    const [tweets, setTweets] = useState([generateTweet({})]);
    const [showScheduleDateTimePicker, setShowScheduleDateTimePicker] = React.useState(false);
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const [userHasValidSubscription, setUserHasValidSubscription] = useState(true);
    const [isLoading, setLoading] = useState(false);
    const [usesThreadFinisher, setUsesThreadFinisher] = useState(false);
    const twitterUser = useSelector(selectTwitterUser)

    const identityId = useSelector(selectUserIdentityId)
    const jwtToken = useSelector(selectUserJwtToken)

    useEffect(() => {
        getUser().then((response) => {
            const cognitoUser = response.data.getCognitoUser;
            //TODO maybe move checkValidSubscription to app.js and use redux => probably faster,since only once done
            checkValidSubscription(cognitoUser)
                .then((result) => {
                    setUserHasValidSubscription(true);
                })
                .catch((error) => {
                    if (error.error === 'no_subscription') {
                        setUserHasValidSubscription(false);
                        alert(error.message)
                    } else {
                        //TODO handle error, after figuring out which error just happened
                        console.log("handle error")
                        console.log(error)
                    }
                })
        })
    }, []);


    async function handleTweet(event) {
        if (identityId === undefined) {
            console.log("no identityId, why?")
            return
        }
        if (jwtToken === undefined) {
            console.log("no jwtToken, why?")
            return
        }
        const validationResult = await validateTweets(tweets);
        if (validationResult.status !== 'valid') {
            alert(validationResult.message);
            return;
        }
        setLoading(true)

        sendTweets(tweets, usesThreadFinisher, jwtToken, identityId)
            .then((result) => {
                //TODO what if upload fails, does this promise then fail or what?
                console.log("success")
                console.log(result)
                setTweets([generateTweet({})]);
            })
            .catch((error) => {
                alert("Some error occurred, please try again.")
                console.log(error)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    async function addToQueue() {
        if (identityId === undefined) {
            console.log("no user, why?")
            return
        }
        if (jwtToken === undefined) {
            console.log("no jwttoken, why?")
            return
        }
        const validationResult = await validateTweets(tweets);
        if (validationResult.status !== 'valid') {
            alert(validationResult.message);
            return;
        }
        setLoading(true);
        addTweetsToQueue(tweets, usesThreadFinisher, jwtToken, identityId)
            .then((result) => {
                console.log(result)
                //TODO show success somehow without alert?
                alert("Successfully scheduled your tweet")
                setUsesThreadFinisher(false);
                setTweets([generateTweet({})]);
            })
            .catch((error) => {
                //TODO handle error = remove all images and show error to user
                // or depending on error, try again?
                alert("some error while scheduling your tweet")
                console.log(error)
            })
            .finally(() => {
                setLoading(false);
            })
    }

    async function handleModalSchedule(event) {
        if (identityId === undefined) {
            console.log("no user, why?")
            return
        }
        if (jwtToken === undefined) {
            console.log("no jwttoken, why?")
            return
        }
        const validationResult = await validateTweets(tweets);
        if (validationResult.status !== 'valid') {
            alert(validationResult.message);
            return;
        }
        setLoading(true);
        //TODO show media upload progress
        scheduleTweetsAndUploadMediaToS3(tweets, scheduledDateTime, usesThreadFinisher, jwtToken, identityId)
            .then((result) => {
                console.log(result)
                //TODO show success somehow without alert?
                //TODO reset usesThreadFinisher?
                alert("Successfully scheduled your tweet")
                setTweets([generateTweet({})]);
            })
            .catch((error) => {
                //TODO handle error = remove all images and show error to user
                // or depending on error, try again?
                alert("some error while scheduling your tweet")
                console.log(error)
            })
            .finally(() => {
                setLoading(false);
            })
    }

    function renderPage() {
        if (isLoading) {
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
                </Box>);
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
                    <TweetBox
                        tweets={tweets}
                        userInfo={twitterUser}
                        setTweets={setTweets}
                        usesThreadFinisher={usesThreadFinisher}
                        setUsesThreadFinisher={setUsesThreadFinisher}
                        sx={{
                            display: 'flex',
                            justifyItems: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            justifyContent: 'space-evenly',
                            width: '80%',
                            minWidth: '300px',
                            maxWidth: '600px',
                            m: 2,
                        }}/>

                    <Box
                        id="tweet-schedule-btn-div"
                        sx={{
                            display: 'flex',
                            justifyItems: 'center',
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'space-evenly',
                            width: '300px',
                            maxWidth: '700px'
                        }}>
                        <Box>
                            <Button id="schedule-btn" disabled={!userHasValidSubscription} onClick={() => {
                                if (userHasValidSubscription) {
                                    setShowScheduleDateTimePicker(true)
                                } else {
                                    alert("No activate subscription")
                                }
                            }} variant="contained">Schedule</Button>
                        </Box>
                        <Box>
                            <Button id="tweet-btn" onClick={handleTweet} variant="outlined">Tweet</Button>
                        </Box>
                    </Box>
                    <ScheduleDateTimePickerDialog open={showScheduleDateTimePicker}
                                                  handleClose={() => {
                                                      setShowScheduleDateTimePicker(false)
                                                  }}
                                                  addToQueueButtonEnabled={true}
                                                  addToQueue={addToQueue}
                                                  setScheduledDateTime={setScheduledDateTime}
                                                  handleModalSchedule={handleModalSchedule}/>
                </Box>
            )
        }
    }


    return (renderPage())
}

export default CreateNewTweetBox;
