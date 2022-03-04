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

export const SupplierSearchListRow = ({ item, index, onSelect }) => {
  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{item.InfoName ? item.InfoName.trim() : i18n.t('SupplierList.CustomerListRow.unknown')}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>

            <Text style={styles.infoText}>{`${item.SupplierNumber ? item.SupplierNumber : i18n.t('SupplierList.SupplierListRow.supplierNumber') + i18n.t(' - ') + i18n.t('SupplierList.SupplierListRow.notSpecified')}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${item.InvoiceAddressAddressLine1 ? item.InvoiceAddressAddressLine1 : i18n.t('SupplierList.SupplierListRow.address') + i18n.t(' - ') + i18n.t('SupplierList.SupplierListRow.notSpecified')}`}</Text>
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.viewButton}>{item.WebUrl ? item.WebUrl : ''}</Text>
          </View>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 80,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  infoRight: {
    flex: 1,
    padding: 5,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 15,
    paddingTop: 10,
  },
  infoTextSubLeft: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5,
    marginRight: -80,
  },
  infoTextSubRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5,
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 5,
  },
  viewButton: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: -15,
  }
});
