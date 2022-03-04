// @flow
import React from 'react';
import {
    Image,
    StyleSheet,
    Platform
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import Analytics from 'appcenter-analytics';
import { AnalyticalEventNames } from '../constants/AnalyticalEventNames';

export const SearchIcon = ({ navigate, disabled, data = {} }) => {
  return (
    <Touchable
      style={styles.button}
      onPress={() => {
        if (!disabled) {
          navigate('SearchView', { data });
          Analytics.trackEvent(AnalyticalEventNames.CLICK_SEARCH_ICON);
        }
      }}
    >
      <Image resizeMode={'contain'} style={styles.icon} source={require('../images/Sales/search.png')} />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    marginTop: (Platform.OS === 'ios') ? 10 : 4,
  }
});
