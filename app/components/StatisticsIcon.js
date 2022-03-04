// @flow
import React from 'react';
import {
    Image,
    StyleSheet,
    Platform
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

export const StatisticsIcon = ({ navigate, disabled }) => {
  return (
    <Touchable style={styles.button} onPress={() => disabled ? null : navigate('StatisticsView')}>
      <Image resizeMode={'contain'} style={styles.icon} source={require('../images/Hours/statisticsIcon.png')} />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
    marginTop: (Platform.OS === 'ios') ? 8 : 0,
  }
});
