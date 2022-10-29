import * as React from 'react';
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

function GoodBye() {
    let navigate = useNavigate();

    return (
        <Box sx={{display: 'flex'}}>
            <Box component="main"
                 sx={{
                     display: 'flex',
                     justifyItems: 'center',
                     alignItems: 'center',
                     flexDirection: 'column',
                     flexGrow: 1,
                     p: 3
                 }}>
                <h1>Good bye</h1>
                <Button onClick={() => {
                    navigate('/signin')
                }}>Log back in
                </Button>
            </Box>
        </Box>
    );
}

export default GoodBye;
