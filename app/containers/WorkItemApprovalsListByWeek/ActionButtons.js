/* eslint-disable import/prefer-default-export */
// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import _ from 'lodash';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';

export const ActionButtons = ({ item, onSelectDetails }) => {
  return (
    <View style={styles.buttonStyle}>
      <View style={{ flex: 3 }} />
      <View style={styles.button}>
        <Touchable onPress={() => onSelectDetails(item)} style={styles.button}>
          <Text style={styles.textStyle}>{_.toUpper(i18n.t('WorkItemApprovalsListByWeek.actionButtons.details'))}</Text>
        </Touchable>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  }
});
