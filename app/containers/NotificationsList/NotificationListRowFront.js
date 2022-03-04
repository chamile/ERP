// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight
} from 'react-native';
import TimeAgo from 'react-native-timeago';
import Image from '../../components/CustomIcon';

import { NotificationStatusCodes } from '../../constants/NotificationConstants';
import { theme } from '../../styles';

export const NotificationListRowFront = ({ rowData, rowMap, onSelect }) => {
  return (
    <TouchableHighlight onPress={() => onSelect(rowData, rowMap)} underlayColor={theme.SCREEN_COLOR_LIGHT_GREY_1}>
      <View style={[styles.rowFront]}>
        <View style={[styles.rowContainer, rowData.item.StatusCode && rowData.item.StatusCode === NotificationStatusCodes.NEW ? styles.newNotificationColor : null]}>
          <View style={styles.newIconContainer}>
            {renderNewNotificationIndicator(rowData)}
          </View>

          <View style={styles.labelsContainer}>
            <View style={styles.topLabelsContainer}>
              <View style={styles.companyNameContainer}>
                <Text style={styles.companyNameLabel}>{rowData.item.CompanyName}</Text>
              </View>
              <View style={styles.timestampContainer}>
                <Text style={styles.timestampLabel}><TimeAgo time={rowData.item.CreatedAt}></TimeAgo></Text>
              </View>
            </View>
            <Text style={styles.messageLabel} ellipsizeMode={'tail'} numberOfLines={2}>{rowData.item.Message}</Text>
            <View style={styles.senderLabelContainer}>
              <Text style={styles.senderLabel}>{rowData.item.SenderDisplayName}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

const getRelavantIcon = (SourceEntityType) => {

  switch (SourceEntityType) {
    case 'WorkItemGroup':
      return (
        <View style={[styles.icon, { backgroundColor: theme.SCREEN_COLOR_LIGHT_GREEN }]}>
          <Image name={'md-time'} size={23} color={theme.SYSTEM_COLOR_WHITE} style={styles.iconStyle} />
        </View>
      );
      break;
    case 'SupplierInvoice':
      return (
        <View style={[styles.icon, { backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1 }]}>
          <Image name={'library-books'} size={23} color={theme.SYSTEM_COLOR_WHITE} style={styles.iconStyle} />
        </View>
      );
      break;
    case 'File':
      return (
        <View style={[styles.icon, { backgroundColor: theme.SCREEN_COLOR_LIGHT_PURPLE }]}>
          <Image name={'md-image'} size={23} color={theme.SYSTEM_COLOR_WHITE} style={styles.iconStyle} />

        </View>);
      break;
    case 'Comment':
      return (
        <View style={[styles.icon, { backgroundColor: theme.SCREEN_COLOR_YELLOW }]}>
          <Image name={'comment'} size={23} color={theme.SYSTEM_COLOR_WHITE} style={styles.iconStyle} />
        </View>
      );
      break;
  }

}

const renderNewNotificationIndicator = (rowData) => {
  return (
    <View>
      {
        getRelavantIcon(rowData.item.SourceEntityType)
      }
    </View>
  );
};

const styles = StyleSheet.create({
  newNotificationColor: {
    backgroundColor: '#edf3ff'
  },
  rowFront: {
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderBottomColor: 'rgba(50,50,50,0.1)',
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 15,
    paddingRight: 15,
    paddingLeft: 6,
    minHeight: '75%',
    maxHeight: '100%',
  },
  newIconContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  topLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 5
  },
  companyNameContainer: {
    flex: 2
  },
  timestampContainer: {
    alignItems: 'flex-end',
    flex: 1
  },
  newNotificationIndicator: {
    width: 10,
    height: 10,
    backgroundColor: '#0076FF',
    borderRadius: 100
  },
  labelsContainer: {
    flex: 5
  },
  companyNameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.PRIMARY_COLOR
  },
  timestampLabel: {
    fontSize: 12,
    color: theme.SECONDARY_TEXT_COLOR
  },
  messageLabel: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.PRIMARY_TEXT_COLOR
  },
  senderLabel: {
    fontSize: 12,
    lineHeight: 23,
    fontWeight: '400',
    color: theme.SECONDARY_TEXT_COLOR
  },
  senderLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  iconStyle: {
    marginLeft: 1,
    marginTop: 1,
  },
  icon: {
    height: 40,
    width: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
