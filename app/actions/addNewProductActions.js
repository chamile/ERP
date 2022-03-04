// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const resetToProductList = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'ProductList' })
    ]
  });
};

export const addTempImages = (images) => {
  return { type: 'ADD_TEMP_IMAGES_PRODUCT', payload: images };
};

export const removeTempImage = (image) => {
  return { type: 'REMOVE_TEMP_IMAGE_PRODUCT', payload: image };
};

export const clearTempImages = (images) => {
  return { type: 'CLEAR_TEMP_IMAGES_PRODUCT', payload: images };
};
