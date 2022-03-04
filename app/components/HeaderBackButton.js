// @flow
import React from 'react';
import {
    StyleSheet,
    Text
} from 'react-native';
import { HeaderBackButton as HeaderBackRN } from 'react-navigation';

import { theme } from '../styles';

export const HeaderBackButton = ({ text, onPress, title }) => {
  return (
    <HeaderBackRN
      tintColor={'#FFF'}
      title={title}
      onPress={onPress}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 40,
    justifyContent:'center',
  },
  text: {
    fontSize: 17,
    color: theme.TEXT_COLOR_INVERT
  }
});
