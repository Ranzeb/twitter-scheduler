import * as React from 'react';
import {useEffect, useState, useRef} from "react";
import {getScheduledTweetsOfUser, getTwitterUser} from "../graphql/queries";
import {CircularProgress} from "@mui/material";
import QueueDay from "../components/Queue/QueueDay";
import {v4 as uuidv4} from 'uuid';
import {gql, useQuery} from "@apollo/client";
import {API, Auth, graphqlOperation, Storage} from "aws-amplify";
import Box from "@mui/material/Box";
import EditTweetDialog from "../components/EditTweetDialog";
import {updateTwitterTweet} from "../graphql/mutations";
import ScheduleDateTimePickerDialog from "../components/TweetBox/ScheduleDateTimePickerDialog";
import {convertBackendPollToFrontendPoll, uploadMediaToS3, validateTweets} from "../utils/twitter_utils";
import {checkValidSubscription} from "../utils/billing_utils";
import {useGetUser} from "../hooks/useSyncUser";
import {useSelector} from "react-redux";
import {selectUserIdentityId} from "../redux/slicer/userDataSlice";
import * as _lodash from "lodash";

function groupByDate(fetchedTweets) {
    const grouped = [];
    for (const scheduledTweet of fetchedTweets) {
        if (grouped.length === 0) {
            grouped.push({
                datetime: scheduledTweet.scheduledDateTime,
                key: uuidv4(),
                scheduledTweets: [scheduledTweet]
            });
            continue;
        }
        const lastTweetScheduledDateTime = grouped[grouped.length - 1].datetime;
        if (scheduledTweet.scheduledDateTime.getFullYear() === lastTweetScheduledDateTime.getFullYear() &&
            scheduledTweet.scheduledDateTime.getMonth() === lastTweetScheduledDateTime.getMonth() &&
            scheduledTweet.scheduledDateTime.getDate() === lastTweetScheduledDateTime.getDate()
        ) {
            grouped[grouped.length - 1].scheduledTweets.push(scheduledTweet);
        } else {
            grouped.push({
                datetime: scheduledTweet.scheduledDateTime,
                key: uuidv4(),
                scheduledTweets: [scheduledTweet]
            })
        }
    }
    return grouped;
}

