// @flow
import React, { Component } from 'react';
import {
    StyleSheet,
    Animated,
    Platform,
    View
} from 'react-native';
import _ from 'lodash';

import { theme } from '../styles';
import { ifIphoneX } from '../helpers/UIHelper';


export default class FloatingBottomContainer extends Component {
  constructor() {
    super();
    this.state = {
      moveAnimation: new Animated.Value(0)
    };
    this.scrollHandler = this.scrollHandler.bind(this);
  }

  startAnimation(isReverse = false) {
    Animated.spring(this.state.moveAnimation, {
      duration: this.props.delay ? this.props.delay : 80,
      toValue: isReverse ? 1 : 0,
      bounciness: 0,
      useNativeDriver: true
    }).start();
  }

  scrollHandler(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const maxContentSize = event.nativeEvent.contentSize.height;
    const isDirectionUp = currentOffset > 100 ? currentOffset < maxContentSize - (Platform.OS === 'ios' ? ifIphoneX(700, 650) : -300) ? currentOffset > this.offset : true : false;
    this.offset = currentOffset;
    this.startAnimation(isDirectionUp);
  }

  render() {
    return (
          _.some(this.props.children, child =>  !_.isEmpty(child)) ?
            <Animated.View
              style={[styles.animatedContainer, {
                transform: [{
                  translateY: this.state.moveAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, this.props.height ? this.props.height + 20 : 70],
                  })
                }]
              }]}
            >
              <View style={[styles.bottomButtonContainer, this.props.height ? { height: this.props.height } : {}]}>
                {this.props.children}
              </View>
              {this.props.additionalBottomHeight && this.props.additionalBottomHeight > 0 ? <View style={[styles.spacer, { height: this.props.additionalBottomHeight }]} /> : null}
            </Animated.View>
                : null
    );
  }
}

const styles = StyleSheet.create({
  animatedContainer: {
    overflow: 'hidden',
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
  },
  bottomButtonContainer: {
    height: 50,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  spacer: {
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
  }
});
