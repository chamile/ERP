// @flow
import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import PropTypes from 'prop-types';

const GenericButton = ({ text, onPress, buttonStyle, textStyle, disabled, isLoading = false }) => {
  return (
    <TouchableOpacity disabled={disabled} style={[styles.button, buttonStyle ? buttonStyle : {}]} onPress={onPress}>
      {isLoading ? <ActivityIndicator size="small" animating={isLoading} color="white" style={{ paddingHorizontal: 15 }} /> : null}
      <Text style={[styles.buttonTitle, textStyle ? textStyle : {}]}>{text}</Text>
    </TouchableOpacity>
  );
};

GenericButton.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

GenericButton.defaultProps = {
  text: '...',
  onPress: () => { },
  style: {}
};

export default GenericButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0082C0',
    height: 50,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500'
  }
});
