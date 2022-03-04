// @flow
import React from 'react';
import {
  StyleSheet,
  Text
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import { theme } from '../styles';

export const HeaderTextButton = ({ text, onPress, position, isActionComplete = false, textColor = theme.ACTION_HIGHLIGHT_COLOR }) => {
  return (
    <Touchable
      onPress={isActionComplete ? undefined : onPress}
      style={[styles.button, {
        alignItems: position === 'left' ? 'flex-start' : 'flex-end',
        paddingRight: position === 'right' ? 10 : 0,
        paddingLeft: position === 'left' ? 10 : 0,
      }]}
    >
      <Text style={[isActionComplete ? styles.textDisabled : styles.text, { fontWeight: position === 'right' ? '600' : '400' }, { color: isActionComplete ? theme.DISABLED_ITEM_COLOR : textColor }]}>{text}</Text>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 90,
    height: 40,
    justifyContent: 'center'
  },
  text: {
    fontSize: 17,
    color: theme.ACTION_HIGHLIGHT_COLOR,
  },
  textDisabled: {
    fontSize: 17,
    color: theme.DISABLED_ITEM_COLOR
  }
});
