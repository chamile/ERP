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
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const ProductSearchListRow = ({ item, index, onSelect }) => {
  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.Name) ? item.Name : i18n.t('OrderDetails.itemListRow.unknown')}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoText} numberOfLines={1}>{`SKU: ${item.PartName}`}</Text>
          </View>

          <View style={styles.infoRight}>
            <View style={styles.amountContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit={item.PriceExVat > 99999999999} style={item.PriceExVat > 99999999999 ? styles.amountSmall : styles.amount}>{FormatNumber(item.PriceExVat)}</Text>
            </View>
          </View>
        </View>

      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5,
  },
  infoRight: {
    flex: 1,
    paddingRight: 5,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 3,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 15,
    paddingLeft: 5,
    paddingTop: 7,
  },
  infoTextSubLeft: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    paddingVertical: 5,
    marginRight: -80,
  },
  infoTextSubRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    paddingVertical: 5,
    paddingRight: 5,
  },
  infoText: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontWeight: '400',
  },
  currency: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    marginBottom: 1,
    alignSelf: 'flex-end',
  },
  currencySmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    fontSize: 13,
    alignSelf: 'flex-end',
    marginBottom: 1,
  },
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10,
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 17,
  },
  amountSmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 15,
  },
  amountContainer: {
    marginBottom: 5,
    flexDirection: 'row',
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
  },
});
