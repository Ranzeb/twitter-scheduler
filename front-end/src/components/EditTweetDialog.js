import * as React from 'react';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {useEffect, useState} from "react";
import Button from 'react-bootstrap/Button';
import TweetBox from "./TweetBox/TweetBox";
import {Box} from "@mui/material";
import {validateTweets} from "../utils/twitter_utils";

export default function EditTweetDialog(props) {
    //TODO fix bug
    //TODO when changing time and isQueued => isQueued = false
    //TODO when removing and isQueued, also remove from queue
    //TODO should queued and scheduled tweets be merged into one db?
    const [counter, setCounter] = useState(0);
    useEffect(() => {
    }, [])

    function handleCancel() {
        console.log('cancel')
        console.log(props.tweetBackup)
        for (const key_ of Object.keys(props.scheduledTweetRef.current)) {
            console.log(key_)
            props.scheduledTweetRef.current[key_] = props.tweetBackup[key_];
        }
        props.handleClose()
    }

    return (
        <Dialog
            open={props.open}
            onClose={handleCancel}
            fullWidth={true}
            maxWidth={'lg'}>
            <DialogTitle sx={{
                fontWeight: 600,
                ml: 1
            }}>Edit scheduled tweet</DialogTitle>
            <DialogContent sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyItems: 'center',
                alignItems: 'center',
            }}>
                {props.scheduledTweetRef &&
                    props.scheduledTweetRef.current &&
                    props.scheduledTweetRef.current.tweets !== undefined && (
                        <Box component="main"
                             sx={{
                                 display: 'flex',
                                 justifyItems: 'center',
                                 alignItems: 'center',
                                 flexDirection: 'column',
                                 p: 3,
                                 width: '100%',
                             }}>
                            <TweetBox
                                tweets={props.scheduledTweetRef.current.tweets}
                                userInfo={props.twitterUser}
                                setTweets={(tweets) => {
                                    props.scheduledTweetRef.current.tweets = tweets;
                                    setCounter(counter + 1);
                                }}
                                usesThreadFinisher={props.scheduledTweetRef.current.usesThreadFinisher}
                                setUsesThreadFinisher={(value) => {
                                    props.scheduledTweetRef.current.usesThreadFinisher = value;
                                    setCounter(counter - 1)
                                }}
                                sx={{
                                    display: 'flex',
                                    justifyItems: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    justifyContent: 'space-evenly',
                                    width: '90%',
                                    maxWidth: '700px',
                                    m: 2,
                                }}/>
                            <p>Post time: {props.scheduledTweetRef.current.scheduledDateTime.toLocaleString()}</p>
                            <Button onClick={() => {
                                props.openDateTimePicker();
                            }}>Change Time</Button>
                        </Box>
                    )}
            </DialogContent>
            <DialogActions>
                <Button variant='danger' onClick={handleCancel}>Cancel</Button>
                <Button onClick={async () => {
                    console.log(props.scheduledTweetRef.current)
                    const validationResult = await validateTweets(props.scheduledTweetRef.current.tweets);
                    if (validationResult.status !== 'valid') {
                        alert(validationResult.message);
                        return;
                    }
                    props.handleUpdateTweet(props.scheduledTweetRef.current)
                    props.handleClose()
                }}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}
