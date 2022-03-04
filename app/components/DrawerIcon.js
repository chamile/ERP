// @flow
import React from 'react';
import {
    Image,
    StyleSheet,
    Platform
} from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import { withNavigation } from 'react-navigation';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import Analytics from 'appcenter-analytics';
import { AnalyticalEventNames } from '../constants/AnalyticalEventNames';

class DrawerIconWithoutNavigation extends React.Component {
  render() {
    return (
      <Touchable
        style={styles.button}
        onPress={() => {
          Analytics.trackEvent(AnalyticalEventNames.DRAWER_OPEN);
          this.props.navigation.dispatch(DrawerActions.openDrawer ());
        }}
      >
        <Image resizeMode={'contain'} style={styles.icon} source={require('../images/Shared/hamburgerIcon.png')} />
      </Touchable>
    )
  }
}
export const DrawerIcon = withNavigation(DrawerIconWithoutNavigation);

const styles = StyleSheet.create({
  button: {
    flex: 1
  },
  icon: {
    width: 32,
    height: 32,
    marginLeft: 5,
    marginBottom: (Platform.OS === 'ios') ? 0 : 8,
  }
});
