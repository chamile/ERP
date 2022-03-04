// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import OneSignal from 'react-native-onesignal';
import _ from 'lodash';
import PropTypes from 'prop-types';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import RoundedButton from '../../components/RoundedButton';
import LoadingIndicator from '../../components/LoadingIndicator';
import i18n from '../../i18n/i18nConfig';

const HEIGHT: number = Dimensions.get('window').height;
export default class OnBoardView extends  React.PureComponent {
  static propTypes = {
    onRegisterDevice: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      deviceId: null,
      submitAnimation: new Animated.Value(1),
      loaderAnimation: new Animated.Value(0)
    };
    this.configurePushNotifications = this.configurePushNotifications.bind(this);
    this.onAllowButtonTap = this.onAllowButtonTap.bind(this);
    this.registerDevice = _.debounce(this.registerDevice, 5000, { leading: true });
    this.handlePushRegistration = this.handlePushRegistration.bind(this);
  }

  componentDidMount() {
    this.configurePushNotifications();
  }

  onAllowButtonTap() {
    if (this.state.deviceId) { // If deviceId is already available, proceed with register device for push backend
      this.startAnimation();
      this.registerDevice(this.state.deviceId);
    }
  }

  configurePushNotifications() {
    OneSignal.addEventListener('ids', this.handlePushRegistration.bind(this));
    setTimeout(() => {
      OneSignal.configure();
    }, 1000);
  }

  handlePushRegistration(device) {
    if (device.pushToken) {
      this.setState({
        deviceId: device.userId
      });
    }
  }

  registerDevice(deviceId) {
    this.props.onRegisterDevice(deviceId);
  }

  startAnimation() {
    Animated.timing(
      this.state.submitAnimation,
      {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      },
    ).start();

    Animated.timing(
      this.state.loaderAnimation,
      {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      },
    ).start();
  }

  render() {
    return (
      <ViewWrapper showProgress withFade={true} withMove={true} fromBackgroundStyle={{ backgroundColor: theme.PRIMARY_COLOR }} toBackgroundStyle={{ backgroundColor: '#FFF' }}>
        <View style={styles.container}>
          <ScrollView>
            <Text style={[styles.paragraph, styles.textTop]}>{i18n.t('OnBoard.OnBoardView.keepYouUpdated')}</Text>
            <View style={styles.imageContainer}>
              <Image
                style={styles.image} resizeMode={'contain'}
                source={require('../../images/OnBoarder/androidPush.png')}
              />
            </View>
            <Text style={[styles.paragraph, styles.textBottom]}>{i18n.t('OnBoard.OnBoardView.tapToAllow')}</Text>

            <Animated.View pointerEvents={this.state.submitAnimation === 0 ? 'none' : 'auto'} style={{ backgroundColor: '#FFF', opacity: this.state.submitAnimation }}>
              <RoundedButton text={i18n.t('OnBoard.OnBoardView.letsDoThis')} width={200} color={this.state.deviceId ? theme.PRIMARY_COLOR : theme.DISABLED_ITEM_COLOR} borderWidth={1} onPress={this.onAllowButtonTap} />
            </Animated.View>
            <Animated.View pointerEvents={'none'} style={{ backgroundColor: '#FFF', opacity: this.state.loaderAnimation, marginTop:-40}}>
              <ActivityIndicator
                animating={true}
                color={theme.PRIMARY_COLOR}
                size="large"
              />
            </Animated.View>

            <TouchableOpacity onPress={this.props.onSkip}>
              <Text style={[styles.paragraph, styles.textSkip]}>{i18n.t('OnBoard.OnBoardView.skip')}</Text>
            </TouchableOpacity>

            <View style={{ top: -40, zIndex: -100 }}>
              <LoadingIndicator position={'custom'} marginTop={0} color={theme.PRIMARY_COLOR} isVisible={false} />
            </View>
          </ScrollView>
        </View>
      </ViewWrapper>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  paragraph:{
    width: 250,
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 15,
    lineHeight: 25
  },
  imageContainer:{
    marginTop: 20,
    alignSelf: 'center'
  },
  image: {
    width: 200,
    height: 150,
    alignSelf: 'center'
  },
  textTop: {
    marginTop: HEIGHT / 14,
    marginBottom: 10,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  textBottom: {
    marginTop: 10,
    color: theme.SECONDARY_TEXT_COLOR
  },
  textSkip: {
    marginTop: 25,
    color: theme.SECONDARY_TEXT_COLOR
  }
});