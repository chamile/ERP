// @flow

const initialState = {
    tempImages: [],
};

function newProductReducer(state = initialState, action) {
    switch (action.type) {
        case 'ADD_TEMP_IMAGES_PRODUCT':
            return { ...state, tempImages: [...state.tempImages, ...action.payload] };
        case 'REMOVE_TEMP_IMAGE_PRODUCT':
            return { ...state, tempImages: state.tempImages.filter(image => image !== action.payload) };
        case 'CLEAR_TEMP_IMAGES_PRODUCT':
            return { ...state, tempImages: [] };
        default:
            return state;
    }
}

export default newProductReducer;