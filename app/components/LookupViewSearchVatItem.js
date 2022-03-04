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

export const LookupViewSearchVatItem = ({ item, index, onSelect, entityType }) => {
  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={styles.container}>
        <View style={styles.mainTextContainer}>
          <View style={styles.leftContainer}>
            <Text style={styles.customerNameText} numberOfLines={1} ellipsizeMode={'tail'}>
              {_.trimStart(`${item.ID}: ${item.VatPercent}% - ${item.Name}`)}
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
