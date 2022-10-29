import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// see: https://docs.amplify.aws/start/getting-started/setup/q/integration/react/#install-amplify-libraries
import {Amplify, Auth} from 'aws-amplify';
import amplifyConfig from './deployment/amplify-config';
import store from "./redux/store";
import {Provider} from 'react-redux';
import {createAppSyncClient} from "./appsync/AppSyncClient";
import {ApolloProvider} from '@apollo/client';

import {BrowserRouter} from "react-router-dom";

Amplify.configure(amplifyConfig);


const validateUserSession = async () => {
    try {
        await Auth.currentSession();
    } catch (error) {
        console.error(error + " APP_validateUserSession")
        //navigate('/signin')
    }
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <BrowserRouter>
            <ApolloProvider client={createAppSyncClient(validateUserSession)}>
                <App/>
            </ApolloProvider>
        </BrowserRouter>
    </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();