import * as React from 'react';
import '../App.css';
import '../components/TweetBox/Tweetbox.css'
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {CircularProgress} from "@mui/material";
import Box from '@mui/material/Box';
import CreateNewTweetBox from "../components/TweetBox/CreateNewTweetBox";
import {useSelector} from "react-redux";
import {selectCognitoUserId} from "../redux/slicer/userDataSlice";


function Scheduler() {
    let navigate = useNavigate();
    const [isLoading, setLoading] = useState(true)
    const cognitoUserId = useSelector(selectCognitoUserId)
    useEffect(() => {
        if(cognitoUserId) {
            setLoading(false)
        }
    }, [cognitoUserId]);

    function renderPage() {
        if (!isLoading) {
            return (
                <CreateNewTweetBox/>
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

export default Scheduler;