export function checkValidSubscription(cognitoUser) {
    let startOfCurrentSubscription = new Date(cognitoUser.startOfCurrentSubscription);
    let endOfCurrentSubscription;
    if (cognitoUser.endOfCurrentSubscription) {
        endOfCurrentSubscription = cognitoUser.endOfCurrentSubscription;
    } else {
        endOfCurrentSubscription = new Date(cognitoUser.startOfCurrentSubscription)
            .setDate((startOfCurrentSubscription.getDate() + cognitoUser.subscriptionDurationInDays))
        endOfCurrentSubscription = new Date(endOfCurrentSubscription);
    }
    const diffTime = endOfCurrentSubscription - new Date();
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffTime < (1000 * 60 * 60 * 24)) {
        diffDays = 0;
    }

    return new Promise((resolve, reject) => {
        if (cognitoUser.subscriptionId === null) {
            //only possible if no active subscription => needs to make one
            //TODO show user that he needs a subscription and also
            reject({
                error: 'no_subscription',
                message: 'No active subscription. Go to Billing to choose a subscription.'
            })
        } else if (cognitoUser.subscriptionId === 'free_scheduling') {
            resolve({
                endOfCurrentSubscription: endOfCurrentSubscription,
                subscriptionType: 'Tester'
            })
        } else if (cognitoUser.subscriptionId === 'new_user_trial_30d_v_0_0_0') {
            //user in new user trial, thus choose plan
            if (diffDays === 0 && diffTime < 0) {
                reject({error: 'no_subscription', message: 'Trial expired. Go to Billing to choose a subscription.'})
            }
            resolve({
                endOfCurrentSubscription: endOfCurrentSubscription,
                subscriptionType: 'Trial'
            })
        } else {
            //user already in some subscription
            const subscriptionStatus = cognitoUser.subscriptionStatus;
            const isActive = subscriptionStatus === 'active';
            const isCanceled = subscriptionStatus === 'canceled';
            const subscriptionType = 'Unlimited Scheduling'; //TODO receive that instead of hard coding it
            if (isCanceled) {
                resolve({
                    endOfCurrentSubscription: endOfCurrentSubscription,
                    subscriptionType: subscriptionType,
                    subscriptionStatus: subscriptionStatus
                })
            } else if (isActive) {
                resolve({
                    nextPayment: endOfCurrentSubscription, //TODO is that correct?
                    subscriptionType: subscriptionType,
                    subscriptionStatus: subscriptionStatus
                })
            } else {
                //TODO
                console.log("cognitoUser")
                console.log(cognitoUser)
                reject("unhandled case => probably needs to be handeled properly, add task with cognitoUser info to Notion!")
            }
        }
    })
}