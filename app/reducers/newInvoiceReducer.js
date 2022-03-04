// @flow

const initialState = {
    tempImages: []
};

function newInvoiceReducer(state = initialState, action) {
    switch (action.type) {
        case 'ADD_TEMP_IMAGES_INVOICE':
            return { ...state, tempImages: [...state.tempImages, ...action.payload] };
        case 'REMOVE_TEMP_IMAGE_INVOICE':
            return { ...state, tempImages: state.tempImages.filter(image => image !== action.payload) };
        case 'CLEAR_TEMP_IMAGES_INVOICE':
            return { ...state, tempImages: [] };
        default:
            return state;
    }
}

export default newInvoiceReducer;