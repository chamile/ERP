// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function productListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_PRODUCTS_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default productListReducer;