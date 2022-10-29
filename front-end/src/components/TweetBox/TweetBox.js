import React, {useEffect, useRef} from 'react'
import './Tweetbox.css'
import {v4 as uuidv4} from 'uuid';
import {SingleTweetBox} from "./SingleTweetBox";
import {Box} from "@mui/material";


export function generateTweet(newTweet) {
    let default_tweet = {
        tweetText: '',
        key: uuidv4(),
        isShowingEmojiPicker: false,
        media: [],
        selectedImages: [],
        isKeyUp: true,
        poll: {}
    };

    for (let key in default_tweet) {
        if (key in newTweet && key !== 'key') {
            //always use provided value, except for key
            //always replace key, so react does rerendering
        } else {
            newTweet[key] = default_tweet[key];
        }
    }
    return newTweet;
}

function TweetBox({tweets, userInfo, setTweets, sx, usesThreadFinisher, setUsesThreadFinisher}) {
    const cursorPositions = useRef([0]);

    const addToList = (listObj, index, newItem) => {
        let updatedList = listObj.slice(0, index + 1);
        updatedList.push(newItem)
        updatedList.push(...listObj.slice(index + 1))
        return updatedList;
    }
    const removeFromList = (listObj, index) => {
        const updatedList = [...listObj];
        updatedList.splice(index, 1);
        return updatedList;
    }


    const addTweet = (event, index) => {
        let userName = userInfo.screenName;
        let text = "That's it!\n\nIf you enjoyed this thread:\n\n1. Follow me @" + userName + " for more of these\n2. Wanna share this thread with your audience? RT the tweet below";
        cursorPositions.current = addToList(cursorPositions.current, index, 0)
        const newItem = generateTweet({});
        const updatedTweets = addToList(tweets, index, newItem)

        const key = updatedTweets[index]["key"];
        updatedTweets[index]["isKeyUp"] = true;
        updatedTweets.map((val) => {
            if (val.key === key) {
                val.isKeyUp = false;
            }

        });
        if (index === 0 && !usesThreadFinisher) {
            updatedTweets.push(generateTweet({tweetText: text}))
            updatedTweets[index + 2]["isKeyUp"] = false;
            setUsesThreadFinisher(true);
        }
        setTweets(updatedTweets)
    }

    const removeTweet = (event, index) => {
        cursorPositions.current = removeFromList(cursorPositions.current, index)

        if (index === tweets.length - 1) {
            setUsesThreadFinisher(false)
        }

        const updatedTweets = removeFromList(tweets, index)
        if (index - 1 < 0) {
            updatedTweets[index]["isKeyUp"] = true;
        } else {
            updatedTweets[index - 1]["isKeyUp"] = true;
        }

        setTweets(updatedTweets);
    }

    const handleChange = (event, index) => {
        const {name, value} = event.target;
        const updatedTweets = [...tweets];
        updatedTweets[index][name] = value;
        setTweets(updatedTweets);
    }

    const onDisplayChange = (event, index, val) => {
        const updatedTweets = [...tweets];
        const key = updatedTweets[index]["key"];
        updatedTweets[index]["isKeyUp"] = true;
        updatedTweets.map((val) => {
            if (val.key !== key) {
                val.isKeyUp = false;
            }
        });
        setTweets(updatedTweets);
    }

    function handleImageSelected(imageFile, index) {
        const allowedTypes = [
            "image/jpeg",
            "video/mp4",
            "image/gif",
            "image/png",
            "image/webp"
        ];
        if (!allowedTypes.includes(imageFile.type)) {
            alert("File type not allowed. Must be one of [jpeg, mp4, gif, png, webp]")
            return;
        }
        const allowedExtensions = [
            'jpeg',
            'jpg',
            'png',
            'mp4',
            'webp',
            'gif'
        ]
        const extension = imageFile.name.split('.').pop()
        if (!allowedExtensions.includes(extension)) {
            alert("File type not allowed. Must be one of [jpeg, mp4, gif, png, webp]")
            return;
        }
        const updatedTweets = [...tweets];
        updatedTweets[index].media.push({
            file: imageFile,
            extension: extension
        });
        updatedTweets[index].selectedImages.push({
            image: URL.createObjectURL(imageFile),
            key: uuidv4()
        });
        setTweets(updatedTweets);
    }

    function handleRemoveImage(mediaIndex, tweetIndex) {
        const updatedTweets = [...tweets];
        updatedTweets[tweetIndex].media.splice(mediaIndex, 1);
        updatedTweets[tweetIndex].selectedImages.splice(mediaIndex, 1);
        setTweets(updatedTweets);
    }

    useEffect(() => {
    }, []);

    const onSelectionChange = (selectionStart, index) => {
        cursorPositions.current[index] = selectionStart;
    }
    const onEmojiSelect = (selectedEmoji, index) => {
        const lastSelectionStart = cursorPositions.current[index];
        let selectedTweet = [...tweets.slice(index, index + 1)][0];
        //const textBeforeCursor = runes.substr(selectedTweet, 0, lastSelectionStart)
        const textBeforeCursor = selectedTweet.tweetText.substring(0, lastSelectionStart)
        const textAfterCursor = selectedTweet.tweetText.substring(lastSelectionStart)
        const updatedTweetText = textBeforeCursor + selectedEmoji.native + textAfterCursor;
        let updatedTweets = tweets.slice(0, index);
        updatedTweets.push(generateTweet({
            ...selectedTweet,
            tweetText: updatedTweetText,
        }))
        updatedTweets.push(...tweets.slice(index + 1))
        cursorPositions.current[index] += selectedEmoji.native.length;
        setTweets(updatedTweets);
    }
    const onGifSelect = (selectedGif, index) => {
        const allowedTypes = [
            "image/gif",
        ];
        if (!allowedTypes.includes(selectedGif.type)) {
            alert("File type not allowed. Must be gif.")
            return;
        }
        const extension = 'gif';
        let updatedTweets = [...tweets];
        let updatedTweet = generateTweet({
            ...updatedTweets[index],
            isShowingGifPicker: false
        });
        updatedTweet.media.push({
            file: selectedGif,
            extension: extension
        });
        updatedTweet.selectedImages.push({
            image: URL.createObjectURL(selectedGif),
            key: uuidv4()
        });
        updatedTweets[index] = updatedTweet;
        setTweets(updatedTweets);
    }

    function toggleEmojiPicker(index) {
        let selectedField = tweets[index];
        let updatedTweets = tweets.slice(0, index);
        updatedTweets.push(
            generateTweet({
                ...selectedField,
                isShowingEmojiPicker: !selectedField.isShowingEmojiPicker
            })
        )
        updatedTweets.push(...tweets.slice(index + 1))
        setTweets(updatedTweets);
    }

    function toggleGifPicker(index) {
        let selectedField = [...tweets.slice(index, index + 1)][0]
        let updatedTweets = tweets.slice(0, index);
        updatedTweets.push(
            generateTweet({
                ...selectedField,
                isShowingGifPicker: !selectedField.isShowingGifPicker
            })
        )
        updatedTweets.push(...tweets.slice(index + 1))
        setTweets(updatedTweets);
    }

    function togglePoll(index) {
        let selectedField = tweets[index];
        let updatedTweets = tweets.slice(0, index);
        const newPollState = !selectedField.isShowingPoll;
        console.log("togglePoll")
        let newPoll = selectedField.poll;
        if (newPollState === false) {
            newPoll = {};
        }
        console.log(newPoll)

        updatedTweets.push(
            generateTweet({
                ...selectedField,
                isShowingPoll: newPollState,
                poll: newPoll
            })
        )
        updatedTweets.push(...tweets.slice(index + 1))
        setTweets(updatedTweets);
    }

    return (
        <Box sx={sx}>
            {tweets.map((data, index) => {
                return (<SingleTweetBox data={data}
                                        index={index}
                                        keyUp={data.isKeyUp}
                                        key={data.key || data.tweetKey}
                                        handleChange={handleChange}
                                        addTweet={addTweet}
                                        removeTweet={removeTweet}
                                        moreThanOneTweet={tweets.length > 1}
                                        toggleEmojiPicker={toggleEmojiPicker}
                                        toggleGifPicker={toggleGifPicker}
                                        onEmojiSelect={onEmojiSelect}
                                        onGifSelect={onGifSelect}
                                        onDisplayChange={onDisplayChange}
                                        onSelectionChange={onSelectionChange}
                                        handleImageSelected={handleImageSelected}
                                        handleRemoveImage={handleRemoveImage}
                                        togglePoll={togglePoll}
                    />
                )
            })}
        </Box>

    )
}

export default TweetBox;
