// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function projectListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_PROJECTS_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default projectListReducer;
