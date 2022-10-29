export const removeFromList = (listObj, index) => {
    const updatedList = [...listObj];
    updatedList.splice(index, 1);
    return updatedList;
}

export const addToList = (listObj, index, newItem) => {
    let updatedList = listObj.slice(0, index + 1);
    updatedList.push(newItem)
    updatedList.push(...listObj.slice(index + 1))
    return updatedList;
}


export function isValidPassword(chosenPassword) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(chosenPassword)
}

