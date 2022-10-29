import React, {useEffect} from "react";
import {Box, Divider} from "@mui/material";
import "../TweetBox/Tweetbox.css";
import Button from "@mui/material/Button";
import 'react-giphy-select/lib/styles.css';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {StyleSheet} from 'react-native';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import {v4 as uuidv4} from 'uuid';

const days = [0, 1, 2, 3, 4, 5, 6, 7];
const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const minutes = fillMinutes();


function fillMinutes() {
    const min = [];
    for (let i = 0; i < 60; i++) {
        min.push(i);
    }
    return min;
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
const smallMinutes = fillSmallMinutes();

function fillSmallMinutes() {
    const min = [];
    for (let i = 5; i < 60; i++) {
        min.push(i);
    }
    return min;
}

export function SinglePoll(props) {

    let maxPollRow = 4;
    const defaultPollOptions = () => [{key: uuidv4(), value: '', count: 0}, {key: uuidv4(), value: '', count: 0}];
    const [showAddPollBtn, setShowAddPollBtn] = React.useState(true);
    const [pollDays, setPollDays] = React.useState(props.poll.days || 0);
    const [pollHours, setPollHours] = React.useState(props.poll.hours || 0);
    const [pollMinutes, setPollMinutes] = React.useState(props.poll.minutes || (pollDays === 0 && pollHours === 0 ? 5 : 0));
    const [pollOptions, setPollOptions] = React.useState(props.poll.rows || defaultPollOptions());


    useEffect(() => {
    }, [])

    function handleChangeDuration(event) {
        const name = event.target.name;
        const value = event.target.value;
        let newPollDays = pollDays;
        let newPollHours = pollHours;
        let newPollMinutes = pollMinutes;

        // On autofill we get a stringified value.
        const parsedValue = typeof value === 'string' ? value.split(',') : value;
        if (name === "days") {
            if (parsedValue === 0 && pollHours === 0 && pollMinutes < 5) {
                newPollMinutes = 5;
            }
            newPollDays = parsedValue;
        } else if (name === "hours") {
            if (parsedValue === 0 && pollDays === 0 && pollMinutes < 5) {
                newPollMinutes = 5;
            }
            newPollHours = parsedValue;
        } else if (name === "minutes") {
            newPollMinutes = parsedValue;
        }

        props.poll.days = newPollDays;
        props.poll.hours = newPollHours;
        props.poll.minutes = newPollMinutes;
        setPollDays(newPollDays);
        setPollHours(newPollHours);
        setPollMinutes(newPollMinutes);
        console.log("days: " + props.poll.days + " hours: " + props.poll.hours + " minutes: " + props.poll.minutes);
    };

    const handleInputChangePolls = (e, index) => {
        const {value} = e.target;
        const list = [...pollOptions];
        list[index]['value'] = value;
        setPollOptions(list);
        props.poll.rows = pollOptions;
    }


    function resetPoll(event) {
        setPollOptions(defaultPollOptions())
        props.resetPoll();
    }

    function handleCounters(event, i) {
        const list = [...pollOptions];
        list[i].count = event.target.value.length;
        setPollOptions(list);
    }

    const addPoll = () => {
        if (pollOptions.length < maxPollRow) {
            setPollOptions([...pollOptions, {key: uuidv4(), value: '', count: 0}])
            console.log("polls: " + pollOptions)
        }
        if (pollOptions.length >= 3) {
            setShowAddPollBtn(false);
        }
    }

    // Styles.
    const styles = StyleSheet.create({
        poll_small: {
            width: 300
        },
        poll_large: {
            width: 350
        }
    })

    return (
        <Box id="poll-div">
            <Box id="poll-textfields">
                <Box id="poll-textfields-container">
                    {
                        pollOptions.map((pollChoice, i) => {
                            return (
                                <Box id="poll-textfield" key={pollChoice.key}>
                                    <TextField
                                        style={showAddPollBtn ? styles.poll_small : styles.poll_large}
                                        id="poll-basic-tf"
                                        label={"Choice " + (i + 1)}
                                        inputProps={{maxLength: 25}}
                                        onChange={(event) => {
                                            handleCounters(event, i);
                                            handleInputChangePolls(event, i);
                                        }}
                                        value={pollChoice.value || ''}
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: <InputAdornment
                                                position="end">{pollOptions[i].count}/25</InputAdornment>,
                                        }}
                                    />

                                    {showAddPollBtn && (i === pollOptions.length - 1) &&
                                        <AddBoxIcon id="add-poll-btn" sx={{fontSize: 35}} color="primary"
                                                    onClick={addPoll}/>
                                    }

                                </Box>
                            )

                        })}
                </Box>
                <Divider id="poll-section-divider" sx={{
                    mt: 2,
                    mb: 2
                }}/>
                <Box id="pool-date-selector">
                    <p className="poll-label">Poll length</p>
                    <FormControl sx={{m: 1, width: 100}}>
                        <InputLabel id="demo-multiple-name-label">Days</InputLabel>
                        <Select
                            name="days"
                            labelId="demo-multiple-name-label"
                            id="demo-multiple-name"
                            value={pollDays}
                            onChange={handleChangeDuration}
                            input={<OutlinedInput label="Days"/>}
                            MenuProps={MenuProps}
                        >
                            {days.map((day) => (
                                <MenuItem
                                    key={day}
                                    value={day}

                                >
                                    {day}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{m: 1, width: 100}}>
                        <InputLabel id="demo-multiple-name-label">Hours</InputLabel>
                        <Select
                            name="hours"
                            labelId="demo-multiple-name-label"
                            id="demo-multiple-name"
                            value={pollHours}
                            onChange={handleChangeDuration}
                            input={<OutlinedInput label="Hours"/>}
                            MenuProps={MenuProps}
                        >
                            {hours.map((hour) => (
                                <MenuItem
                                    key={hour}
                                    value={hour}

                                >
                                    {hour}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{m: 1, width: 100}}>
                        <InputLabel id="demo-multiple-name-label">Minutes</InputLabel>
                        <Select
                            name="minutes"
                            labelId="demo-multiple-name-label"
                            id="demo-multiple-name"
                            value={pollMinutes}
                            onChange={handleChangeDuration}
                            input={<OutlinedInput label="Minutes"/>}
                            MenuProps={MenuProps}
                        >
                            {(pollDays > 0 || pollHours > 0) && minutes.map((minute) => (
                                <MenuItem
                                    key={minute}
                                    value={minute}
                                >
                                    {minute}
                                </MenuItem>
                            ))}
                            {pollDays === 0 && pollHours === 0 && smallMinutes.map((minute) => (
                                <MenuItem
                                    key={minute}
                                    value={minute}

                                >
                                    {minute}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Box id="remove-poll-btn"
                     sx={{
                         display: 'grid',
                     }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={(event) => {
                            resetPoll(event)
                        }}>
                        Remove poll
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}