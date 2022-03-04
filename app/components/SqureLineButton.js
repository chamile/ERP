// @flow
import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import { theme } from '../styles';

const SqureLineButton = ({ text, onPress, width, height, color, borderWidth, style, disabled }) => {
  return (
    <View style={[styles.buttonContainer, { width, height, borderColor: color }, { ...style }, disabled ? styles.disabledView : {}]}>
      <TouchableOpacity style={styles.button} onPress={disabled ? null : onPress}>
        <Text style={[styles.buttonTitle, { color }, disabled ? styles.disabledText : {}]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
};

SqureLineButton.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  width: PropTypes.number,
  color: PropTypes.string,
};

SqureLineButton.defaultProps = {
  text: '...',
  onPress: () => { },
  width: 100,
  height: 30,
  color: theme.PRIMARY_COLOR,
  style: {}
};

export default SqureLineButton;

const styles = StyleSheet.create({
  buttonContainer: {
    borderWidth: 1,
    height: 40,
    borderRadius: 5,
    alignSelf: 'center'
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '500'
  },
  disabledView: {
    borderColor: theme.DISABLED_ITEM_COLOR
  },
  disabledText: {
    color: theme.DISABLED_ITEM_COLOR
  }
});
