// @flow
import React, { Component } from 'react';
import {
  StatusBar,
  ScrollView,
  Image,
  Easing,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import { connect } from 'react-redux';

import { theme } from '../../styles';
import ViewWrapper from '../../components/ViewWrapper';
import LoadingIndicator from '../../components/LoadingIndicator';
import GenericButton from '../../components/GenericButton';
import EnvSelector from './EnvSelector';
import APIBuilder from '../../helpers/ApiBuilder';
import { authenticateUser, changeEnv } from '../../actions/userActions';
import { setEnv } from '../../actions/initActions';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { isIphoneX } from '../../helpers/UIHelper';
import LogEntries from '../../helpers/LogEntriesBuilder';
import i18n from '../../i18n/i18nConfig';
import { AuthProviders } from '../../constants/AuthProviders';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
const EVENT_SELECTOR_ACTIVATION_PRESS_DELAY = 500;

class Login extends Component {

  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      moveAnimation: new Animated.Value(0),
      fadeAnimation: new Animated.Value(0),
      isLoading: false,
      showEventSelector: false,
      counter: 0,
      lastPress: 0,
      env: 'pilot',
    };

    this.onLoginPress = this.onLoginPress.bind(this);
    this.onEnvChange = this.onEnvChange.bind(this);
    this.counterIncrement = this.counterIncrement.bind(this);
    this.resetCounter = this.resetCounter.bind(this);
  }

  componentDidMount(): void {
    this.props.setEnv('pilot');
    setTimeout(() => this.startAnimation(), 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.user.isFetching && !nextProps.user.isFetching) {
      this.stopAnimation();
    }

    if (this.props.error.errors.length < nextProps.error.errors.length) {
      this.props.setEnv('pilot');
      if (nextProps.error.errors[0].code !== 'RNAppAuth Error') {
        ApiErrorHandler.handleGenericErrors({ problem: nextProps.error.errors[0].problem, caller: null, userErrorMessage: i18n.t('Login.index.loginError') });
      }
    }
  }

  onLoginPress(authProvider): void {
    this.setState({ isLoading: true });
    this.props.authenticateUser(authProvider, this.props.app.isFirstTime ? 'OnBoard' : 'CompanySelect');
  }

  onEnvChange(selected: string): void {
    if (this.state.env !== selected) {
      this.setState({ env: selected });
      this.props.changeEnv(selected);
      APIBuilder.useEnv(selected);
      LogEntries.useEnv(selected);
    }
  }

  counterIncrement() {
    if (this.state.showEventSelector) {
      return true;
    }
    const delta = new Date().getTime() - this.state.lastPress;
    if (delta < EVENT_SELECTOR_ACTIVATION_PRESS_DELAY) {
      const val = this.state.counter + 1;
      if (val < 4) {
        this.setState({ counter: val, showEventSelector: false });
      }
      else if (val >= 4) {
        this.setState({ counter: val, showEventSelector: true });
      }
    } else {
      this.resetCounter();
    }
    this.setState({ lastPress: new Date().getTime() });
  }

  resetCounter() {
    this.setState({ counter: 0, showEventSelector: false });
  }

  isValid(): boolean { // TODO: validate the inputs
    return true;
  }

  startAnimation(): void {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.timing(
        this.state.fadeAnimation,
        {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        },
      )
    ]).start();
  }

  stopAnimation() {
    this.setState({ isLoading: false });
    this.loginAnimation(true);
  }

  loginAnimation(reverse = false): void {
    Animated.timing(
      this.state.fadeAnimation,
      {
        toValue: reverse ? 1 : 0,
        duration: 300,
        useNativeDriver: true
      },
    ).start();
  }

  getAuthProvider(env) {
    if (env == 'pilot') {
      return AuthProviders.UE_PILOT;
    }
    else if (env == 'test') {
      return AuthProviders.UE_TEST;
    }
    else if (env == 'dev') {
      return AuthProviders.UE_DEV;
    }
    else {
      return AuthProviders.UE_PILOT;
    }
  }

  _renderLoginContainer() {
    return (
      <Animated.View
        pointerEvents={this.state.isLoading ? 'none' : 'auto'}
        style={[styles.controlsContainer,
          {
            opacity: this.state.fadeAnimation,
            transform: [
              {
                translateY: this.state.fadeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, -5],
                })
              }
            ]
          }]}
      >
        <View style={styles.loginContainer}>
          {this.state.showEventSelector ? <EnvSelector selected={this.state.env} onChange={this.onEnvChange} height={Platform.OS === 'ios' ? HEIGHT / 5 : HEIGHT / 8} /> : (
            <TouchableWithoutFeedback onPress={this.counterIncrement}>
              <View style={styles.clickableArea} />
            </TouchableWithoutFeedback>
          )}
          <GenericButton text={i18n.t('Login.index.loginWithUE')} isLoading={this.state.isLoading} textStyle={{ fontSize: 17 }} buttonStyle={styles.loginButton} onPress={() => this.onLoginPress(this.getAuthProvider(this.state.env))} />
        </View>

      </Animated.View>
    );
  }

  render() {
    return (
      <ViewWrapper withFade={false} withMove={false} fromBackgroundStyle={styles.wrapperToBackground} useNoSafeAreaView>
        <StatusBar backgroundColor={theme.SYSTEM_COLOR_LIGHT_GRAY_1} />
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContainer}>
            <Animated.View
              style={[styles.logoBox,  {
                transform: [
                  {
                    translateY: this.state.moveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(HEIGHT * 0.8)],
                    })
                  }
                ]
              }]}
            >
              <View style={styles.grayBackground}>
                <View style={styles.grayArea} />
                
                <Animated.View
                  pointerEvents={this.state.isLoading ? 'none' : 'auto'}
                  style={[
                    {
                      opacity: this.state.fadeAnimation,
                      transform: [
                        {
                          translateY: this.state.fadeAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [5, -5],
                          })
                        }
                      ]
                    }]}
                >
                  <Text style={styles.appDescription}>
                    {i18n.t('Login.index.appDesc')}
                  </Text>
                </Animated.View>
              </View>
              <Image source={require('../../images/Login/curve.png')} style={styles.curveImage} resizeMode={'stretch'} />
            </Animated.View>
            <Animated.View
              style={[styles.logoBox, {
                transform: [
                  {
                    translateY: this.state.moveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, isIphoneX() ? -(HEIGHT * 0.25) : -(HEIGHT * 0.3)],
                    })
                  }
                ]
              }]}
            >
              <Image source={require('../../images/About/UE.png')} style={styles.logoStyle} resizeMode={'contain'} />
            </Animated.View>

            {this._renderLoginContainer()}
          </View>
          <LoadingIndicator isVisible={this.state.isLoading} />
        </ScrollView>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    error: state.error,
    app: state.app
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticateUser: (authProvider, compToReset) => dispatch(authenticateUser(authProvider, compToReset)),
    changeEnv: env => dispatch(changeEnv(env)),
    setEnv: env => dispatch(setEnv(env))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);

