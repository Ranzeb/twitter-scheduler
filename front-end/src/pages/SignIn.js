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
import {CircularProgress} from "@mui/material";
import {useState} from "react";

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

export default function SignIn() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        handleSignIn(data.get('email'), data.get('password'));
    };

    const handleSignIn = async (email, password) => {
        setIsLoading(true);
        try {
            const user = await Auth.signIn({username: email, password: password});
            console.log("handleSignIn")
            console.log(user)
            console.log(user.challengeName)
            navigate('/');
        } catch (error) {
            console.log("error handleSignIn")
            console.log(error)
            setIsLoading(false);
            if (error.code === 'NotAuthorizedException' && error.message === 'Incorrect username or password.') {
                alert("Incorrect username or password.")
            } else {
                alert("Some error occurred, please try again")
            }
        }
    };

    function renderMainContent() {
        const query = new URLSearchParams(window.location.search);
        if (query.get('successful_signup')) {
            //setSuccessfulSignUp(true);
            //TODO show modal/dialog saying successful signup, now sign in to get started
            alert("Successfully signed up")
        }
        if (isLoading) {
            return (
                <Box sx={{mt: 1}}>
                    <CircularProgress/>
                </Box>
            )
        }

        return (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{mt: 1}}>
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
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                />
                <FormControlLabel
                    control={<Checkbox value="remember" color="primary"/>}
                    label="Remember me"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{mt: 3, mb: 2}}
                >
                    Sign In
                </Button>
                <Grid container>
                    <Grid item xs>
                        <Link href="/reset_password" variant="body2">
                            Forgot password?
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="/signup" variant="body2">
                            {"Don't have an account? Sign Up"}
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (<ThemeProvider theme={theme}>
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
                    Sign in
                </Typography>
                {renderMainContent()}
            </Box>
            <Copyright sx={{mt: 8, mb: 4}}/>
        </Container>
    </ThemeProvider>);
}
