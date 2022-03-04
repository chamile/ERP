// @flow
import AlertService from '../services/AlertService';
import { NavigationActions } from 'react-navigation';
import { store } from '../App';
import { AlertType } from '../constants/AlertTypes';
import i18n from '../i18n/i18nConfig';

const handleGenericErrors = ( error = { problem: null, caller: null, userErrorMessage: 'Something went wrong.' , onCancel: () => {} }) => {
  let message: string = '';
  let authFailed: boolean = false;
  let unauthorized: boolean = false;
  switch (error.problem) {
    case 'CLIENT_ERROR':
      message = error.userErrorMessage;
      break;
    case 'SERVER_ERROR':
      message = i18n.t('Errors.serverTrouble');
      break;
    case 'TIMEOUT_ERROR':
      message = i18n.t('Errors.serverTakingTooLong');
      break;
    case 'CONNECTION_ERROR':
      message = i18n.t('Errors.serverNotRespond');
      break;
    case 'NETWORK_ERROR':
      message = i18n.t('Errors.offline');
      break;
    case 'CANCEL_ERROR':
      message = i18n.t('Errors.requestCancled');
      break;
    case 'OFFLINE':
      message = i18n.t('Errors.offline');
      break;
    case 'TOKEN_EXPIRED':
      message = i18n.t('Errors.authFailed');
      authFailed = true;
      break;
    case 'UNAUTHORIZED':
      message = i18n.t('Errors.accessDenied');
      unauthorized = true;
      break;
    default:
      message = error.problem;
  }
  if (authFailed) {
    AlertService.showSimpleAlert(null, `${message} ${i18n.t('Errors.loginAgain')}`, AlertType.RESET_TO_LOGIN, () => {
      store.dispatch(NavigationActions.navigate({
        routeName: 'Login'
      }));
    }, error.onCancel);
  } else if (unauthorized) {
    AlertService.showSimpleAlert(null, null, AlertType.UNAUTHORIZED, null, error.onCancel);
  } 
  else {
    AlertService.showSimpleAlert(null,`${message} ${error.caller ? i18n.t('Errors.tapToRetry') : ''}`, AlertType.ERROR, error.caller, error.onCancel);
  }
};

export default {
  handleGenericErrors
};
