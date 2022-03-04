// @flow
import { createStore, applyMiddleware, compose } from 'redux';
import AsyncStorage from '@react-native-community/async-storage';
import logger from 'redux-logger';
import {
  persistStore,
  persistCombineReducers,
} from 'redux-persist';
import { 
  createReactNavigationReduxMiddleware,
  createNavigationReducer,
  reduxifyNavigator
} from 'react-navigation-redux-helpers';
import { connect } from 'react-redux';
import createSagaMiddleware from 'redux-saga';

import reducers from '../reducers';
import rootSaga from '../sagas';
import { AppNavigator } from '../containers/RootNavigator';

export default function configureStoreAndNavigationWithRedux() {
  const sagaMiddleware = createSagaMiddleware();

  const navReducer = createNavigationReducer(AppNavigator);

  const persistConfig = {
    key: 'rootReducer',
    storage: AsyncStorage,
    blacklist: ['nav', 'error', 'newInvoice', 'addressList', 'token'],
  };

  const rootReducer = persistCombineReducers(persistConfig, {
    ...reducers,
    nav: navReducer,
  });

  const navigationMiddleware = createReactNavigationReduxMiddleware(
    'rootReducer',
    state => state.nav,
  );

  const AppWithNavigationAndRedux = reduxifyNavigator(AppNavigator, "rootReducer");

  const mapStateToProps = (state) => ({
    state: state.nav,
  });

  const AppWithNavigationState = connect(mapStateToProps)(AppWithNavigationAndRedux);

  const _middlewares = [sagaMiddleware, navigationMiddleware];

  if (process.env.NODE_ENV === 'development') {
    _middlewares.push(logger);
  }

  const store = createStore(
    rootReducer,
    undefined,
    compose(
      applyMiddleware(..._middlewares),
    )
  );

  sagaMiddleware.run(rootSaga);

  const persistor = persistStore(store);

  if (module.hot) {
    module.hot.accept(() => {
      store.replaceReducer(rootReducer);
    });
  }

  return { store, AppWithNavigationState };
}