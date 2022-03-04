// @flow
import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../components/CustomIcon';

import { theme } from '../styles';

const RoundedButton = ({ text, onPress, width, color, borderWidth, icon = null, fontSize, iconSize }) => {
  return (
    <View style={[styles.buttonContainer, { width, borderColor: color, borderWidth }]}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        {icon ? <Icon name={icon} size={iconSize} color="#FFFFFF" /> : null}
        <Text style={[icon ? styles.buttonTitlePaading : styles.buttonTitle, { color, fontSize }]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
};

RoundedButton.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  width: PropTypes.number,
  fontSize: PropTypes.number,
  iconSize: PropTypes.number,
  icon: PropTypes.string,
  color: PropTypes.string,
  borderWidth: PropTypes.number
};

RoundedButton.defaultProps = {
  text: '...',
  onPress: () => { },
  width: 100,
  fontSize: 15,
  iconSize: 20,
  color: theme.PRIMARY_COLOR,
  borderWidth: 1
};

const styles = StyleSheet.create({
  buttonContainer: {
    height: 35,
    borderRadius: 100,
    alignSelf: 'center',
    marginTop: 50
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonTitle: {
    fontWeight: Platform.os === 'ios' ? '500' : '400',
  },
  buttonTitlePaading: {
    fontWeight: Platform.os === 'ios' ? '500' : '400',
    padding: 5
  }
});

export default RoundedButton;
