/* eslint-disable require-yield */
// @flow
import { takeEvery, call } from 'redux-saga/effects';
import ApiBuilder from '../helpers/ApiBuilder';
import KeychainService from '../services/KeychainService';

function* setToken({ payload }) {
  ApiBuilder.API.defaults.headers.common.Authorization =  `Bearer ${payload}`;
  ApiBuilder.INTEGRATION_SERVER.defaults.headers.common.Authorization = `Bearer ${payload}`;
  ApiBuilder.PUSH_ADAPTOR.defaults.headers.common.Authorization = `Bearer ${payload}`;
}

function* setFileServerToken({ payload }) {
  ApiBuilder.FILE_SERVER.defaults.headers.common.Authorization =  `Bearer ${payload}`;
}

function* setEnv({ payload }) {
  ApiBuilder.useEnv(payload);
}

function* saveAccessTokensInKeyChain({ payload }) {
  try {
    yield call(KeychainService.saveAccessTokensInKeyChain, 
      {
        authProvider: payload.authProvider,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        accessTokenExpirationDate: payload.accessTokenExpirationDate
      });
  }
  catch (err) {}
}

function* saveFileServerTokensInKeyChain({ payload }) {
  try {
    yield call(KeychainService.saveFileServerTokensInKeyChain, payload);
  }
  catch (err) {}
}

// eslint-disable-next-line import/prefer-default-export
export function* tokenSaga() {
  yield [
    takeEvery('SET_TOKEN_TO_HEADER', setToken),
    takeEvery('SET_BASE_ENV', setEnv),
    takeEvery('SET_FILE_SERVER_TOKEN_TO_HEADER', setFileServerToken),
    takeEvery('SET_ACCESS_TOKENS', saveAccessTokensInKeyChain),
    takeEvery('SET_FILESERVER_TOKENS', saveFileServerTokensInKeyChain)
  ];
}
