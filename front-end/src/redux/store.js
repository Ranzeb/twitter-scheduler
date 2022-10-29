import { configureStore } from '@reduxjs/toolkit'
import userDataSlice from "./slicer/userDataSlice";

export default configureStore({
    reducer: {
        userData: userDataSlice
    }
})