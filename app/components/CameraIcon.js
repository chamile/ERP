// @flow
import React from 'react';
import {
    Image,
    StyleSheet,
    Platform
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

export const CameraIcon = ({ disabled, onPress }) => {
  return (
    <Touchable style={styles.button} onPress={() => disabled ? null : onPress()}>
      <Image resizeMode={'contain'} style={styles.icon} source={require('../images/InvoiceList/cameraIcon.png')} />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 10,
    marginTop: (Platform.OS === 'ios') ? 8 : 0,
  }
});
