// @flow
import React, { Component } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import _ from 'lodash';

import { theme } from '../styles';
import i18n from '../i18n/i18nConfig';
import { EntityType } from '../constants/EntityTypes';

export const LookupViewSearchItem = ({ item, index, onSelect, entityType }) => {
  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={styles.container}>
        <View style={styles.mainTextContainer}>
          <View style={styles.leftContainer}>
            <Text style={styles.customerNameText} numberOfLines={1} ellipsizeMode={'tail'}>
              {_.trimStart(getHeaderProperty(item, entityType))}
            </Text>
            <Text style={styles.customerIdText}>
              ID: {getIDProperty(item, entityType)}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={styles.addButton}>
              {i18n.t('SearchView.index.add')}
            </Text>
          </View>
        </View>
        <View style={styles.seperator} />
      </View>
    </Touchable>
  );
};

getHeaderProperty = (item, entityType) => {
  if (entityType === EntityType.CUSTOMER) {
    return item.Info.Name;
  } else if (entityType === EntityType.PROJECT) {
    return item.Name;
  } else if (entityType === EntityType.CURRENCY) {
    return item.Code;
  } else if (entityType === EntityType.SELLER) {
    return item.Name;
  } else if (entityType === EntityType.WORK_TYPE) {
    return item.Name;
  } else if (entityType === EntityType.SUPPLIER) {
    return item.Info.Name;
  } else if (entityType === EntityType.CUSTOMER_ORDER) {
    return item.CustomerName;
  } else if (entityType === EntityType.VAT_TYPE) {
    return `${item.Name} - ${item.VatPercent}%`;
  } else if (entityType === EntityType.DEPARTMENT) {
    return item.Name;
  } else if (entityType === EntityType.COUNTRY) {
    return item.Name;
  } else if (entityType === EntityType.DELIVERY_TERMS) {
    return item.Name;
  } else if (entityType === EntityType.PAYMENT_TERMS) {
    return item.Name;
  }
  return null;
};

getIDProperty = (item, entityType) => {
  if (entityType === EntityType.CUSTOMER_ORDER) {
    return item.OrderNumber;
  } else if (entityType === EntityType.PROJECT) {
    return item.ProjectNumber;
  } else if (entityType === EntityType.CUSTOMER) {
    return item.CustomerNumber;
  } else if (entityType === EntityType.DEPARTMENT) {
    return item.DepartmentNumber;
  } else {
    return item.ID;
  }
  return null;
};

const styles = StyleSheet.create({
  button: {
    height: 50,
  },
  container: {
    marginLeft: 15,
    marginRight: 15,
    flex: 1,
    justifyContent: 'space-between'
  },
  customerNameText: {
    color: theme.PRIMARY_TEXT_COLOR
  },
  seperator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'lightgrey'
  },
  customerIdText: {
    paddingTop: 2,
    color: theme.SECONDARY_TEXT_COLOR
  },
  mainTextContainer: {
    marginTop: 8,
    flexDirection: 'row',
  },
  addButton: {
    color: theme.PRIMARY_COLOR,
  },
  rightContainer: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
  },
  leftContainer: {
    flex: 3,
  }
});
