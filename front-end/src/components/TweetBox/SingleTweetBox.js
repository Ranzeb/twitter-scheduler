import React, {useRef, useEffect} from "react";
import {Box, IconButton} from "@mui/material";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import "./Tweetbox.css";
import * as emojiMartData from '@emoji-mart/data'
import {Picker} from 'emoji-mart'
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import Button from "@mui/material/Button";
import GifBoxIcon from '@mui/icons-material/GifBox';
import 'react-giphy-select/lib/styles.css';
import ReactGiphySearchbox from 'react-giphy-searchbox'
import CancelIcon from '@mui/icons-material/Cancel';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import PollIcon from '@mui/icons-material/Poll';
import {StyleSheet} from 'react-native';
import {SinglePoll} from "../Poll/Poll";
import {v4 as uuidv4} from 'uuid';
import {validateMediaElement} from "../../utils/twitter_utils";

function EmojiPicker(props) {
    let firstRender = true;
    const ref = useRef()

    useEffect(() => {
        if (firstRender) {
            firstRender = false;
            new Picker({...props, emojiMartData, ref})
        }
    }, [])

    return <Box ref={ref}/>
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};
const MIN_TEXTAREA_HEIGHT = 32;


export function SingleTweetBox(props) {

    let pollKey = uuidv4();
    const [count, setCount] = React.useState(0);
    const [isShowingPoll, setIsShowingPoll] = React.useState(Object.keys(props.data.poll).length > 0);
    const textareaRef = React.useRef(null);


    React.useLayoutEffect(() => {
        // Reset height - important to shrink on delete
        textareaRef.current.style.height = "inherit";
        // Set height
        textareaRef.current.style.height = `${Math.max(
            textareaRef.current.scrollHeight,
            MIN_TEXTAREA_HEIGHT
        )}px`;
    }, [props.data.tweetText]);

    useEffect(() => {
        if (props.data.tweetText) {
            setCount(props.data.tweetText.length);
        }
    }, [])

    const resetPoll = () => {
        props.data.poll = {};
        setIsShowingPoll(false)
    }

    const onDisplay = (event, value) => {
        props.onDisplayChange(event, props.index, value)
    }

    const onSelectionChange1 = (event) => {
        props.onSelectionChange(event.target.selectionStart, props.index);
    }

    function passThroughEmojiSelect(selectedEmoji) {
        props.onEmojiSelect(selectedEmoji, props.index)
    }

    async function passThroughGifSelect(item) {
        const url = item.images.downsized.url;
        const gif = await fetch(url);
        const selectedGif = await gif.blob();
        props.onGifSelect(selectedGif, props.index)
    }

    async function passThroughHandleImageSelected(event) {
        const imageFile = event.target.files[0];
        const validationResult = await validateMediaElement(imageFile)
        console.log(validationResult)
        if (validationResult.status === 'invalid') {
            alert(validationResult.message)
            return;
        }
        props.handleImageSelected(imageFile, props.index)
    }

    function passThroughHandleImageRemoved(mediaIndex) {
        props.handleRemoveImage(mediaIndex, props.index)
    }

    // Styles.
    const styles = StyleSheet.create({
        color_cyan: {
            color: '#2196f3'
        },
        color_red: {
            color: '#f44336'
        }
    })

    function containsGif() {
        //TODO are there any other gif formats?
        for (const mediaObj of props.data.media) {
            if (mediaObj.extension === 'gif') {
                return true
            }
        }
        return false;
    }

    function containsVideo() {
        //TODO are there any other video formats?
        for (const mediaObj of props.data.media) {
            if (mediaObj.extension === 'mp4') {
                return true
            }
        }
        return false;
    }

    return (
        <Box id="tweet-bg"
             sx={{
                 display: 'flex',
                 justifyItems: 'center',
                 alignItems: 'center',
                 flexDirection: 'column',
                 width: '100%',
                 borderRadius: '10px',
                 p: 1,
                 m: 1,
                 background: '#e5e5e5'
             }}
             key={props.data.key}>
            <Box sx={{width: '100%'}}>
                <textarea
                    style={{
                        minHeight: MIN_TEXTAREA_HEIGHT,
                        resize: "none",
                        overflow: "hidden"
                    }}
                    ref={textareaRef}
                    onChange={(event) => {
                        props.handleChange(event, props.index);
                        setCount(event.target.value.length)
                    }}
                    onBlur={(event) => {
                        onSelectionChange1(event);
                        onDisplay(event, false);
                    }
                    }
                    onKeyUp={(event) => onSelectionChange1(event)}
                    onFocus={(event) => onDisplay(event, true)}
                    value={props.data.tweetText}
                    name="tweetText"
                    className="form-control"
                    placeholder="Write your tweet here..."
                />
            </Box>
            <Box id="image-div">
                {props.data.selectedImages && props.data.selectedImages.map((selectedImage, mediaIndex) => {
                        return (
                            <div key={selectedImage.key}>
                                {props.keyUp && (<div className="container">
                                    <img src={selectedImage.image} height={100}/>
                                    <Button onClick={() => {
                                        passThroughHandleImageRemoved(mediaIndex)
                                    }}><CancelIcon/>
                                    </Button>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>

                                    </Box>
                                </div>)}
                            </div>
                        )
                    }
                )}
            </Box>
            {isShowingPoll &&
                (<SinglePoll
                        key={pollKey}
                        poll={props.data.poll}
                        setIsShowingPoll={setIsShowingPoll}
                        resetPoll={resetPoll}/>
                )}
            {props.keyUp && (
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'space-between',
                    justifyContent: 'space-between',
                    justifyItems: 'space-between',
                    flexDirection: 'row'
                }}
                     key={props.data.key}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        justifyItems: 'space-between',
                        flexDirection: 'row',
                    }}>
                        <Box>
                            <IconButton
                                variant="contained"
                                component="label"
                                onClick={() => {
                                    props.toggleEmojiPicker(props.index)
                                }}
                            >
                                <AddReactionIcon sx={{fontSize: 22}}/>
                            </IconButton>
                            {props.data.isShowingEmojiPicker &&
                                <EmojiPicker id="emoji-picker" onEmojiSelect={passThroughEmojiSelect}/>}
                        </Box>
                        <Box>
                            <IconButton
                                disabled={isShowingPoll || props.data.selectedImages.length > 0}
                                variant="contained"
                                component="label"
                                onClick={() => {
                                    props.toggleGifPicker(props.index)
                                }}
                            >
                                <GifBoxIcon sx={{fontSize: 24}}/>
                            </IconButton>
                            {props.data.isShowingGifPicker &&
                                <ReactGiphySearchbox
                                    className="gif-picker"
                                    apiKey='<YOUR_API_KEY>'
                                    onSelect={passThroughGifSelect}
                                />}
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row'
                            }}>
                            <IconButton
                                disabled={isShowingPoll || containsGif() || containsVideo()}
                                variant="contained"
                                component="label"
                            >
                                <AddPhotoAlternateIcon sx={{fontSize: 25}}/>
                                <input
                                    type="file"
                                    hidden
                                    onChange={(event) => {
                                        passThroughHandleImageSelected(event)
                                    }}
                                />
                            </IconButton>
                        </Box>
                        <Box>
                            <IconButton
                                disabled={props.data.selectedImages.length > 0}
                                variant="contained"
                                component="label"
                                onClick={(event) => {
                                    setIsShowingPoll(!isShowingPoll)
                                }}
                            >
                                <PollIcon sx={{fontSize: 24}}/>
                            </IconButton>
                        </Box>
                    </Box>
                    <Box>
                        <Box
                            sx={{
                                display: 'contents'
                            }}>
                            <p className="char-counter" style={count < 280 ? styles.color_cyan : styles.color_red}>
                                {count < 280 ? count : -(count - 280)}
                            </p>
                        </Box>

                        <AddBoxIcon sx={{fontSize: 35}} color="primary"
                                    onClick={(event) => props.addTweet(event, props.index)}/>

                        {props.moreThanOneTweet ? <IndeterminateCheckBoxIcon sx={{fontSize: 35}} color="error"
                                                                             onClick={(event) => props.removeTweet(event, props.index)}/> : ''}
                    </Box>
                </Box>)}
        </Box>
    )
}
