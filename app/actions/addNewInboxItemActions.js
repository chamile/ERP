// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const resetToInboxList = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'InboxList' })
    ]
  });
};

export const resetToAddNewInboxItem = () => {
  return StackActions.reset({
    index: 1,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'InboxList' }),
      NavigationActions.navigate({ routeName: 'AddNewInboxItem', params: { isEdit: false } })
    ]
  })
};

export const addTempImages = (images) => {
  return { type: 'ADD_TEMP_IMAGES_INBOX_ITEM', payload: images };
};

export const removeTempImage = (image) => {
  return { type: 'REMOVE_TEMP_IMAGE_INBOX_ITEM', payload: image };
};

export const clearTempImages = () => {
  return { type: 'CLEAR_TEMP_IMAGES_INBOX_ITEM' };
};
