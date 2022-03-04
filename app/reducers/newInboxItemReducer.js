// @flow

const initialState = {
    tempImages: []
};

function newInboxItemReducer(state = initialState, action) {
    switch (action.type) {
        case 'ADD_TEMP_IMAGES_INBOX_ITEM':
            return { ...state, tempImages: [...state.tempImages, ...action.payload] };
        case 'REMOVE_TEMP_IMAGE_INBOX_ITEM':
            return { ...state, tempImages: state.tempImages.filter(image => image !== action.payload) };
        case 'CLEAR_TEMP_IMAGES_INBOX_ITEM':
            return { ...state, tempImages: [] };
        default:
            return state;
    }
}

export default newInboxItemReducer;