// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import moment from 'moment';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { CustomerInvoiceStatusCodes } from '../../constants/CustomerInvoiceConstants';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const CustomerInvoiceListRow = ({ item, index, onSelect }) => {
  const formatDate = (date) => {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const _processStatus = (status) => {
    let text = null;
    let color = 'transparent';
    switch (status) {
      case CustomerInvoiceStatusCodes.DRAFT: {
        text = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
        break;
      }
      case CustomerInvoiceStatusCodes.INVOICED: {
        text = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoiced');
        color = theme.SCREEN_COLOR_LIGHT_BLUE;
        break;
      }
      case CustomerInvoiceStatusCodes.PAID: {
        text = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.paid');
        color = theme.SCREEN_COLOR_GREEN;
        break;
      }
      case CustomerInvoiceStatusCodes.PARTLY_PAID: {
        text = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.partlyPaid');
        color = theme.SCREEN_COLOR_RED;
        break;
      }
      default: {
        text = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
      }
    }
    return { text, color };
  };

  let StatusObj = _processStatus(item.StatusCode);

  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={[styles.statusBar, StatusObj.color ? { backgroundColor: StatusObj.color } : {}]} />
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.CustomerName) ? item.CustomerName.trim() : i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.unknown')}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoText}>{`${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoice')} ${item.InvoiceNumber ? item.InvoiceNumber : ' -'}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoiceDate')} - ${item.InvoiceDate ? item.InvoiceDate : i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.notSpecified')}`}</Text>
            <View style={styles.rowContainer}>
              <Text style={styles.infoTextSubLeftDueDate}>{`${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.dueDate')} - `}</Text>
              <Text style={[styles.infoTextSubLeft, item.PaymentDueDate ? moment(item.PaymentDueDate).diff(moment(formatDate(new Date())), 'days') < 1 && item.StatusCode !== CustomerInvoiceStatusCodes.PAID ? { color: theme.SCREEN_COLOR_LIGHT_RED } : { color: theme.HINT_COLOR } : {}]}>{item.PaymentDueDate ? item.PaymentDueDate : i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.notSpecified')}</Text>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.amountContainer}>
              <Text>
                <Text style={[styles.amount, item.TaxExclusiveAmountCurrency < 0 ? { color: theme.SCREEN_COLOR_LIGHT_RED } : {}]}>{FormatNumber(item.TaxInclusiveAmountCurrency, i18n.language)}</Text>
                <Text style={styles.currencyCode}> {item.CurrencyCode && item.CurrencyCode.Code ? item.CurrencyCode.Code : ''}</Text>
              </Text>
            </View>
            <Text style={[styles.infoTextSubRight, { color: StatusObj.color ? StatusObj.color : styles.statusBar.backgroundColor }]}>{`${StatusObj.text}`}</Text>
          </View>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    // height: 100,
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
    padding: 5,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 15,
    paddingLeft: 5,
    paddingTop: 10,
  },
  infoTextSubLeft: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingTop: 5,
  },
  infoTextSubLeftDueDate: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 5,
  },
  infoTextSubRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 5,
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
  },
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10,
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 16,
    marginTop: -3,
  },
  amountContainer: {
    flexDirection: 'row',
  },
  detailsContainer: { 
    flexDirection: 'row',
  },
  mainTextContainer: { 
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 5,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});
