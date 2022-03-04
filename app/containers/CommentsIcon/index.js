import React, { Component } from 'react';
import { View, Image, StyleSheet, Platform, Text } from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import { theme } from '../../styles';

export default class CommentsIcon extends Component {
  render() {
    return (
      <Touchable onPress={this.props.disabled ? null : this.props.onPress} style={styles.button}>
        <View style={styles.badgeBackground}>
          <Text style={styles.badgeCount}>{this.props.count}</Text>
        </View>
        <Image resizeMode={'contain'} style={styles.icon} source={require('../../images/Shared/commentsIcon.png')} />
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    alignItems: 'flex-end'
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 10,
    marginTop: 10,
  },
  badgeBackground: {
    width: 26,
    borderRadius: 50,
    zIndex: 10,
    height: 20,
    backgroundColor: theme.HINT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 2
  },
  badgeCount: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: theme.TEXT_COLOR_INVERT,
    fontWeight: '500'
  }
});
