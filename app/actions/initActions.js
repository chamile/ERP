// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const resetToSignIn = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'Login' })
    ]
  });
};

export const resetToCompanySelect = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'CompanySelect' })
    ]
  });
};

export const flushErrors = () => {
  return { type: 'FLUSH_ERRORS' };
};

export const setToken = (token) => {
  return { type: 'SET_TOKEN_TO_HEADER', payload: token };
};

export const setFileServerToken = (token) => {
  return { type: 'SET_FILE_SERVER_TOKEN_TO_HEADER', payload: token };
};

export const setEnv = (env) => {
  return { type: 'SET_BASE_ENV', payload: env };
};

export const authenticateFileServer = (token) => {
  return { type: 'AUTHENTICATE_FILE_SERVER_PENDING', payload: token };
};

export const setAccessTokenToRedux = (obj) => {
  return { type: 'SET_ACCESS_TOKENS', payload: obj };
};

export const setFileServerTokenToRedux = (obj) => {
  return { type: 'SET_FILESERVER_TOKENS', payload: obj };
};
