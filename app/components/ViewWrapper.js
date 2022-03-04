// @flow
import React, { Component } from 'react';
import {
  Text,
  View,
  Animated,
  StyleSheet,
  InteractionManager,
  StatusBar,
  ViewPropTypes,
  SafeAreaView
} from 'react-native';
import PropTypes from 'prop-types';

import { globalStyles, theme } from '../styles';

export default class ViewWrapper extends React.PureComponent {

  static defaultProps = {
    fromBackgroundStyle: {},
    toBackgroundStyle: {},
    withMove: true,
    withFade: true,
    statusBarColor: theme.PRIMARY_STATUS_BAR_COLOR,
  };

  static propTypes = {
    fromBackgroundStyle: ViewPropTypes.style,
    toBackgroundStyle: ViewPropTypes.style,
    withMove: PropTypes.bool,
    withFade: PropTypes.bool,
    statusBarColor: PropTypes.string,
  };

  constructor() {
    super();
    this.state = {
      isTransitionOver: false,
      fadeAnimation: new Animated.Value(0),
    }
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({
        isTransitionOver: true
      });

      this.startAnimation();
    });
  }

  startAnimation() {
    Animated.timing(
      this.state.fadeAnimation,
      {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      },
    ).start();
  }

  render() {
    const { useNoSafeAreaView } = this.props;
    return (
      <View style={[globalStyles.container, styles.container, this.props.fromBackgroundStyle]}>
        <StatusBar backgroundColor={this.props.statusBarColor} animated={true} />
        {
          useNoSafeAreaView ?
           this.state.isTransitionOver ? (
              <Animated.View
                style={[globalStyles.container, this.props.toBackgroundStyle, {
                  opacity: this.props.withFade ? this.state.fadeAnimation : 1,
                  transform: [
                    { translateY: this.props.withMove ? this.state.fadeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-5, 0],
                    }) : 1 }
                  ]
                }]}
              >
                {this.props.children}
              </Animated.View>
            ) : (
              null
            )
          : <SafeAreaView style={styles.content}>
            {this.state.isTransitionOver ? (
              <Animated.View
                style={[globalStyles.container, this.props.toBackgroundStyle, {
                  opacity: this.props.withFade ? this.state.fadeAnimation : 1,
                  transform: [
                    { translateY: this.props.withMove ? this.state.fadeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-5, 0],
                    }) : 1 }
                  ]
                }]}
              >
                {this.props.children}
              </Animated.View>
            ) : (
              null
            )}
          </SafeAreaView>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: -5,
    backgroundColor: '#FFF'
  },
  content: {
    flex: 1,
  }
});
