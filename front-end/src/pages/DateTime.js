import * as React from 'react';
import TextField from '@mui/material/TextField';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import './DateTime.css'


export default function ResponsiveDateTimePickers(props) {

    return (
        <LocalizationProvider className="datePicker" dateAdapter={AdapterDateFns}>
            <DateTimePicker
                label="Pick your scheduling date/time"
                renderInput={(params) => <TextField {...params} />}
                value={props.pickedDateTime}
                onChange={props.onDateTimeChange}
            />
        </LocalizationProvider>
    );
}