// @flow
import React, { Component } from 'react';
import 'core-js/es6/map';
import 'core-js/es6/set';
import { NativeModules, Platform } from 'react-native';
import { Provider } from 'react-redux';
import codePush from 'react-native-code-push';
import moment from 'moment';
import { I18nextProvider, translate } from 'react-i18next';

import configureStoreAndNavigationWithRedux from './store/configureStore';
import i18n from './i18n/i18nConfig';

const obj = configureStoreAndNavigationWithRedux();
export const store = obj.store;
// adding i18n translate HOC to app to automatically load after system language change
export const AppWithNavigationState =  translate('translations', {
  bindI18n: 'languageChanged',
  bindStore: false
})(obj.AppWithNavigationState);

class App extends Component {
  componentWillMount() {
    const userLocale = Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale : NativeModules.I18nManager.localeIdentifier;
    const locale = userLocale.replace('_', '-');
    if (locale.includes('nb')) {
      moment.locale('nb');
    } else if (locale.includes('nn')) {
      moment.locale('nn');
    } else {
      moment.locale('en');
    }
    this.changeI18nLanguage(locale);
  }

  changeI18nLanguage = (language) => {
    return new Promise((resolve, reject) => {
      i18n.changeLanguage(language, (err, t) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  render() {
    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <AppWithNavigationState />
        </Provider>
      </I18nextProvider>
    );
  }
}

App = codePush(App);

export default App;
