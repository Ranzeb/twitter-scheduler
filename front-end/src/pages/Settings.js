import * as React from 'react';
import '../App.css';
import '../components/TweetBox/Tweetbox.css'
import {API, Auth, graphqlOperation} from "aws-amplify";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getTwitterUser} from "../graphql/queries";
import {
    CircularProgress,
    FormHelperText,
    IconButton,
    Input,
    InputAdornment
} from "@mui/material";
import Box from '@mui/material/Box';
import {useGetUser} from "../hooks/useSyncUser";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import "./styles/settings.css";
import TextField from '@mui/joy/TextField';
import Link from '@mui/material/Link';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {useDispatch, useSelector} from "react-redux";
import {
    selectCognitoUserId,
    selectUserEmail,
    selectUserEmailIsVerified,
    setUserEmailIsVerified
} from "../redux/slicer/userDataSlice";
import * as PropTypes from "prop-types";
import {addToList, isValidPassword, removeFromList} from "../utils/helpers";
import AddBoxIcon from "@mui/icons-material/AddBox";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import {updateTwitterUserSchedule} from "../graphql/mutations";
import {DEFAULT_SCHEDULE} from "../utils/constants";

function EmailSettingsBox({isValidEmail, formValues, handleChange}) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyItems: 'center',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
            <Box>
                <FormControl
                    error={!isValidEmail(formValues.newMail)}
                    sx={{m: 1, width: '25ch'}}
                    variant="standard">
                    <TextField variant="outlined"
                               label="New E-Mail"
                               color="neutral"
                               size="sm"
                               type="email"
                               placeholder="Insert your new email..."
                               value={formValues.newMail}
                               onChange={handleChange('newMail')}
                               fullWidth
                    />
                    <FormHelperText>{formValues.newMailHelperText}</FormHelperText>
                </FormControl>
            </Box>
        </Box>
    );
}

function EmailVerificationBox({formValues, handleChange, setEmailIsVerified}) {
    return <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }}>
        <h2>Your Mail is not verified!</h2>
        <p>Please enter the verification code sent to your email in the field below</p>
        <FormControl sx={{m: 1, width: '25ch'}} variant="standard">
            <InputLabel htmlFor="standard-adornment-mail-verification-code">Email
                verification code</InputLabel>
            <Input
                id="standard-adornment-mail-verification-code"
                type='text'
                value={formValues.emailVerificationCode}
                onChange={handleChange('emailVerificationCode')}
            />
        </FormControl>
        <Button onClick={() => {
            Auth.verifyCurrentUserAttributeSubmit('email', formValues.emailVerificationCode)
                .then((result) => {
                    alert('Successfully verified mail')
                    setEmailIsVerified(true)
                }).catch((error) => {
                if (error.code === 'CodeMismatchException') {
                    alert('Wrong verification code')
                } else if (error.code === 'ExpiredCodeException') {
                    alert('Verification code expired')
                } else {
                    alert('Some error occurred during mail verification.')
                }
            })
        }}>Verify mail</Button>

        <Button onClick={() => {
            Auth.verifyCurrentUserAttribute('email')
                .then(() => {
                    alert('A verification code is sent to your email.');
                }).catch((e) => {
                console.log('failed with error', e);
            });
        }}>Request new verification code</Button>
    </Box>;
}

