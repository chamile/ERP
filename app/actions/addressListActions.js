// @flow
export const setAddressList = (list) => {
  return { type: 'SET_ADDRESS_LIST', payload: [ ...list ] };
};

export const addNewAddressToList = (address) => {
  return { type: 'ADD_NEW_ADDRESS_TO_LIST', payload: address };
};

export const clearAddressList = () => {
  return { type: 'CLEAR_ADDRESS_LIST' };
};

export const updateLastEditedAddressListTimeStamp = () => {
  return { type: 'UPDATE_ADDRESSES_LAST_EDITED_TIMESTAMP' };
};

export const editExistingAddressInList = (address, index) => {
  return { type: 'EDIT_ADDRESS_USING_ARRAY_INDEX_OF_ADDRESS_LIST', payload: { address, index } };
};

export const setTempAddressList = (address) => {
  return { type: 'SET_TEMP_ADDRESS_LIST', payload: [ ...address ] };
};

export const clearTempAddressList = () => {
  return { type: 'CLEAR_TEMP_ADDRESS_LIST' };
};
