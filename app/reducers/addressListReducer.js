// @flow

const initialState = {
    lastEditedTime: new Date().getTime(),
    lastEditedIndex: -1,
    addresses: [],
    tempAddresess: [],
};

function addressListReducer(state = initialState, action) {
    switch (action.type) {
        case 'UPDATE_ADDRESSES_LAST_EDITED_TIMESTAMP':
            return { ...state, lastEditedTime: new Date().getTime() };
        case 'SET_ADDRESS_LIST':
            return { ...state, addresses: [...action.payload], lastEditedTime: new Date().getTime() };
        case 'ADD_NEW_ADDRESS_TO_LIST':
            return { ...state, addresses: [...state.addresses, action.payload], lastEditedTime: new Date().getTime() };
        case 'CLEAR_ADDRESS_LIST':
            return { ...state, addresses: [], lastEditedTime: new Date().getTime() };
        case 'EDIT_ADDRESS_USING_ARRAY_INDEX_OF_ADDRESS_LIST':
            {
                const addressList = state.addresses;
                addressList[action.payload.index] = action.payload.address;
                return { ...state, addresses: [...addressList], lastEditedTime: new Date().getTime(), lastEditedIndex: action.payload.index };
            };
        case 'SET_TEMP_ADDRESS_LIST':
            return { ...state, tempAddresess: [...action.payload] };
        case 'CLEAR_TEMP_ADDRESS_LIST':
            return { ...state, tempAddresess: [] };
        default:
            return state;
    }
}

export default addressListReducer;