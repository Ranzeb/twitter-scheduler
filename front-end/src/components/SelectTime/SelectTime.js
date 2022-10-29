import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import './SelectTime.css'

export default function SelectAutoWidth(props) {
    const minutesArr = () => {
        let minutes = [];
        for (let i = 0; i < 60; i++) {
            let minute = i.toString();
            if (i < 10)
                minute = '0' + minute;
            minutes.push(minute)
        }
        return minutes;
    }

    const hoursArr = () => {
        let hours = [];
        for (let i = 0; i < 24; i++) {
            let hour = i.toString();
            hours.push(hour)
        }
        return hours;
    }

    return (
        <div>
            <FormControl sx={{m: 1, minWidth: 80}}>
                <InputLabel
                    id="demo-simple-select-autowidth-label">{props.timePicker ? 'Hours' : 'Minutes'}</InputLabel>
                <Select
                    labelId="demo-simple-select-autowidth-label"
                    id="demo-simple-select-autowidth"
                    value={props.value}
                    onChange={(event) => {
                        props.setValue(event.target.value)
                    }}
                    autoWidth
                    label="Time"
                >
                    {
                        props.timePicker && (
                            hoursArr().map((item) => {
                                return (
                                    <MenuItem value={item} key={item}>{item}</MenuItem>
                                )
                            })
                        )
                    }
                    {
                        !props.timePicker && (
                            minutesArr().map((item) => {
                                return (
                                    <MenuItem value={item} key={item}>{item}</MenuItem>
                                )
                            })
                        )
                    }
                </Select>
            </FormControl>
        </div>
    );
}