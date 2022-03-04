// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function quoteListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_QUOTES_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default quoteListReducer;