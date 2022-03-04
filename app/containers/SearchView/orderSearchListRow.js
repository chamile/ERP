// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import moment from 'moment';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { OrderStatusCodes } from '../../constants/OrderConstants';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const OrderSearchListRow = ({ item, index, onSelect, companyKey }) => {
  const _processStatus = (status) => {
    let text = null;
    let color = 'transparent';
    switch (status) {
      case OrderStatusCodes.DRAFT: {
        text = i18n.t('OrderList.OrderListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
        break;
      }
      case OrderStatusCodes.REGISTERED: {
        text = i18n.t('OrderList.OrderListRow.registered');
        color = theme.SCREEN_COLOR_BLUE;
        break;
      }
      case OrderStatusCodes.PARTIALLY_TRANSFERRED_TO_INVOICE: {
        text = i18n.t('OrderList.OrderListRow.partlyTransferredToInvoice');
        color = theme.SCREEN_COLOR_RED;
        break;
      }
      case OrderStatusCodes.TRANSFERRED_TO_INVOICE: {
        text = i18n.t('OrderList.OrderListRow.transferredToInvoice');
        color = theme.SCREEN_COLOR_PURPLE;
        break;
      }
      case OrderStatusCodes.COMPLETED: {
        text = i18n.t('OrderList.OrderListRow.completed');
        color = theme.SCREEN_COLOR_GREEN;
        break;
      }
      default: {
        text = i18n.t('OrderList.OrderListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
      }
    }
    return { text, color };
  };

  const _processDate = (date) => {
    return moment(date).format('YYYY-MM-DD');
  };

  const StatusObj = _processStatus(item.CustomerOrderStatusCode);

  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={[styles.statusBar, StatusObj.color ? { backgroundColor: StatusObj.color } : {}]} />
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.InfoName) ? item.InfoName : i18n.t('OrderList.OrderListRow.unknown')}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>

            <Text style={styles.infoText}>{`${item.CustomerCustomerNumber ? item.CustomerCustomerNumber : `${i18n.t('OrderList.OrderListRow.customer')  } -`}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${i18n.t('OrderList.OrderListRow.order')} ${item.OrderNumber ? `- ${  item.OrderNumber}` : '-'} ${item.CustomerOrderOrderDate ? `on ${  _processDate(item.CustomerOrderOrderDate)}` : ''}`}</Text>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.amountContainer}>
              <Text>
                <Text style={styles.amount}>{FormatNumber(item.CustomerOrderTaxInclusiveAmount, i18n.language)}</Text>
                <Text style={styles.currencyCode}> {item.CurrencyCodeCode ? item.CurrencyCodeCode : ''}</Text>
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
    height: 80,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5
  },
  infoRight: {
    flex: 2,
    padding: 5,
    justifyContent: 'space-around',
    alignItems: 'flex-end'
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 15,
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
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400'
  },
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 17,
    marginTop: -3
  },
  amountContainer: {
    flexDirection: 'row',
  },
  detailsContainer: {
    flexDirection: 'row'
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 5
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});
