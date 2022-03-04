// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function customerListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_CUSTOMERS_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default customerListReducer;