function Queue() {
    const [isLoading, setLoading] = useState(true)
    const [scheduledTweetsGroupedByDay, setScheduledTweetsGroupedByDay] = useState([]);
    const {loading, error, data, refetch} = useQuery(gql(getScheduledTweetsOfUser))
    const [cognitoUserId, setCognitoUserId] = useState(undefined);
    const [showEditTweetDialog, setShowEditTweetDialog] = useState(false);
    const [showScheduleDateTimePicker, setShowScheduleDateTimePicker] = useState(false);
    const selectedTweetForEdit = useRef();
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const [twitterUser, setTwitterUser] = useState();

    const identityId = useSelector(selectUserIdentityId)

    function openEditDialog(scheduledTweet) {
        console.log(scheduledTweet)
        selectedTweetForEdit.current = scheduledTweet;
        setShowEditTweetDialog(true)
    }

    function fetchTweets(cognitoUserId) {
        //TODO speed up loading times, maybe implement caching, but then how to synchronize changes?
        // e.g. if user edits or creates new scheduled tweet
        // or instead of getting all data, get for one day only, one after the other
        if (cognitoUserId === undefined) {
            console.log('cognitoUserId not set')
            return
        }
        const today = new Date()
        const fromDateTime = today.toISOString().substring(0, 11) + "00:00:00.0000Z";
        const toDateTime = new Date(new Date(fromDateTime).setDate(new Date(fromDateTime).getDate() + 31)).toISOString();

        refetch({
            cognitoUserId: cognitoUserId,
            toDateTime: toDateTime,
            fromDateTime: fromDateTime
        }).then(async (a) => {
                let fetchedTweets = [];

                for (const scheduledTweet of a.data.getScheduledTweetsOfUser) {
                    console.log("refetch")
                    let updatedScheduledTweet = {...scheduledTweet};
                    updatedScheduledTweet.scheduledDateTime = new Date(updatedScheduledTweet.scheduledDateTime);
                    updatedScheduledTweet.tweets = [];
                    for (const singleTweet of scheduledTweet.tweets) {
                        const selectedImages = [];
                        const mediaList = [];
                        const mediaUrlToS3Url = {};
                        for (const s3URL of singleTweet.mediaS3Urls) {
                            const fileKey = s3URL.split('/')[2];
                            const media = await Storage.get(fileKey, {
                                level: "private"
                            });
                            selectedImages.push({image: media, key: uuidv4()})
                            const extension = fileKey.split('.').pop().toLowerCase()
                            mediaList.push({file: media, extension: extension})
                            mediaUrlToS3Url[media] = s3URL;
                        }
                        console.log("poll")
                        console.log(singleTweet.poll)
                        let poll = convertBackendPollToFrontendPoll(singleTweet.poll)
                        console.log(poll)

                        updatedScheduledTweet.tweets.push({
                            ...singleTweet,
                            selectedImages: selectedImages,
                            media: mediaList,
                            mediaUrlToS3Url: mediaUrlToS3Url,
                            tweetKey: uuidv4(),
                            poll: poll
                        })


                    }
                    fetchedTweets.push(updatedScheduledTweet)
                }
                fetchedTweets.sort(function (tweet1, tweet2) {
                    if (tweet1.scheduledDateTime < tweet2.scheduledDateTime) {
                        return -1;
                    }
                    if (tweet1.scheduledDateTime > tweet2.scheduledDateTime) {
                        return 1;
                    }
                    return 0;
                });
                setScheduledTweetsGroupedByDay(groupByDate(fetchedTweets));

                setLoading(false);
            }
        )
    }

    useEffect(() => {
            Auth.currentAuthenticatedUser().then((user) => {
                const currentCognitoUserId = user.attributes.sub;
                setCognitoUserId(currentCognitoUserId);
                fetchTweets(currentCognitoUserId);
            })
            getUser().then((response) => {
                const cognitoUser = response.data.getCognitoUser;

                checkValidSubscription(cognitoUser)
                    .then((result) => {
                        //TODO do nothing, since user has valid subscription
                    })
                    .catch((error) => {
                        //TODO handle error, think about what should happen if user has no valid subscription.
                        //maybe user should not be allowed to make changes to scheduled tweets?
                        //or maybe do not post scheduled tweets?
                        console.log("handle error")
                        console.log(error)
                    })

                API.graphql(graphqlOperation(getTwitterUser, {cognitoUserId: cognitoUser.id}))
                    .then((res) => {
                        setTwitterUser(res.data.getTwitterUser);
                    })
                    .catch((error) => {
                        console.log("error from graphql query")
                        console.log(error)
                    })
            })
        }, []
    );


    async function handleUpdateTweet(updatedTwitterTweet) {
        const tweetList = [];
        updatedTwitterTweet.tweets.forEach((tweet) => {
            //if already on s3, use this instance otherwise need to upload it later
            const media = [];
            for (const mediaObj of tweet.media) {
                console.log(mediaObj)
                if (mediaObj.file in tweet.mediaUrlToS3Url) {
                    media.push({
                        s3Url: tweet.mediaUrlToS3Url[mediaObj.file]
                    });
                } else {
                    media.push({
                        file: mediaObj.file,
                        extension: mediaObj.extension,
                    })
                }
            }
            tweetList.push({
                ...tweet,
                media: media
            })
        })
        const updatedTweets = await uploadMediaToS3(tweetList, identityId);
        const processedUpdatedTwitterTweet = {
            tweetId: updatedTwitterTweet.tweetId,
            tweets: updatedTweets,
            scheduledDateTime: updatedTwitterTweet.scheduledDateTime,
            updateDateTime: new Date().toISOString(),
            usesThreadFinisher: updatedTwitterTweet.usesThreadFinisher
        }
        console.log("processedUpdatedTwitterTweet")
        console.log(processedUpdatedTwitterTweet)

        API.graphql(graphqlOperation(updateTwitterTweet, processedUpdatedTwitterTweet))
            .then((res) => {
                console.log("result of graphql mutation");
                console.log(res)
                fetchTweets(cognitoUserId)
            })
            .catch((error) => {
                console.log("error from graphql mutation")
                console.log(error)
            })
    }

    function renderPage() {
        if (!isLoading) {
            return (
                <Box sx={{display: 'flex'}}>
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
                        {scheduledTweetsGroupedByDay.length === 0 && (
                            <p className='no-tweet-header'>No tweets scheduled</p>)}
                        {scheduledTweetsGroupedByDay.map((dataForDay) => {
                            return (
                                <QueueDay key={dataForDay.key}
                                          datetime={dataForDay.datetime}
                                          scheduledTweets={dataForDay.scheduledTweets}
                                          refetchTweets={() => {
                                              fetchTweets(cognitoUserId)
                                          }}
                                          openEditDialog={openEditDialog}/>
                            )
                        })}
                    </Box>
                    <EditTweetDialog
                        twitterUser={twitterUser}
                        open={showEditTweetDialog}
                        handleUpdateTweet={handleUpdateTweet}
                        handleClose={() => {
                            setShowEditTweetDialog(false)
                        }}
                        tweetBackup={_lodash.cloneDeep(selectedTweetForEdit.current)}
                        scheduledTweetRef={selectedTweetForEdit}
                        openDateTimePicker={() => {
                            setShowScheduleDateTimePicker(true)
                        }}/>

                    <ScheduleDateTimePickerDialog open={showScheduleDateTimePicker}
                                                  handleClose={() => {
                                                      setShowScheduleDateTimePicker(false)
                                                  }}
                                                  setScheduledDateTime={(updatedDateTime) => {
                                                      //selectedTweetForEdit.current.scheduledDateTime = updatedDateTime;
                                                  }}
                                                  initDateTime={selectedTweetForEdit.current && selectedTweetForEdit.current.scheduledDateTime}
                                                  handleModalSchedule={(updatedDateTime) => {
                                                      selectedTweetForEdit.current.scheduledDateTime = updatedDateTime;
                                                  }}
                                                  text={'Save'}/>
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

    return renderPage()
}

export default Queue;