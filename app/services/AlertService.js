import { Platform, Alert } from 'react-native';
import _ from 'lodash';
import i18n from '../i18n/i18nConfig';
import { AlertType } from '../constants/AlertTypes';

const showSimpleAlert = (title = null, message = null, alertType, cb, onCancel = () => {}, btnText_1 = null, btnText_2 = null) => {
  switch (alertType) {
    case AlertType.WARNING: {
      Alert.alert(
        title ? title : _.capitalize(AlertType.WARNING),
        message,
        [
          { text: i18n.t('Login.index.cancel'), onPress: onCancel }
        ]
      );
      break;
    }
    case AlertType.RESET_TO_LOGIN: {
      Alert.alert(
        i18n.t('Login.index.error'),
        message,
        [
          { text: i18n.t('Login.index.login'), onPress: () => cb ? cb() : null }
        ]
      );
      break;
    }
    case AlertType.CONFIRMATION: {
      Alert.alert(
        title ? title : _.capitalize(AlertType.CONFIRMATION),
        message,
        [
          { text: btnText_1, onPress: () => cb ? cb() : null },
          { text: btnText_2, onPress: onCancel }
        ]
      );
      break;
    }
    case AlertType.UNAUTHORIZED: {
      Alert.alert(
        title ? title : i18n.t('Login.index.accessDenied'),
        message ? message : i18n.t('Login.index.accessDeniedGenericMsg'),
        [
          { text: i18n.t('Login.index.cancel'), onPress: onCancel }
        ]
      );
      break;
    }
    default: {
      Alert.alert(
        i18n.t('Login.index.error'),
        message,
        cb ? [
          { text: i18n.t('Login.index.retry'), onPress: () => cb ? cb() : null },
          { text: i18n.t('Login.index.cancel'), onPress: onCancel }
        ] : [
          { text: i18n.t('Login.index.cancel'), onPress: onCancel }
        ]
      );
    }
  }
 

  // MessageBarManager.showAlert({
  //   title: title,
  //   message: message,
  //   alertType: alertType || 'error',
  //   titleStyle: { color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 5 },
  //   messageStyle: { color: 'white', fontSize: 16 },
  //   durationToShow: 900,
  //   durationToHide: 700,
  //   duration: 3500,
  //   shouldHideAfterDelay: false,
  //   onTapped: cb,
  //   viewTopInset : 5,
  //   stylesheetSuccess: {
  //     backgroundColor: '#27AE61', strokeColor: '#27AE61', zIndex: 1000
  //   },
  //   stylesheetError: {
  //     backgroundColor: '#E84C3D', strokeColor: '#E84C3D'
  //   }
  // });

};

export default {
  showSimpleAlert
};
