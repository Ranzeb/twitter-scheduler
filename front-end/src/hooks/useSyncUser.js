import { gql, useLazyQuery } from '@apollo/client';
import { getCognitoUser } from '../graphql/queries';

export const useGetUser = () => {
    const [call, { loading, error, data }] = useLazyQuery(gql(getCognitoUser), {
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'cache-first'
    });

    return {
        getUser: call,
        getUserData: data?.getCognitoUser,
        getUserLoading: loading,
        getUserError: error,
    };
};
