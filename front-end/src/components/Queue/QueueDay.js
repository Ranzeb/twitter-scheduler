import * as React from 'react';
import {Box, IconButton} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {API, graphqlOperation} from "aws-amplify";
import {deleteTwitterTweet} from "../../graphql/mutations";
import Divider from "@mui/material/Divider";
import "../../pages/styles/settings.css";
import TextField from '@mui/joy/TextField';
import Typography from "@mui/material/Typography";

function getSingleTweetBox(tweetObj, isLastTweet) {
    return (
        <Box
            key={tweetObj.tweetKey}
            sx={{
                rowGap: 1,
                columnGap: 1
            }}>
            <Box sx={{
                color: '#495057',
            }}>
                <Typography variant="body1" sx={{whiteSpace: 'pre-line'}}>
                    {tweetObj.tweetText}
                </Typography>
            </Box>
            <Box>
                {tweetObj.selectedImages.map((media) => {
                    return <img src={media.image} key={media.key} height={100}/>
                })}
            </Box>
            <Box
                id="poll-rows-scheduled"
                sx={{
                    mt: 1
                }}>
                {Object.entries(tweetObj.poll).length > 0 && tweetObj.poll.rows.map((row) => {
                    return (
                        <TextField
                            sx={{
                                ml: 2,
                                width: 465,
                                mb: 1
                            }}
                            variant="outlined"
                            color="neutral"
                            size="sm"
                            placeholder={row.value}
                            fullWidth
                            disabled/>
                    )
                })
                }

                {Object.entries(tweetObj.poll).length > 0 &&
                    <Box id="poll-date-time-schedule">
                        <p className='poll-schedule-time'>Poll will run
                            for {tweetObj.poll.days}d {tweetObj.poll.hours}h {tweetObj.poll.minutes}m</p>
                    </Box>
                }
            </Box>
            {!isLastTweet && <Divider/>}
        </Box>
    );
}

function dateTimeToTimeStr(datetime) {
    let minutes = datetime.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    return datetime.getHours() + ":" + minutes;
}

function getTweetOrThreadBox(scheduledTweet, refetchTweets, openEditDialog) {
    return (
        <Box id="common-settings-box"
             key={scheduledTweet.tweetId}
             sx={{
                 pl: 2,
                 pr: 2,
                 justifyContent: 'stretch',
                 justifyItems: 'center',
                 alignItems: 'center',
                 alignContent: 'center'
             }}>
            <Box
                sx={{
                    pl: 2,
                    pr: 2,
                    rowGap: 1,
                    columnGap: 2,
                    display: 'flex',
                    justifyContent: 'stretch',
                    justifyItems: 'center',
                    alignItems: 'center',
                    alignContent: 'center'
                }}>
                <Box
                    sx={{
                        fontWeight: 600,
                        fontSize: 14,
                        textAlign: 'center'
                    }}>
                    {dateTimeToTimeStr(scheduledTweet.scheduledDateTime)}
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        rowGap: 1,
                        columnGap: 1,
                    }}>

                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        textAlign: 'center'
                    }}>
                    <IconButton
                        variant="contained"
                        component="label"
                        onClick={(event) => {
                            API.graphql(graphqlOperation(deleteTwitterTweet, {
                                tweetId: scheduledTweet.tweetId
                            }))
                                .then((res) => {
                                    console.log("result of graphql mutation");
                                    console.log(res)
                                    refetchTweets()
                                })
                                .catch((error) => {
                                    console.log("error from graphql mutation")
                                    console.log(error)
                                })
                        }}
                    >
                        <DeleteIcon/>
                    </IconButton>
                    <IconButton
                        variant="contained"
                        component="label"
                        onClick={(event) => {
                            openEditDialog(scheduledTweet)
                        }}
                    >
                        <EditIcon/>
                    </IconButton>
                </Box>
            </Box>
            <Divider/>
            <Box
                sx={{
                    flexGrow: 1,
                    rowGap: 1,
                    columnGap: 1,
                    pl: 2,
                    pr: 2,
                    mt: 1,
                    mb: 1,
                }}>
                {scheduledTweet.tweets.map((tweetObj, index) => {
                    return getSingleTweetBox(tweetObj, index === scheduledTweet.tweets.length - 1);
                })}
            </Box>
        </Box>

    );
}

export default function QueueDay({datetime, scheduledTweets, refetchTweets, openEditDialog}) {

    function dateTimeToDateHeading(datetime) {
        //TODO UTC is wrong, use user time, since 1 am might be tomorrow or day after tomorrow  in local time
        const today = new Date()
        if (today.getUTCFullYear() === datetime.getUTCFullYear() &&
            today.getUTCMonth() === datetime.getUTCMonth()) {
            if (today.getUTCDate() === datetime.getUTCDate()) {
                return "Today";
            } else if (today.getUTCDate() + 1 === datetime.getUTCDate()) {
                return "Tomorrow";
            }
        }

        return datetime.toDateString();//datetime.getMonth() + " " + datetime.getDate();
    }


    return (
        <Box sx={{
            display: 'grid',
            rowGap: 1,
            columnGap: 1,
            width: '80%',
            maxWidth: '700px'
        }}>
            <p className='queue-date-header'>{dateTimeToDateHeading(datetime)}</p>

            {scheduledTweets.map((scheduledTweet) => {
                return getTweetOrThreadBox(scheduledTweet, refetchTweets, openEditDialog)
            })}
        </Box>
    );
}
