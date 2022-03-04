// @flow
import React from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet
} from 'react-native';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import { CustomerOrderItemStatusCodes } from '../../constants/CustomerOrderItemConstants';

export const ItemListRowFront = ({ item, index, onSelect, onLongPress, isActive, onPressOut }) => {


  const calculateVatPercentManually = (ele) => {
    if (ele.PriceExVat === 0) {
      return 0;
    }
    else {
      const val = round(100 * ((ele.PriceIncVat - ele.PriceExVat) / ele.PriceExVat), 2);
      return isNaN(val) ? 0 : val;
    }
  };

  const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  return (

    <TouchableHighlight onLongPress={onLongPress} onPress={() => onSelect(item)} key={item.ID} style={[isActive ? styles.accButton : styles.button, item.StatusCode === CustomerOrderItemStatusCodes.TRANSFERRED ? { backgroundColor: theme.PRIMARY_TEXTINPUT_COLOR } : {}]} underlayColor={item.StatusCode === CustomerOrderItemStatusCodes.TRANSFERRED ? theme.PRIMARY_TEXTINPUT_COLOR : theme.PRIMARY_BACKGROUND_COLOR} onPressOut={onPressOut}>

      {
        item.AccountID != null ?
          <View style={styles.mainTextContainer}>
            <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.ItemText) ? item.ItemText : i18n.t(`OrderDetails.itemListRow.unknown`)}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoText}>{`${i18n.t('OrderDetails.itemListRow.productNo')} ${item.ProductID}`}</Text>
                <Text style={styles.infoTextSubLeft}>{`${item.VatPercent || (item.VatPercent === 0) ? item.VatPercent : calculateVatPercentManually(item)}% ${i18n.t('OrderDetails.itemListRow.vat')}`}</Text>
              </View>

              <View style={styles.infoRight}>
                <Text style={styles.infoTextSubRight}>{`${i18n.t('OrderDetails.itemListRow.no')}: ${item.NumberOfItems < 10 ? '0' + item.NumberOfItems : item.NumberOfItems}`}</Text>
                <View style={styles.amountContainer}>
                  <Text>
                    <Text style={item.SumTotalIncVat > 99999999999 ? styles.amountSmall : styles.amount}>{item.CurrencyCode.Code ? FormatNumber(item.SumTotalIncVatCurrency, i18n.language) : 'NOK ' + item.SumTotalIncVatCurrency.toString()}</Text>
                    <Text style={styles.currencyCode}> {item.CurrencyCode && item.CurrencyCode.Code ? item.CurrencyCode.Code : ''}</Text>
                  </Text>
                </View>
              </View>
            </View>

          </View>
          ://comment line

          <View style={styles.mainTextContainer}>
            <Text style={styles.infoTextMain}>{i18n.t('OrderDetails.index.comment')}</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.infoLeft}>

                <Text style={styles.infoText}>{`${item.ItemText}`}</Text>
              </View>
            </View>

          </View>


      }
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({



  accButton: {
    height: 80,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR

  },

  button: {
    height: 80,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: 'white'

  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5
  },
  infoRight: {
    flex: 2,
    paddingRight: 5,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 5
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 16,
    paddingLeft: 5,
    paddingTop: 10
  },
  infoTextSubLeft: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5,
    marginRight: -80
  },
  infoTextSubRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5
  },
  infoText: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontWeight: '400'
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
    marginBottom: 1
  },
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 17
  },
  amountSmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 15
  },
  amountContainer: {
    marginBottom: 5,
    flexDirection: 'row',
  },
  detailsContainer: {
    flexDirection: 'row'
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1
  },
  activeMainTextContainer: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});