function PasswordSettingsBox({formValues, handleChange, setFormValues}) {

    const handleClickShowPassword = (passwordType) => {
        setFormValues({
            ...formValues,
            [passwordType]: !formValues[passwordType],
        });
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    return (

        <Box
            sx={{
                display: 'flex',
                justifyItems: 'center',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
            <FormControl sx={{m: 1, width: '25ch'}} variant="standard">
                <InputLabel htmlFor="standard-adornment-current-password">Current
                    Password</InputLabel>
                <Input
                    id="standard-adornment-current-password"
                    type={formValues.showCurrentPassword ? 'text' : 'password'}
                    value={formValues.currentPassword}
                    onChange={handleChange('currentPassword')}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => {
                                    handleClickShowPassword('showCurrentPassword')
                                }}
                                onMouseDown={handleMouseDownPassword}
                            >
                                {formValues.showCurrentPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                        </InputAdornment>
                    }
                />
            </FormControl>

            <FormControl sx={{m: 1, width: '25ch'}} variant="standard">
                <InputLabel htmlFor="standard-adornment-new-password">New Password</InputLabel>
                <Input
                    error={formValues.newPassword.length < 8}
                    id="standard-adornment-new-password"
                    type={formValues.showNewPassword ? 'text' : 'password'}
                    value={formValues.newPassword}
                    onChange={handleChange('newPassword')}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => {
                                    handleClickShowPassword('showNewPassword')
                                }}
                                onMouseDown={handleMouseDownPassword}
                            >
                                {formValues.showNewPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                        </InputAdornment>
                    }
                />
                <FormHelperText>{formValues.newPasswordHelperText}</FormHelperText>
            </FormControl>

            <FormControl sx={{m: 1, width: '25ch'}} variant="standard">
                <InputLabel htmlFor="standard-adornment-confirm-password">Confirm new
                    Password</InputLabel>
                <Input
                    error={formValues.confirmPassword !== formValues.newPassword}
                    id="standard-adornment-confirm-password"
                    type={formValues.showConfirmPassword ? 'text' : 'password'}
                    value={formValues.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => {
                                    handleClickShowPassword('showConfirmPassword')
                                }}
                                onMouseDown={handleMouseDownPassword}
                            >
                                {formValues.showConfirmPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                        </InputAdornment>
                    }
                />
                <FormHelperText>{formValues.confirmPasswordHelperText}</FormHelperText>
            </FormControl>
        </Box>
    );
}

function ChangeEmailModal(props) {
    return <Modal show={props.show} onHide={props.onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Change Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <EmailSettingsBox
                isValidEmail={props.validEmail}
                formValues={props.formValues}
                handleChange={props.handleChange}
            />
        </Modal.Body>
        <Modal.Footer>
            <Button id="close-modal" variant="secondary" onClick={props.onHide}>
                Close
            </Button>
            <Button id="confirm-modal" variant="primary" onClick={props.onClick}>
                Save Changes
            </Button>
        </Modal.Footer>
    </Modal>;
}

ChangeEmailModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
    validEmail: PropTypes.func,
    formValues: PropTypes.shape({
        newMailHelperText: PropTypes.string,
        showNewPassword: PropTypes.bool,
        newPasswordHelperText: PropTypes.string,
        showCurrentPassword: PropTypes.bool,
        showConfirmPassword: PropTypes.bool,
        newPassword: PropTypes.string,
        confirmPassword: PropTypes.string,
        confirmPasswordHelperText: PropTypes.string,
        currentPassword: PropTypes.string,
        newMail: PropTypes.string,
        emailVerificationCode: PropTypes.string
    }),
    handleChange: PropTypes.func,
    onClick: PropTypes.func
};

function ChangePasswordModal(props) {
    return <Modal show={props.show} onHide={props.onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <PasswordSettingsBox
                formValues={props.formValues}
                setFormValues={props.formValues1}
                handleChange={props.handleChange}
            />
        </Modal.Body>
        <Modal.Footer>
            <Button id="close-modal" variant="secondary" onClick={props.onHide}>
                Close
            </Button>
            <Button id="confirm-modal" variant="primary" onClick={props.onClick}>
                Save Changes
            </Button>
        </Modal.Footer>
    </Modal>;
}

ChangePasswordModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
    formValues: PropTypes.shape({
        newMailHelperText: PropTypes.string,
        showNewPassword: PropTypes.bool,
        newPasswordHelperText: PropTypes.string,
        showCurrentPassword: PropTypes.bool,
        showConfirmPassword: PropTypes.bool,
        newPassword: PropTypes.string,
        confirmPassword: PropTypes.string,
        confirmPasswordHelperText: PropTypes.string,
        currentPassword: PropTypes.string,
        newMail: PropTypes.string,
        emailVerificationCode: PropTypes.string
    }),
    formValues1: PropTypes.func,
    handleChange: PropTypes.func,
    onClick: PropTypes.func
};

function Settings() {
    let navigate = useNavigate();
    const [isLoading, setLoading] = useState(true)
    const {getUser, getUserData, getUserLoading, getUserError} = useGetUser();
    const [twitterUser, setTwitterUser] = useState();
    const cognitoUserId = useSelector(selectCognitoUserId)
    const email = useSelector(selectUserEmail)
    const emailIsVerified = useSelector(selectUserEmailIsVerified)
    const dispatch = useDispatch()

    const [formValues, setFormValues] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        newPasswordHelperText: '',
        confirmPasswordHelperText: '',
        newMail: '',
        newMailHelperText: '',
        emailVerificationCode: '',
        dayTimes: {}
    });

    function fetchTwitterUser() {
        if (cognitoUserId && !isFetchingTwitterUser) {
            setIsFetchingTwitterUser(true);
            API.graphql(graphqlOperation(getTwitterUser, {cognitoUserId: cognitoUserId}))
                .then((res) => {
                    setTwitterUser(res.data.getTwitterUser);
                    if (res.data.getTwitterUser === null) {
                        navigate('/link_twitter')
                    }
                    if ('error' in res) {
                        if (res.error.message.startsWith('The provided key element does not match the schema')) {
                            navigate('/link_twitter')
                        }
                    } else {
                        setLoading(false);
                    }
                })
                .catch((error) => {
                    console.log("error from graphql query")
                    console.log(error)
                })
                .finally(() => {
                    setIsFetchingTwitterUser(false);
                })
        }
    }

    useEffect(() => {
        getUser().then((response) => {
            const currentCognitoUser = response.data.getCognitoUser;
            if (currentCognitoUser.subscriptionId !== null) { //TODO in prod don't allow null

                let startOfCurrentSubscription = new Date(currentCognitoUser.startOfCurrentSubscription);
                let endOfCurrentSubscription;
                if (currentCognitoUser.endOfCurrentSubscription) {
                    endOfCurrentSubscription = new Date(currentCognitoUser.endOfCurrentSubscription);
                } else {
                    endOfCurrentSubscription = new Date(currentCognitoUser.startOfCurrentSubscription)
                        .setDate((startOfCurrentSubscription.getDate() + currentCognitoUser.subscriptionDurationInDays))
                    endOfCurrentSubscription = new Date(endOfCurrentSubscription);
                }
                if (endOfCurrentSubscription < new Date() || currentCognitoUser.subscriptionStatus === 'inactive') {
                    //TODO handle subscription expired
                    //alert("Your subscription expired, go and extend it")
                }
            }
        })
        if (cognitoUserId) {
            fetchTwitterUser()
        }
    }, []);

    const updateSchedule = (newSchedule) => {
        if (twitterUser === undefined || twitterUser.cognitoUserId === undefined) {
            alert("Some error occurred, please try again.")
            return
        }
        setLoading(true)
        let updatedTwitterUser = {
            cognitoUserId: twitterUser.cognitoUserId,
            schedule: newSchedule
        };

        API.graphql(graphqlOperation(updateTwitterUserSchedule, updatedTwitterUser))
            .then((res) => {
                //TODO maybe use apollo to automatically refetch?
                fetchTwitterUser()
                //TODO show modal that update was successful
            })
            .catch((error) => {
                console.log("error from graphql updateTwitterUserSchedule mutation")
                console.log(error)
            })
    }

    function isValidEmail(email) {
        return /\S+@\S+\.\S+/.test(email);
    }

    const handleChange = (prop) => (event) => {
        let newPasswordHelperText = formValues.newPasswordHelperText;
        let confirmPasswordHelperText = formValues.confirmPasswordHelperText;
        let newMailHelperText = formValues.newMailHelperText;
        if (prop === 'newMail') {
            if (isValidEmail(event.target.value)) {
                newMailHelperText = ''
            } else {
                newMailHelperText = 'Invalid mail'
            }
        }
        if (prop === 'newPassword') {
            const chosenPassword = event.target.value;
            if (chosenPassword !== formValues.confirmPassword) {
                confirmPasswordHelperText = 'Passwords do not match'
            } else {
                confirmPasswordHelperText = ''
            }
            if (chosenPassword.length < 0) {
                confirmPasswordHelperText = "Password not long enough";
            } else if (chosenPassword.length > 20) {
                confirmPasswordHelperText = "Password too long, at most 20 characters"
            } else if (!isValidPassword(chosenPassword)) {
                confirmPasswordHelperText = "Password needs at least 8 characters, one lower case, one upper case and one number."
            } else {
                newPasswordHelperText = ''
            }
        }
        if (prop === 'confirmPassword') {
            if (event.target.value !== formValues.newPassword) {
                confirmPasswordHelperText = 'Passwords do not match'
            } else {
                confirmPasswordHelperText = ''
            }
        }
        setFormValues({
            ...formValues,
            [prop]: event.target.value,
            newPasswordHelperText: newPasswordHelperText,
            confirmPasswordHelperText: confirmPasswordHelperText,
            newMailHelperText: newMailHelperText
        });
    };
    const [isFetchingTwitterUser, setIsFetchingTwitterUser] = useState(false);
    const [show, setShow] = useState(false);
    const [showPswd, setShowPswd] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const handleClosePswd = () => setShowPswd(false);
    const handleShowPswd = () => setShowPswd(true);

    function ChangeEmail() {
        if (!isValidEmail(formValues.newMail)) {
            return;
        }
        Auth.currentAuthenticatedUser().then((user) => {
            Auth.updateUserAttributes(user, {
                'email': formValues.newMail,
            }).then((result) => {
                alert("Successfully updated mail, please verify it")
            }).catch((error) => {
                if (error.code === 'AliasExistsException') {
                    alert('User with this e-mail already exists!')
                } else {
                    alert("Error while updating email. Check your network connection.")
                }
            })
        }).catch((error) => {
            //TODO handle error
            console.log(error)
            alert("Error while updating email")
        })
    }


    function ChangePswd() {
        if (formValues.newPassword !== formValues.confirmPassword) {
            alert('Passwords do not match')
            return
        } else if (formValues.newPassword.length < 0) {
            alert("Password not long enough")
            return
        } else if (formValues.newPassword.length > 20) {
            alert("Password too long, at most 20 characters")
            return
        } else if (!isValidPassword(formValues.newPassword)) {
            alert("Password needs at least 8 characters, one lower case, one upper case and one number.")
            return
        }
        Auth.currentAuthenticatedUser()
            .then(user => {
                Auth.changePassword(user, formValues.currentPassword, formValues.newPassword)
                    .then((data) => {
                        alert("Password successfully updated")
                    })
                    .catch((error) => {
                        console.log(error)
                        //TODO handle error correctly, report more specific reason to user
                        alert("Error")
                    })
            })
            .catch(err => {
                console.log(err)
                //TODO handle error correctly, report more specific reason to user
                alert("Error")
            });
    }


    function dayScheduleBox(day) {
        const dayToIndex = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        }
        const dayIndex = dayToIndex[day];
        if (!('schedule' in twitterUser) || twitterUser.schedule === null) {
            twitterUser.schedule = DEFAULT_SCHEDULE;
        }
        return (
            <Box sx={{width: '300px'}}>
                <p>{day}</p>
                {twitterUser && twitterUser.schedule.length > 0 && twitterUser.schedule[dayIndex].map((dayTime, index) => {
                    return (
                        <Box
                            key={dayTime}>
                            <TextField
                                type='time'
                                variant="outlined"
                                color="neutral"
                                size="sm"
                                value={dayTime}
                                onChange={(event) => {
                                    let newDayTimes = twitterUser.schedule;
                                    newDayTimes[dayIndex][index] = event.target.value;
                                    updateSchedule(newDayTimes)
                                }}
                                fullWidth
                            />
                            <AddBoxIcon sx={{fontSize: 25}} color="primary"
                                        onClick={(event) => {
                                            let newDayTimes = twitterUser.schedule;
                                            //TODO what happens if 11:00 already in?
                                            newDayTimes[dayIndex] = addToList(newDayTimes[dayIndex], index, "11:00")
                                            updateSchedule(newDayTimes)
                                        }}/>
                            {twitterUser.schedule[dayIndex].length > 1 && (
                                <IndeterminateCheckBoxIcon sx={{fontSize: 25}} color="error"
                                                           onClick={(event) => {
                                                               let newDayTimes = twitterUser.schedule;
                                                               newDayTimes[dayIndex] = removeFromList(newDayTimes[dayIndex], index)
                                                               updateSchedule(newDayTimes)
                                                           }}/>)}
                        </Box>)
                })}
            </Box>
        )
    }

    function renderPage() {
        if (!isLoading && !getUserLoading) {
            return (
                <Box component="main"
                     sx={{
                         display: 'flex',
                         justifyItems: 'center',
                         alignItems: 'center',
                         flexDirection: 'column',
                         flexGrow: 1,
                         p: 3
                     }}>
                    <ChangeEmailModal show={show} onHide={handleClose} validEmail={isValidEmail} formValues={formValues}
                                      handleChange={handleChange} onClick={ChangeEmail}/>
                    <ChangePasswordModal show={showPswd} onHide={handleClosePswd} formValues={formValues}
                                         formValues1={setFormValues} handleChange={handleChange} onClick={ChangePswd}/>

                    <Box sx={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        flexGrow: 1,
                        rowGap: 2
                    }}>
                        <div className="settings-title">
                            <h4>Settings</h4>
                        </div>

                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Username</p>
                            <TextField sx={{
                                ml: 2,
                                width: 465,
                                mb: 1
                            }}
                                       variant="outlined"
                                       color="neutral"
                                       size="sm"
                                       placeholder={getUserData.username}
                                       fullWidth
                                       disabled/>
                            <div style={{display: 'none'}}>
                                <p className="common-settings-box footer">Do you want to change your username?
                                    <Link id="common-settings-box-actions" href="mailto:ng.saas2022@gmail.com"
                                          underline="none">
                                        {'Click here'}
                                    </Link>
                                </p>
                            </div>
                        </Box>

                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Twitter Account</p>
                            <TextField sx={{
                                ml: 2,
                                width: 465
                            }}
                                       variant="outlined"
                                       color="neutral"
                                       size="sm"
                                       placeholder={twitterUser.screenName}
                                       fullWidth
                                       disabled/>
                            <div>
                                {twitterUser === undefined &&
                                    <Button id="twitter-settings-btn">Connect Twitter</Button>}
                                {twitterUser && <Button id="twitter-settings-btn" onClick={() => {
                                    alert("not implemented")
                                }}>Disconnect Twitter</Button>}
                            </div>
                        </Box>
                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Email</p>
                            <TextField
                                sx={{
                                    ml: 2,
                                    width: 465
                                }}
                                type="email"
                                variant="outlined"
                                color="neutral"
                                size="sm"
                                placeholder={email}
                                fullWidth
                                disabled/>
                            <div>
                                <p className="common-settings-box footer">Do you want to change your email?
                                    <Link id="common-settings-box-actions" onClick={handleShow} href="#"
                                          underline="none">
                                        {'Click here'}
                                    </Link>
                                </p>
                            </div>
                        </Box>
                        {!emailIsVerified && (<EmailVerificationBox
                            formValues={formValues}
                            handleChange={handleChange}
                            setEmailIsVerified={(value) => dispatch(setUserEmailIsVerified(value))}
                        />)}
                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Password</p>
                            <TextField sx={{
                                ml: 2,
                                width: 465
                            }}
                                       type={formValues.showCurrentPassword ? 'text' : 'password'}
                                       variant="outlined"
                                       color="neutral"
                                       size="sm"
                                       placeholder={formValues.currentPassword}
                                       fullWidth
                                       disabled/>
                            <div>
                                <p className="common-settings-box footer">Do you want to change your password?
                                    <Link id="common-settings-box-actions" onClick={handleShowPswd} href="#"
                                          underline="none">
                                        {'Click here'}
                                    </Link>
                                </p>
                            </div>
                        </Box>

                        <Box id="common-settings-box">
                            <p className="common-settings-box header">Schedule</p>
                            <Box sx={{
                                ml: 3
                            }}>
                                {dayScheduleBox('Monday')}
                                {dayScheduleBox('Tuesday')}
                                {dayScheduleBox('Wednesday')}
                                {dayScheduleBox('Thursday')}
                                {dayScheduleBox('Friday')}
                                {dayScheduleBox('Saturday')}
                                {dayScheduleBox('Sunday')}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )
        } else {
            if (twitterUser === undefined) {
                fetchTwitterUser();
            }
            return (
                <Box component="main"
                     sx={{
                         display: 'flex',
                         justifyItems: 'center',
                         alignItems: 'center',
                         flexDirection: 'column',
                         flexGrow: 1,
                         p: 3
                     }}>
                    <CircularProgress/>
                </Box>
            )
        }
    }

    return renderPage();
}


export default Settings;