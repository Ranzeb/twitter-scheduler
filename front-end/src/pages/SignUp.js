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
import {useNavigate} from "react-router-dom";
import {Auth} from "aws-amplify";
import {CircularProgress} from "@mui/material";
import {useState} from "react";
import {isValidPassword} from "../utils/helpers";

function Copyright(props) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {'Copyright © '}
            <Link color="inherit" href="https://mui.com/">
                Your Website
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}


function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

const theme = createTheme();

export default function SignUp() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (data.get('firstName').length === 0) {
            alert("Firstname cannot be empty");
            return
        }
        if (data.get('lastName').length === 0) {
            alert("Lastname cannot be empty");
            return
        }
        if (data.get('email').length === 0) {
            alert("Email cannot be empty");
            return
        }
        const chosenPassword = data.get('password')
        if (chosenPassword.length < 0) {
            alert("Password not long enough");
            return
        }
        if (chosenPassword.length > 20) {
            alert("Password too long, at most 20 characters");
            return
        }
        if (!isValidPassword(chosenPassword)) {
            alert("Password needs at least 8 characters, one lower case, one upper case and one number.")
            return
        }
        if (!isValidEmail(data.get('email'))) {
            alert("Invalid email")
            return;
        }
        handleSignUp(data.get('firstName'), data.get('lastName'), data.get('email'), data.get('password'), data.get('allowExtraEmails'));
    };
    const handleSignUp = async (firstName, lastName, email, password, allowExtraEmails) => {
        //TODO error handling
        //TODO store allowExtraEmails, so we are allowed to use user emails for promotions
        setIsLoading(true);
        try {
            await Auth.signUp({
                username: email,
                password: password,
                attributes: {
                    email: email,
                    name: `${firstName} ${lastName}`,
                    given_name: firstName,
                    family_name: lastName
                },
            });
            if (typeof window !== 'undefined') {
                localStorage.setItem('pending_verification_email', email);
            }
            navigate('/confirm');
        } catch (error) {
            //TODO handle more error
            console.error(error);
            console.log(error.code)
            if (error.code === 'UsernameExistsException') {
                alert("User with this email does already exist!")
            }
            setIsLoading(false);
        }
    };

    function renderMainContent() {
        if (isLoading) {
            return (
                <Box sx={{mt: 1}}>
                    <CircularProgress/>
                </Box>
            )
        }
        return (
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{m: 1, bgcolor: 'secondary.main'}}>
                    <LockOutlinedIcon/>
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>
                <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 3}}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                autoComplete="given-name"
                                name="firstName"
                                required
                                fullWidth
                                id="firstName"
                                label="First Name"
                                autoFocus
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="lastName"
                                label="Last Name"
                                name="lastName"
                                autoComplete="family-name"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Checkbox name="allowExtraEmails" value="allowExtraEmails" color="primary"/>}
                                label="I want to receive inspiration, marketing promotions and updates via email."
                            />
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2}}
                    >
                        Sign Up
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <Grid item>
                            <Link href="/signin" variant="body2">
                                Already have an account? Sign in
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                {renderMainContent()}
                <Copyright sx={{mt: 5}}/>
            </Container>
        </ThemeProvider>
    );
}
