import { put, call, takeEvery } from 'redux-saga/effects';
import { NavigationActions, StackActions } from 'react-navigation';
import AuthService from '../services/AuthService';

function* authenticateUser({ payload }) {
  yield put({ type: 'FLUSH_ERRORS' });
  try {
    const response = yield call(AuthService.authenticateUser, payload.authProvider);
    if (response && response.accessToken) {
      yield put({ type: 'AUTHENTICATE_USER_SUCCESS', payload: { authProvider: payload.authProvider, accessToken: response.accessToken, refreshToken: response.refreshToken, accessTokenExpirationDate: response.accessTokenExpirationDate } });
      yield put({ type: 'SET_ACCESS_TOKENS', payload: { authProvider: payload.authProvider, accessToken: response.accessToken, refreshToken: response.refreshToken, accessTokenExpirationDate: response.accessTokenExpirationDate } });
      yield put({ type: 'SET_TOKEN_TO_HEADER', payload: response.accessToken });
      yield put({ type: 'AUTHENTICATE_FILE_SERVER_PENDING', payload: response.accessToken });

      yield put(StackActions.reset({ // TODO: refactor this
        index: 0,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: payload.compToReset ? payload.compToReset : 'CompanySelect' }) // is this part nececcry ?
        ]
      }));
    } else {
      yield put({ type: 'AUTHENTICATE_USER_FAILED', payload: response });
      yield put({ type: 'PUSH_ERROR', payload: response });
    }
  }
  catch (error) {
    yield put({ type: 'AUTHENTICATE_USER_FAILED', payload: 'REQUEST_FAILED' });
    yield put({ type: 'PUSH_ERROR', payload: error });
  }
}

function* refreshAccessToken({ payload }) {
  try {
    const response = yield call(AuthService.refreshAccessToken, payload.authProvider, payload.refreshToken);
    if (response && response.accessToken) {
      yield put({ type: 'AUTHENTICATE_USER_SUCCESS', payload: { authProvider: payload.authProvider, accessToken: response.accessToken, refreshToken: response.refreshToken, accessTokenExpirationDate: response.accessTokenExpirationDate } });
      yield put({ type: 'SET_ACCESS_TOKENS', payload: { authProvider: payload.authProvider, accessToken: response.accessToken, refreshToken: response.refreshToken, accessTokenExpirationDate: response.accessTokenExpirationDate } });
      yield put({ type: 'SET_TOKEN_TO_HEADER', payload: response.accessToken });
      yield put({ type: 'AUTHENTICATE_FILE_SERVER_PENDING', payload: response.accessToken });
      if (payload.navigateTo) {
        yield put(StackActions.reset({
          index: 0,
          key: undefined,
          actions: [
            NavigationActions.navigate({ routeName: payload.navigateTo })
          ]
        }));
      }
    }
    else {
      yield put({ type: 'REFRESH_ACCESS_TOKEN_FAILED', payload: response });
      yield put(StackActions.reset({
        index: 0,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'Login' })
        ]
      }));
    }
  }
  catch (error) {
    yield put({ type: 'REFRESH_ACCESS_TOKEN_FAILED', payload: error });
    yield put(StackActions.reset({
      index: 0,
      key: undefined,
      actions: [
        NavigationActions.navigate({ routeName: 'Login' })
      ]
    }));
  }
}

function* authenticateFileServer({ payload }) { // TODO: handle this in a better way. show a message that it failed
  try {
    const response = yield call(AuthService.authenticateFileServer, { token: payload });
    if (response.ok) {
      yield put({ type: 'AUTHENTICATE_FILE_SERVER_SUCCESS', payload: response.data });
      yield put({ type: 'SET_FILESERVER_TOKENS', payload: response.data });
    } else {
      yield put({ type: 'AUTHENTICATE_FILE_SERVER_FAILED', payload: response.problem });
    }
  } catch (error) {
    yield put({ type: 'AUTHENTICATE_FILE_SERVER_FAILED', payload: error });
  }
}

// eslint-disable-next-line import/prefer-default-export
export function* authSaga() {
  yield [
    takeEvery('AUTHENTICATE_USER_PENDING', authenticateUser),
    takeEvery('AUTHENTICATE_FILE_SERVER_PENDING', authenticateFileServer),
    takeEvery('REFRESH_ACCESS_TOKEN_PENDING', refreshAccessToken),
  ];
}
