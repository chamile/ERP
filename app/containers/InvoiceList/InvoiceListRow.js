// @flow
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import { theme } from '../../styles';
import { getImageLink } from '../../helpers/APIUtil';
import i18n from '../../i18n/i18nConfig';
import { InvoiceStatusCodes } from '../../constants/InvoiceConstants';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const InvoiceListRow = ({ item, index, onSelect, fileServerToken, fileServerTokenUpdatedTimeStamp, companyKey }) => {

  const _getItemStatus = (status) => {
    let text = null;
    let color = 'transparent';

    switch (status) {
      case InvoiceStatusCodes.NEW: {
        text = i18n.t('InvoiceList.InvoiceListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
        break;
      }
      case InvoiceStatusCodes.FOR_APPROVAL: {
        text = i18n.t('InvoiceList.InvoiceListRow.forApproval');
        color = theme.SCREEN_COLOR_ORANGE;
        break;
      }
      case InvoiceStatusCodes.APPROVED: {
        text = i18n.t('InvoiceList.InvoiceListRow.approved');
        color = theme.SCREEN_COLOR_GREEN;
        break;
      }
      case InvoiceStatusCodes.DELETED: {
        text = i18n.t('InvoiceList.InvoiceListRow.deleted');
        color = theme.SCREEN_COLOR_PINK_RED;
        break;
      }
      case InvoiceStatusCodes.JOURNALED: {
        text = i18n.t('InvoiceList.InvoiceListRow.journaled');
        color = theme.SCREEN_COLOR_LIGHT_PURPLE;
        break;
      }
      case InvoiceStatusCodes.TO_PAYMENT: {
        text = i18n.t('InvoiceList.InvoiceListRow.toPayment');
        color = theme.SCREEN_COLOR_BLUE;
        break;
      }
      case InvoiceStatusCodes.PARTLY_PAID: {
        text = i18n.t('InvoiceList.InvoiceListRow.partlyPaid');
        color = theme.SCREEN_COLOR_PURPLE;
        break;
      }
      case InvoiceStatusCodes.PAID: {
        text = i18n.t('InvoiceList.InvoiceListRow.paid');
        color = theme.SCREEN_COLOR_LIGHT_GREEN;
        break;
      }
      case InvoiceStatusCodes.REJECTED: {
        text = i18n.t('InvoiceList.InvoiceListRow.rejected');
        color = theme.SCREEN_COLOR_LIGHT_RED;
        break;
      }
      case InvoiceStatusCodes.COMPLETED: {
        text = i18n.t('InvoiceList.InvoiceListRow.completed');
        color = theme.SCREEN_COLOR_NAVY_BLUE;
        break;
      }
      default: {
        text = i18n.t('InvoiceList.InvoiceListRow.draft');
        color = theme.SCREEN_COLOR_GREY;
      }
    }
    return { text, color };
  };

  let StatusObj = _getItemStatus(item.Status);

  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={[styles.statusBar, StatusObj.color ? { backgroundColor: StatusObj.color } : {}]} />
      <View style={styles.infoLeft}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.SupplierName) ? item.SupplierName.trim() : i18n.t('InvoiceList.InvoiceListRow.unknown')}</Text>
        <Text style={styles.infoText}>{`${i18n.t('InvoiceList.InvoiceListRow.invoice')} ${item.InvoiceNumber !== null ? item.InvoiceNumber : i18n.t('InvoiceList.InvoiceListRow.notSpecified')}`}</Text>
        <Text style={styles.infoTextSub}>{`${i18n.t('InvoiceList.InvoiceListRow.documentNo')} ${item.fileID ? item.fileID : '-'}`}</Text>
        <View style={styles.bottomLine}>
          <View>
            <Text style={[styles.infoText, StatusObj.color ? { color: StatusObj.color, fontWeight: '600' } : {}]}>{`${StatusObj.text}`}</Text>
          </View>
          <View style={styles.bottomLine_right}>
            <Text>
              <Text style={[styles.infoTextSub, styles.currency]}>{FormatNumber(item.Amount)}</Text>
              <Text style={styles.currencyCode}> {item.CurrencyCode}</Text>
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.infoRight}>
        <Image style={styles.infoThumbnail} source={getImageLink(item.fileRef, companyKey, fileServerToken, fileServerTokenUpdatedTimeStamp, true)} />
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10
  },
  invoiceStatusSec: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomLine: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center'
  },
  bottomLine_right: {
    paddingRight: 5,
  },
  button: {
    height: 90,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 10
  },
  infoRight: {
    width: 80,
    backgroundColor: 'rgba(200,200,200,0.1)',
    padding: 5,
    justifyContent: 'center'
  },
  infoThumbnail: {
    width: 70,
    borderRadius: 5,
    height: 70,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 15,
    paddingTop: 5
  },
  infoTextSub: {
    color: theme.SECONDARY_TEXT_COLOR,
    paddingTop: 3,
    fontSize: 12,
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
    paddingTop: 3,
    fontSize: 12,
  },
  currency: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '800',
    fontSize: 15,
  },
  currencyCode: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 13,
  },
});
