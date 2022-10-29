import {createSlice} from '@reduxjs/toolkit'

export const userDataSlice = createSlice({
    name: 'userData',
    initialState: {
        identityId: undefined,
        jwtToken: undefined,
        cognitoUserId: '',
        email: undefined,
        emailIsVerified: undefined,
        twitterUser: undefined
    },
    reducers: {
        setIdentityId: (state, action) => {
            state.identityId = action.payload
        },
        setJwtToken: (state, action) => {
            state.jwtToken = action.payload
        },
        setCognitoUserId: (state, action) => {
            state.cognitoUserId = action.payload
        },
        setUserEmail: (state, action) => {
            state.email = action.payload
        },
        setUserEmailIsVerified: (state, action) => {
            state.emailIsVerfied = action.payload
        },
        setTwitterUser: (state, action) => {
            state.twitterUser = action.payload
        },
    }
})

export const {
    setIdentityId,
    setJwtToken,
    setCognitoUserId,
    setUserEmail,
    setUserEmailIsVerified,
    setTwitterUser,
} = userDataSlice.actions
// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.userData.value)`
export const selectUserIdentityId = state => state.userData.identityId
export const selectUserJwtToken = state => state.userData.jwtToken;
export const selectCognitoUserId = state => state.userData.cognitoUserId;
export const selectUserEmail = state => state.userData.email;
export const selectUserEmailIsVerified = state => state.userData.emailIsVerfied;
export const selectTwitterUser = state => state.userData.twitterUser;

export default userDataSlice.reducer