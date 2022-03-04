// @flow
import React from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet
} from 'react-native';
import CheckBox from 'react-native-check-box';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const ItemListRow = ({ item, onSelect }) => {
  const calculateVatPercentManually = (itemData) => {
    const val = round(100 * ((itemData.PriceIncVat - itemData.PriceExVat) / itemData.PriceExVat), 2);
    return isNaN(val) ? 0 : val;
  };

  const round = (value, decimals) => {
    return Number(`${Math.round(value + 'e' + decimals)  }e-${  decimals}`);
  };

  return (
    <TouchableHighlight key={item.ID} style={styles.button} underlayColor={theme.PRIMARY_BACKGROUND_COLOR}>
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.ItemText) ? item.ItemText : i18n.t('TransferCustomerOrderToInvoiceView.itemListRow.unknown')}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoText}>{`${i18n.t('TransferCustomerOrderToInvoiceView.itemListRow.productNo')} ${item.ProductID}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${item.VatPercent || (item.VatPercent === 0) ? item.VatPercent : calculateVatPercentManually(item)}% ${i18n.t('TransferCustomerOrderToInvoiceView.itemListRow.vat')}`}</Text>
          </View>

          <View style={styles.infoRight}>
            <Text style={styles.infoTextSubRight}>{`${i18n.t('TransferCustomerOrderToInvoiceView.itemListRow.no')}: ${item.NumberOfItems < 10 ? `0${  item.NumberOfItems}` : item.NumberOfItems}`}</Text>
            <View style={styles.amountContainer}>
              <Text>
                <Text style={item.SumTotalIncVat > 99999999999 ? styles.amountSmall : styles.amount}>{FormatNumber(item.SumTotalIncVatCurrency, i18n.language)}</Text>
                <Text style={styles.currencyCode}> {item.CurrencyCode && item.CurrencyCode.Code ? item.CurrencyCode.Code : ''}</Text>
              </Text>
            </View>
          </View>

          <CheckBox
            style={styles.checkBox}
            onClick={() => onSelect(item)}
            isChecked={item.isChecked}
            checkBoxColor={theme.HINT_COLOR}
          />
        </View>

      </View>

    </TouchableHighlight>
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
    backgroundColor: 'white'
  },
  infoLeft: {
    flex: 4,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5
  },
  infoRight: {
    flex: 7,
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
    flex: 1,
  },
  checkBox: {
    marginLeft: 10,
    marginRight: 5,
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});
