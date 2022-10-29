import { gql, useLazyQuery } from '@apollo/client';
import { getTwitterUser } from '../graphql/queries';

export const useGetTwitterUser = () => {
    const [call, { loading, error, data }] = useLazyQuery(gql(getTwitterUser), {
        fetchPolicy: 'no-cache',
    });

    return {
        getTwitterUser: call,
        getTwitterUserData: data?.getTwitterUser,
        getTwitterUserLoading: loading,
        getTwitterUserError: error,
    };
};
