import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Auth} from "aws-amplify";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {CircularProgress} from "@mui/material";
import {isValidPassword} from "../utils/helpers";


function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function Copyright(props) {
    return (<Typography variant="body2" color="text.secondary" align="center" {...props}>
        {'Copyright © '}
        <Link color="inherit" href="https://mui.com/">
            Your Website
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
    </Typography>);
}

const theme = createTheme();

export default function ResetPassword() {
    const navigate = useNavigate();
    const [username, setUsername] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        handleResetPassword(username, data.get('verificationcode'), data.get('password'));
    };
    const handleResetPassword = (username, code, newPassword) => {
        if (newPassword.length < 0) {
            alert("Password not long enough");
            return
        }
        if (newPassword.length > 20) {
            alert("Password too long, at most 20 characters");
            return
        }
        if (!isValidPassword(newPassword)) {
            alert("Password needs at least 8 characters, one lower case, one upper case and one number.")
            return
        }

        setIsLoading(true);
        // Collect confirmation code and new password, then
        Auth.forgotPasswordSubmit(username, code, newPassword)
            .then(data => {
                alert('Successfully reset your password. You can now sign in using your new password')
                navigate('/signin');
            })
            .catch(error => {
                setIsLoading(false);
                console.log(error.code)
                if (error.code === 'CodeMismatchException') {
                    alert('Wrong verification code')
                } else if (error.code === 'ExpiredCodeException') {
                    alert('Verification code expired')
                } else if (error.code === 'LimitExceededException') {
                    alert('Too many tries!')
                } else {
                    alert('Some error occurred during mail verification.')
                }
            });
    };

    const handleRequestCode = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const _username = data.get('email')
        if (!isValidEmail(_username)) {
            alert("Invalid email")
            return;
        }

        // Send confirmation code to user's email
        Auth.forgotPassword(_username)
            .then(data => {
                alert("Verification code sent to your mail")
                setUsername(_username)
            })
            .catch(err => {
                console.log(err)
            });
    }

    function requestCodeUI() {
        if (username) {
            return;
        }
        return (
            <Box component="form" onSubmit={handleRequestCode} noValidate sx={{mt: 1}}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{mt: 3, mb: 2}}
                >
                    Request verification code
                </Button>
                <Grid container>
                    <Grid item xs>
                        <Link href="/signin" variant="body2">
                            Already have an account? Sign in
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="/signup" variant="body2">
                            {"Don't have an account? Sign Up"}
                        </Link>
                    </Grid>
                </Grid>
            </Box>)
    }

    function resetPasswordUI() {
        if (username === undefined) {
            return;
        }
        return (<Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="current-password"
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="verificationcode"
                label="Verification Code"
                type="text"
                id="verificationcode"
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{mt: 3, mb: 2}}
            >
                Reset Password
            </Button>
            <Grid container>
                <Grid item xs>
                    <Link href="/signin" variant="body2">
                        Already have an account? Sign in
                    </Link>
                </Grid>
                <Grid item>
                    <Link href="/signup" variant="body2">
                        {"Don't have an account? Sign Up"}
                    </Link>
                </Grid>
            </Grid>
        </Box>)
    }

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                <Box
                    sx={{
                        marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                >
                    <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Reset Password
                    </Typography>
                    {isLoading && (
                        <Box sx={{mt: 1}}>
                            <CircularProgress/>
                        </Box>
                    )}
                    {!isLoading && requestCodeUI()}
                    {!isLoading && resetPasswordUI()}
                </Box>
                <Copyright sx={{mt: 8, mb: 4}}/>
            </Container>
        </ThemeProvider>);
}
