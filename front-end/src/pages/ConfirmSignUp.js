import '../App.css';
import '@aws-amplify/ui-react/styles.css';
import {
    useNavigate,
} from "react-router-dom";
import React, {useState} from "react";
import {Auth} from "aws-amplify";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {CircularProgress} from "@mui/material";

const theme = createTheme();

function ConfirmSignUp() {

    let navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(localStorage.getItem('pending_verification_email') || '');
    const [isLoading, setIsLoading] = useState(false);
    const handleConfirmUser = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        handleConfirmation(data.get('email'), data.get('confirmationCode'))
    }
    const handleConfirmation = async (email, confirmationCode) => {
        console.log(email + ' ' + confirmationCode)
        if (!confirmationCode) {
            return;
        }


        if (typeof window === 'undefined') {
            return;
        }
        if (!email) {
            return;
        }
        setIsLoading(true);
        try {
            await Auth.confirmSignUp(email, confirmationCode);
            localStorage.removeItem('pending_verification_email');
            navigate('/signin?successful_signup=true')
        } catch (error) {
            console.error("error");
            console.error(error);
            alert("some error occurred")
            setIsLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline/>
                {isLoading && (
                    <Box
                        sx={{
                            marginTop: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <CircularProgress/>
                    </Box>
                )}
                {!isLoading &&(
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
                            That's amazing, you made our day!
                        </Typography>
                        <Typography component="h1" variant="h5">
                            Thanks for signing up.
                        </Typography>
                        <Typography component="h2" variant="h6">
                            We sent you a verification code via mail, please use it to confirm your email.
                        </Typography>
                        <Box component="form" noValidate onSubmit={handleConfirmUser} sx={{mt: 3}}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="email"
                                        label="Email"
                                        type="email"
                                        id="email"
                                        value={userEmail}
                                        onChange={(value) => {
                                            setUserEmail(value)
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        name="confirmationCode"
                                        label="Code"
                                        type="confirmationCode"
                                        id="confirmationCode"
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{mt: 3, mb: 2}}
                            >
                                Confirm mail
                            </Button>
                        </Box>

                        <Button onClick={async () => {
                            console.log("request")
                            console.log(userEmail)
                            await Auth.resendSignUp(userEmail);
                            alert("Requested new verification code, check your email")
                        }}>
                            Request new code
                        </Button>
                    </Box>
                )}
            </Container>
        </ThemeProvider>
    );
}

//TODO why are two clicks necessary and then a signin?
export default ConfirmSignUp;
