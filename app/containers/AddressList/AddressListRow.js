// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';

export const AddressListRow = ({ item, index, onSelect = () => {}, onPressAction = () => {}, actionName = i18n.t('AddressList.AddressListRow.edit') }) => {
  return (
    <Touchable onPress={() => onSelect(item, index)} key={item.ID} style={styles.button}>
      <View style={styles.detailsContainer}>
        <View style={styles.infoLeft}>
          <Text style={styles.infoText}>{`${item.AddressLine1}, ${item.PostalCode} ${item.City}`}</Text>
        </View>
        <Touchable onPress={() => onPressAction(item, index)}>
          <View style={styles.infoRight}>
            <Text style={styles.viewButton}>{actionName}</Text>
          </View>
        </Touchable>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
    paddingVertical: 10,
  },
  infoLeft: {
    flex: 3,
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  infoRight: {
    flex: 1,
    paddingVertical: 5,
    paddingLeft: 25,
    paddingRight: 15,
    alignItems: 'flex-end',
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    fontSize: 15,
  },
  detailsContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingLeft: 5,
  },
  viewButton: {
    color: theme.PRIMARY_COLOR,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 5,
  }
});
