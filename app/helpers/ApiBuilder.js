import { create } from 'axios'
// import * as jwtDecode from 'jwt-decode';

import { APIConstantsDev, APIConstantsTest, APIConstantsPilot } from '../constants/APIConstants';
import { responseProcessor } from './APIUtil';
import { updateAuthToken, updateFileServerToken } from '../actions/userActions';

const API_RETRY_ATTEMPS = 2;

const API = create({
  baseURL: APIConstantsPilot.API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const FILE_SERVER = create({
  baseURL: APIConstantsPilot.FILE_SERVICE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const PUSH_ADAPTOR = create({
  baseURL: APIConstantsPilot.PUSH_ADAPTER_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const INTEGRATION_SERVER = create({
  baseURL: APIConstantsPilot.INTEGRATION_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

const useEnv = (env) => {
  if (env === 'pilot') {
    API.defaults.baseURL = APIConstantsPilot.API_URL;
    FILE_SERVER.defaults.baseURL = APIConstantsPilot.FILE_SERVICE_URL;
    PUSH_ADAPTOR.defaults.baseURL = APIConstantsPilot.PUSH_ADAPTER_API_URL;
    INTEGRATION_SERVER.defaults.baseURL = APIConstantsPilot.INTEGRATION_API_URL;
  } else if (env === 'test') {
    API.defaults.baseURL = APIConstantsTest.API_URL;
    FILE_SERVER.defaults.baseURL = APIConstantsTest.FILE_SERVICE_URL;
    PUSH_ADAPTOR.defaults.baseURL = APIConstantsTest.PUSH_ADAPTER_API_URL;
    INTEGRATION_SERVER.defaults.baseURL = APIConstantsTest.INTEGRATION_API_URL;
  } else if (env === 'dev') {
    API.defaults.baseURL = APIConstantsDev.API_URL;
    FILE_SERVER.defaults.baseURL = APIConstantsDev.FILE_SERVICE_URL;
    PUSH_ADAPTOR.defaults.baseURL = APIConstantsDev.PUSH_ADAPTER_API_URL;
    INTEGRATION_SERVER.defaults.baseURL = APIConstantsDev.INTEGRATION_API_URL;
  }
};

API.interceptors.response.use((response) => {
  response = responseProcessor(response);
  return response;
}, async (error) => {
  if (error.code === 'ECONNABORTED') {
    error.response = responseProcessor({ status: 408 });
  } else {
    error.response = responseProcessor(error.response);
  }
  if (error.config && error.response && error.response.status === 401 && !error.config.headers.IsLogin) {
    error.config.headers.RetryCount = error.config.headers.RetryCount ? error.config.headers.RetryCount : 0;
    if (error.config.headers.RetryCount < API_RETRY_ATTEMPS) {
      try {
        const resToken = await updateAuthToken();
        if (resToken) {
          error.config.headers.Authorization = `Bearer ${resToken}`;
          error.config.headers.RetryCount = error.config.headers.RetryCount + 1;
          return API.request(error.config);
        }
      } catch (err) {
        error.response.problem = 'TOKEN_EXPIRED';
        return Promise.reject(error.response);
      }
    }
    error.response.problem = 'TOKEN_EXPIRED';
    return Promise.reject(error.response);
  }
  return Promise.reject(error.response);
});

FILE_SERVER.interceptors.response.use((response) => {
  response = responseProcessor(response);
  return response;
}, async (error) => {
  if (error.code === 'ECONNABORTED') {
    error.response = responseProcessor({ status: 408 });
  } else {
    error.response = responseProcessor(error.response);
  }
  if (error.config && error.response && error.response.status === 401 && !error.config.headers.IsSignin) {
    error.config.headers.RetryCount = error.config.headers.RetryCount ? error.config.headers.RetryCount : 0;
    if (error.config.headers.RetryCount < API_RETRY_ATTEMPS) {
      try {
        const fileServerToken = await updateFileServerToken();
        if (fileServerToken) {
          error.config.data._parts.find((array, index) => {
            if (array[0] === 'Token') {
              array[1] = fileServerToken;
              error.config.data._parts[index] = array;
              return true;
            }
          });
          error.config.headers.RetryCount = error.config.headers.RetryCount + 1;
          return FILE_SERVER.request(error.config);
        }
      } catch (err) {
        error.response.problem = 'TOKEN_EXPIRED';
        return Promise.reject(error.response);
      }
    }
    error.response.problem = 'TOKEN_EXPIRED';
    return Promise.reject(error.response);
  }
  return Promise.reject(error.response);
});

PUSH_ADAPTOR.interceptors.response.use((response) => {
  response = responseProcessor(response);
  return response;
}, async (error) => {
  if (error.code === 'ECONNABORTED') {
    error.response = responseProcessor({ status: 408 });
  } else {
    error.response = responseProcessor(error.response);
  }
  if (error.config && error.response && error.response.status === 401) {
    error.config.headers.RetryCount = error.config.headers.RetryCount ? error.config.headers.RetryCount : 0;
    if (error.config.headers.RetryCount < API_RETRY_ATTEMPS) {
      try {
        const resToken = await updateAuthToken();
        if (resToken) {
          error.config.headers.Authorization = `Bearer ${resToken}`;
          error.config.headers.RetryCount = error.config.headers.RetryCount + 1;
          return PUSH_ADAPTOR.request(error.config);
        }
      } catch (err) {
        error.response.problem = 'TOKEN_EXPIRED';
        return Promise.reject(error.response);
      }
    }
    error.response.problem = 'TOKEN_EXPIRED';
    return Promise.reject(error.response);
  }
  return Promise.reject(error.response);
});

INTEGRATION_SERVER.interceptors.response.use((response) => {
  response = responseProcessor(response);
  return response;
}, async (error) => {
  if (error.code === 'ECONNABORTED') {
    error.response = responseProcessor({ status: 408 });
  } else {
    error.response = responseProcessor(error.response);
  }
  if (error.config && error.response && error.response.status === 401) {
    error.config.headers.RetryCount = error.config.headers.RetryCount ? error.config.headers.RetryCount : 0;
    if (error.config.headers.RetryCount < API_RETRY_ATTEMPS) {
      try {
        const resToken = await updateAuthToken();
        if (resToken.ok) {
          error.config.headers.Authorization = `Bearer ${resToken}`;
          error.config.headers.RetryCount = error.config.headers.RetryCount + 1;
          return INTEGRATION_SERVER.request(error.config);
        }
      } catch (err) {
        error.response.problem = 'TOKEN_EXPIRED';
        return Promise.reject(error.response);
      }
    }
    error.response.problem = 'TOKEN_EXPIRED';
    return Promise.reject(error.response);
  }
  return Promise.reject(error.response);
});


export default {
  useEnv,
  API,
  FILE_SERVER,
  PUSH_ADAPTOR,
  INTEGRATION_SERVER
};
