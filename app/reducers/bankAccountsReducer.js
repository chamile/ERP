// @flow

const initialState = {
    lastEditedTime: new Date().getTime(),
    selectedBankAccounts: []
};

function bankAccountsReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_RECENTLY_USED_BANK_ACCOUNTS':
            return { ...state, selectedBankAccounts: action.payload, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default bankAccountsReducer;