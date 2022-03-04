import * as Keychain from 'react-native-keychain';

const saveAccessTokensInKeyChain = (tokenObject) => {
  Keychain
    .setInternetCredentials('accessToken', '', JSON.stringify(tokenObject))
    .then(() => {});
};

const saveFileServerTokensInKeyChain = (tokenObject) => {
  Keychain
    .setInternetCredentials('fileServerToken', '', JSON.stringify(tokenObject))
    .then(() => {});
};

const clearAccessTokensInKeyChain = () => {
  Keychain
    .resetInternetCredentials('accessToken')
    .then(() => {});
};

const clearFileServerTokensInKeyChain = () => {
  Keychain
    .resetInternetCredentials('fileServerToken')
    .then(() => {});
};

const getAccessTokensInKeyChain = () => {
  return Keychain
    .getInternetCredentials('accessToken')
    .then((credentials) => {
      return credentials.password ? JSON.parse(credentials.password) : null;
    });
};

const getFileServerTokensInKeyChain = () => {
  return Keychain
    .getInternetCredentials('fileServerToken')
    .then((credentials) => {
      return credentials.password ? JSON.parse(credentials.password) : null;
    });
};

export default {
  getAccessTokensInKeyChain,
  getFileServerTokensInKeyChain,
  clearAccessTokensInKeyChain,
  clearFileServerTokensInKeyChain,
  saveAccessTokensInKeyChain,
  saveFileServerTokensInKeyChain,
};