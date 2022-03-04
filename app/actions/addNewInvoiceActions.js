// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const resetToInvoiceList = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'InvoiceList' })
    ]
  });
};

export const resetToInvoiceDetails = (invoiceID, CompanyKey, refreshInvoiceList = () => {}) => {
  return StackActions.reset({
    index: 1,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'InvoiceList' }),
      NavigationActions.navigate({ routeName: 'InvoiceDetails',
        params: {
          invoiceID,
          EntityType: 'supplierinvoice',
          CompanyKey,
          refreshInvoiceList
        } })
    ]
  });
};

export const resetToNewSupplierInvoice = () => {
  return StackActions.reset({
    index: 1,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'InvoiceList' }),
      NavigationActions.navigate({ routeName: 'AddNewInvoice', params: { isEdit: false } })
    ]
  })
};

export const addTempImages = (images) => {
  return { type: 'ADD_TEMP_IMAGES_INVOICE', payload: images };
};

export const removeTempImage = (image) => {
  return { type: 'REMOVE_TEMP_IMAGE_INVOICE', payload: image };
};

export const clearTempImages = (images) => {
  return { type: 'CLEAR_TEMP_IMAGES_INVOICE', payload: images };
};
