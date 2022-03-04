// @flow
import React, { Component } from 'react';
import {
  View,
  Dimensions,
  StatusBar,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import OneSignal from 'react-native-onesignal';
import RNConfigReader from 'react-native-config-reader';

import { resetToSignIn, resetToCompanySelect, flushErrors, setToken, setEnv, authenticateFileServer, setFileServerToken, setFileServerTokenToRedux, setAccessTokenToRedux } from '../../actions/initActions';
import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import KeychainService from '../../services/KeychainService';
import { incrementUnreadNotificationCount } from '../../actions/notificationActions';
import { validFileServerToken } from '../../helpers/APIUtil';
import LogEntries from '../../helpers/LogEntriesBuilder';
import { refreshAccessToken } from '../../actions/userActions';

const HEIGHT: number = Dimensions.get('window').height;

class Init extends Component {
  static navigationOptions = {
    header: null
  };

  constructor() {
    super();
    this.state = {
      fadeAnimation: new Animated.Value(1),
      scaleAnimation: new Animated.Value(0),
      initNextNavigateCalled: false,
    };
    this.handlePushNotification = this.handlePushNotification.bind(this);
    this.setTokensToRedux = this.setTokensToRedux.bind(this);
  }

  componentWillMount() {
    OneSignal.init(RNConfigReader.ONE_SIGNAL_APP_ID, { kOSSettingsKeyAutoPrompt : false });
    OneSignal.addEventListener('opened', this.handlePushNotification);
    this.setTokensToRedux().then(() => {
      if (!this.state.initNextNavigateCalled) {
        setTimeout(() => this.navigateToNextView(), 0);
        this.setState({ initNextNavigateCalled: true });
      }
    })
      .catch(() => {
        if (!this.state.initNextNavigateCalled) {
          setTimeout(() => this.navigateToNextView(), 0);
          this.setState({ initNextNavigateCalled: true });
        }
      });
  }

  componentDidMount() {
    if (!this.state.initNextNavigateCalled) {
      setTimeout(() => this.navigateToNextView(), 3000);
      this.setState({ initNextNavigateCalled: true });
    }
  }

  setTokensToRedux() {
    KeychainService.getFileServerTokensInKeyChain()
      .then((res) => {
        if (res) {
          this.props.setFileServerTokenToRedux(res);
        }
      })
      .catch(() => {});
    return KeychainService.getAccessTokensInKeyChain()
      .then((res) => {
        if (res) {
          this.props.setAccessTokenToRedux(res);
        }
        return '';
      })
      .catch(() => { return ''; });
  }

  handlePushNotification(openResult) {
    this.props.incrementUnreadNotificationCount();
    if (openResult.notification.isAppInFocus) {
      Alert.alert(
        'New Notification',
        `"${openResult.notification.payload.body}". Do you want to see more?`,
        [
          { text: 'Yes', onPress: () => this.props.navigation.navigate('NotificationsList', null) },
          { text: 'No,', style: 'cancel' }
        ],
        { cancelable: true }
      );
    }
    else {
      setTimeout(() => this.props.navigation.navigate('NotificationsList'), 2000);
    }
  }

  navigateToNextView() {
    this.props.flushErrors(); // clear errors if there are anything in the store
    this.props.setEnv('pilot');
    LogEntries.useEnv('pilot');

    if (this.props.app.isFirstTime || this.props.app.isLoggedOut) { // first time or logged out
      this.props.resetToSignIn();
    } else if (!this.props.app.isFirstTime) { // has previously signed in
      // check the token here
      const validToken = this.validateToken(this.props.token.accessTokenExpirationDate);
      if (validToken) { // token is valid
        this.props.setToken(this.props.token.accessToken);
        validFileServerToken(this.props.token.fileServerTokenUpdatedTimeStamp) ? this.props.setFileServerToken(this.props.token.fileServerToken) : this.props.authenticateFileServer(this.props.token.token);
        setTimeout(() => this.startAnimation(), 700);
        setTimeout(() => this.props.resetToCompanySelect(), 900);
      } else { //  Looks like we need to re-authenticate
        this.props.refreshAccessToken(this.props.token.authProvider, this.props.token.refreshToken, 'CompanySelect');
      }
    }
  }

  validateToken(timestamp) { 
    return (new Date() - new Date(timestamp)) <= 0;
  }

  startAnimation() {
    Animated.parallel([
      Animated.timing(
        this.state.fadeAnimation,
        {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        },
      ),
      Animated.timing(
        this.state.scaleAnimation,
        {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        },
      )
    ]).start();
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={false} statusBarColor={theme.SYSTEM_COLOR_LIGHT_GRAY_1} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} useNoSafeAreaView>
        <StatusBar backgroundColor={theme.SYSTEM_COLOR_LIGHT_GRAY_1} />
        <ScrollView style={styles.container}>
          <Animated.View style={[styles.animatedView, { opacity: this.state.fadeAnimation }]}>
            <View style={styles.logoBox}>
              <Animated.Image
                style={[{ height: 40 }, { transform: [
                  { scale: this.state.scaleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 4],
                  }) }
                ] }]}
                source={require('../../images/About/UE.png')}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    app: state.app,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetToSignIn: () => dispatch(resetToSignIn()),
    resetToCompanySelect: () => dispatch(resetToCompanySelect()),
    refreshAccessToken: (authProvider, refreshToken, navigateTo) => dispatch(refreshAccessToken(authProvider, refreshToken, navigateTo)),
    flushErrors: () => dispatch(flushErrors()),
    setToken: token => dispatch(setToken(token)),
    setEnv: env => dispatch(setEnv(env)),
    incrementUnreadNotificationCount: () => dispatch(incrementUnreadNotificationCount()),
    authenticateFileServer: token => dispatch(authenticateFileServer(token)),
    setFileServerToken: token => dispatch(setFileServerToken(token)),
    setAccessTokenToRedux: obj => dispatch(setAccessTokenToRedux(obj)),
    setFileServerTokenToRedux: obj => dispatch(setFileServerTokenToRedux(obj)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Init);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -1,
    marginBottom: Platform.OS === 'ios' ? 0 : -1,
  },
  logoBox: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedView: {
    flex: 1,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_1,
    height: HEIGHT,
    justifyContent: 'center'
  },
  fromBackgroundStyle: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_1
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF'
  }
});
