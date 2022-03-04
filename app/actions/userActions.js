import AuthService from '../services/AuthService';
import { store } from '../App';
import { setToken, setAccessTokenToRedux, setFileServerTokenToRedux } from './initActions';
import ApiBuilder from '../helpers/ApiBuilder';

export const authenticateUser = (authProvider, compToReset) => {
  const configs = {
    authProvider,
    compToReset
  };

  return {
    type: 'AUTHENTICATE_USER_PENDING',
    payload: configs
  };
};

export const refreshAccessToken = (authProvider, refreshToken, navigateTo = null) => {
  const configs = {
    authProvider,
    refreshToken,
    navigateTo
  };

  return {
    type: 'REFRESH_ACCESS_TOKEN_PENDING',
    payload: configs
  };
};

export const changeEnv = (env) => {
  return { type: 'CHANGE_BASE_ENV', payload: env };
};

export const setCurrentUserDetails = (user) => {
  return { type: 'SET_CURRENT_USER_DETAILS', payload: user };
};

export const updateAuthToken = () => {
  const _store =  store.getState();
  return AuthService.refreshAccessToken(_store.token.authProvider, _store.token.refreshToken)
    .then((response) => {
      store.dispatch(setToken(response.accessToken));
      store.dispatch(setAccessTokenToRedux({ authProvider: _store.token.authProvider, accessToken: response.accessToken, refreshToken: response.refreshToken, accessTokenExpirationDate: response.accessTokenExpirationDate }));
      updateFileServerToken(response.accessToken);
      return response.accessToken;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
};

export const updateFileServerToken = (authToken = ApiBuilder.API.defaults.headers.common.Authorization.replace('Bearer ', '')) => {
  const apiToken = authToken;
  return AuthService.authenticateFileServer({ token: apiToken })
    .then((res) => {
      if (res.ok) {
        store.dispatch({ type: 'AUTHENTICATE_FILE_SERVER_SUCCESS', payload: res.data });
        store.dispatch(setFileServerTokenToRedux(res.data));
        return res.data;
      } else {
        return null;
      }
    });
};
