// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import moment from 'moment';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';


const getInvoiceStatus = (statusCode) => {
  let status;
  let color = 'transparent';

  if (statusCode >= 70003) {
    status = i18n.t('CustomerInvoiceDetails.index.finished');
    color = theme.SCREEN_COLOR_GREEN;
  }
  else if (statusCode == 70002) {
    status = i18n.t('CustomerInvoiceDetails.index.noDistrbPlan');
    color = theme.SCREEN_COLOR_GREY;
  }
  else if (statusCode == 70001) {
    status = i18n.t('CustomerInvoiceDetails.index.inProgress');
    color = theme.SCREEN_COLOR_BLUE;
  }
  else if (statusCode == 70004) {
    status = i18n.t('CustomerInvoiceDetails.index.canceled');
    color = theme.SCREEN_COLOR_RED;
  }
  else if (statusCode == 7000) {
    status = i18n.t('CustomerInvoiceDetails.index.pending');
    color = theme.SCREEN_COLOR_ORANGE;
  }
  else {
    status = '';
  }
  return { status, color };
};

const getInvoiceSharingType = (sharingType) => {
  let sType;
  switch (sharingType) {
    case 0:
      sType = i18n.t('CustomerInvoiceDetails.index.unknown');
      break;
    case 1:
      sType = i18n.t('CustomerInvoiceDetails.index.print');
      break;
    case 2:
      sType = i18n.t('CustomerInvoiceDetails.index.email');
      break;
    case 3:
      sType = i18n.t('CustomerInvoiceDetails.index.ap');
      break;
    case 4:
      sType = i18n.t('CustomerInvoiceDetails.index.vipps');
      break;
    case 5:
      sType = i18n.t('CustomerInvoiceDetails.index.export');
      break;
    case 6:
      sType = i18n.t('CustomerInvoiceDetails.index.invoicePrint');
      break;
    case 7:
      sType = i18n.t('CustomerInvoiceDetails.index.efaktura');
      break;
    case 8:
      sType = i18n.t('Custo merInvoiceDetails.index.avtalegiro');
      break;
    case 9:
      sType = i18n.t('CustomerInvoiceDetails.index.factoring');
      break;
    default:
      sType = i18n.t('CustomerInvoiceDetails.index.undefined');
  }
  return sType;
};

export const DistributionItem = ({ item, onSelect, index, defaultCurrencyCode = '', onLongPress, isActive }) => {

  let StatusObj = getInvoiceStatus(item.SharingStatusCode);

  return (
    <Touchable onPress={() => onSelect(item)} key={item.SharingID} style={styles.button}>
      <View style={styles.mainTextContainer}>
        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>
            <Text style={[styles.infoTextSubLeft, styles.infoTextMain]}>{`${i18n.t('CustomerInvoiceDetails.index.date')} : ${moment(item.SharingCreatedAt).format('YYYY-MM-DD HH:MM')}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${i18n.t('CustomerInvoiceDetails.index.sharedBy')} : ${item.UserDisplayName == null ? '' : item.UserDisplayName}`}</Text>
            <Text style={styles.infoTextSubLeft}>{`${i18n.t('CustomerInvoiceDetails.index.status')} : `}<Text style={[{ color: StatusObj.color }]}>{`${StatusObj.status}`}</Text></Text>
          </View>
        </View>
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
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingLeft: 0,
    paddingVertical: 5,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 12,
    paddingTop: 10,
  },
  infoTextSubLeft: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingTop: 5,
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 0,
  },

});

