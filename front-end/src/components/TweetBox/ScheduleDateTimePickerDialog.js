import * as React from 'react';
import Button from 'react-bootstrap/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import BasicDatePicker from "../Calendar";
import SelectAutoWidth from "../SelectTime/SelectTime";
import {useEffect, useState} from "react";
import "./Tweetbox.css";

const defaultDateTime = () => {
    return new Date(new Date().setMinutes(new Date().getMinutes() + 60))
};
export default function ScheduleDateTimePickerDialog(props) {
    const [pickedDateTime, setPickedDateTime] = useState(props.initDateTime || defaultDateTime());
    const handleUpdatePickedTime = (updatedDateTime) => {
        const minimumAllowedDateTime = new Date(new Date().setMinutes(new Date().getMinutes() + 10));
        if (updatedDateTime < minimumAllowedDateTime) {
            alert("You have to pick a time in the future, at least ten minutes from now");
        } else {
            setPickedDateTime(updatedDateTime);
            props.setScheduledDateTime(updatedDateTime);
        }
    }
    const handleSetHours = (hours) => {
        const updatedDateTime = new Date(pickedDateTime);
        updatedDateTime.setHours(hours);
        handleUpdatePickedTime(updatedDateTime);
    }
    const handleSetMinutes = (minutes) => {
        const updatedDateTime = new Date(pickedDateTime);
        updatedDateTime.setMinutes(minutes);
        handleUpdatePickedTime(updatedDateTime);
    }
    const handleSetDate = (date) => {
        const updatedDateTime = new Date(pickedDateTime);
        updatedDateTime.setDate(date.getDate());
        updatedDateTime.setMonth(date.getMonth());
        updatedDateTime.setFullYear(date.getFullYear());
        handleUpdatePickedTime(updatedDateTime);
    }

    function getMinutesString() {
        let minutes = pickedDateTime.getMinutes()
        if (minutes < 10) {
            minutes = '0' + minutes
        }
        return minutes;
    }

    useEffect(() => {
        if ('initDateTime' in props) {
            if (props.initDateTime) {
                setPickedDateTime(props.initDateTime)
            }
        }
    }, [props.open])

    return (
        <div>
            {pickedDateTime && (
                <Dialog open={props.open} onClose={props.handleClose}>
                    <DialogContent>
                        <div>
                            <BasicDatePicker id="date-picker" value={pickedDateTime} setValue={handleSetDate}/>
                            <div className="hour-min-div">
                                <div className='hoursPicker'>
                                    <SelectAutoWidth timePicker={true} value={pickedDateTime.getHours()}
                                                     setValue={handleSetHours}/>
                                </div>
                                <div className='minutesPicker'>
                                    <SelectAutoWidth timePicker={false} value={getMinutesString()}
                                                     setValue={handleSetMinutes}/>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                    <DialogActions>
                        {props.addToQueueButtonEnabled && <Button onClick={(event) => {
                            props.handleClose()
                            props.addToQueue(event)
                        }} variant="outline-primary">Add to Queue</Button>}
                        <Button onClick={props.handleClose} variant="secondary">Cancel</Button>
                        <Button onClick={() => {
                            props.handleModalSchedule(pickedDateTime)
                            props.handleClose()
                        }}
                                variant="primary">
                            {props.text || 'Schedule'}
                        </Button>
                    </DialogActions>
                </Dialog>)}
        </div>
    );
}
