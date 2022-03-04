// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function supplierListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_SUPPLIER_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default supplierListReducer;