const styles = StyleSheet.create({
  wrapperToBackground: {
    backgroundColor: theme.SYSTEM_COLOR_WHITE
  },
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -1,
    marginBottom: Platform.OS === 'ios' ? 0 : -1,
  },
  logoBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: WIDTH,
  },
  controlsContainer: {
    height: HEIGHT,
    paddingHorizontal: 35,
  },
  loginContainer: {
    marginTop: Platform.OS === 'ios' ? HEIGHT * 0.5 : HEIGHT * 0.6,
    backgroundColor: theme.SYSTEM_COLOR_WHITE,
  },
  mainContainer: {
    flex: 1,
    height: HEIGHT,
    justifyContent: 'center',
  },
  clickableArea: {
    height: Platform.OS === 'ios' ? HEIGHT / 5 : HEIGHT / 8,
    zIndex: 10,
    backgroundColor: 'transparent'
  },
  logoStyle: {
    height: 40,
    zIndex: 2,
  },
  curveImage: {
    width: WIDTH,
    marginTop: -2,
  },
  appDescription: {
    fontSize: 14,
    color: theme.SYSTEM_COLOR_LIGHT_GRAY_3,
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  grayArea: {
    height: (HEIGHT + (HEIGHT / 3)),
    width: WIDTH,
  },
  grayBackground: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_1,
    alignItems: 'center',
  },
  loginButton: {
    height: 45,
    marginTop: Platform.OS === 'ios' ? 50 : 28,
    width: WIDTH - 70,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_BLUE,
    borderRadius: 5,
  }
});
