// @flow

const initialState = {
    lastEditedTime: new Date().getTime()
};

function customerInvoiceListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_CUSTOMER_INVOICE_LIST_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        default:
            return state;
    }
}

export default customerInvoiceListReducer;