import { authorize, refresh, revoke } from 'react-native-app-auth';
import RNConfigReader from 'react-native-config-reader';
import ApiBuilder from '../helpers/ApiBuilder';
import { AuthProviders } from '../constants/AuthProviders';

const getAuthProviderConfigs = (authProvider) => {
  let config = '';
  switch (authProvider) {
    case AuthProviders.UE_DEV:
      config = {
        issuer: RNConfigReader.UE_DEV_ISSUER,
        clientId: RNConfigReader.UE_DEV_CLIENT_ID,
        redirectUrl: 'no.unieconomy.unieconomy:/oauthredirect',
        scopes: ['openid', 'profile', 'AppFramework.All', 'AppFramework', 'offline_access'],
        additionalParameters: {
          prompt: 'login'
        }
      };
      break;
    case AuthProviders.UE_TEST:
      config = {
        issuer: RNConfigReader.UE_TEST_ISSUER,
        clientId: RNConfigReader.UE_TEST_CLIENT_ID,
        redirectUrl: 'no.unieconomy.unieconomy:/oauthredirect',
        scopes: ['openid', 'profile', 'AppFramework.All', 'AppFramework', 'offline_access'],
        additionalParameters: {
          prompt: 'login'
        }
      };
      break;
    case AuthProviders.UE_PILOT:
      config = {
        issuer: RNConfigReader.UE_PILOT_ISSUER,
        clientId: RNConfigReader.UE_PILOT_CLIENT_ID,
        redirectUrl: 'no.unieconomy.unieconomy:/oauthredirect',
        scopes: ['openid', 'profile', 'AppFramework.All', 'AppFramework', 'offline_access'],
        additionalParameters: {
          prompt: 'login'
        }
      };
      break;

    default:
      config = {
        issuer: RNConfigReader.UE_PILOT_ISSUER,
        clientId: RNConfigReader.UE_PILOT_CLIENT_ID,
        redirectUrl: 'no.unieconomy.unieconomy:/oauthredirect',
        scopes: ['openid', 'profile', 'AppFramework.All', 'AppFramework', 'offline_access'],
        additionalParameters: {
          prompt: 'login'
        }
      };
      break;
  }
  return config;
};

const authenticateUser = (authProvider) => {
  return authorize(getAuthProviderConfigs(authProvider));
};

const refreshAccessToken = (authProvider, refreshToken) => {
  return refresh(getAuthProviderConfigs(authProvider), { refreshToken });
};

const revokeToken = (authProvider, refreshToken, accessToken) => {
  return revoke(getAuthProviderConfigs(authProvider), {
    tokenToRevoke: refreshToken,
    sendClientId: true
  }).then(() => {
    return revoke(getAuthProviderConfigs(authProvider), {
      tokenToRevoke: accessToken,
      sendClientId: true
    });
  });
};

const authenticateFileServer = ({ token }) => {
  return ApiBuilder.FILE_SERVER.post('api/init/sign-in', JSON.stringify(token),  { headers: { 'IsSignin': true } });
};

const getCurrentSession = (companyKey) => {
  return ApiBuilder.API.get('api/biz/users?action=current-session',
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  authenticateUser,
  authenticateFileServer,
  getCurrentSession,
  refreshAccessToken,
  revokeToken,
};
