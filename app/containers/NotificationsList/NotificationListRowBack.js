// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Icon from '../../components/CustomIcon';

import i18n from '../../i18n/i18nConfig';
import { NotificationStatusCodes } from '../../constants/NotificationConstants';
import { theme } from '../../styles';

export const NotificationListRowBack =  ({ rowData, rowMap, deletingRows, readToggleNotification, deleteNotification }) => {
  return (
      <View style={styles.rowBack}>
        <View style={[styles.quickActionButtonsBox, styles.leftQuickPanel]}>
          <TouchableOpacity style={styles.quickActionButtons} onPress={() => { readToggleNotification(rowData, rowMap); }}>
            <View style={[styles.unreadIcon, rowData.item.StatusCode === NotificationStatusCodes.NEW ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }]}></View>
            <Text style={styles.quickActionButtonText}>{rowData.item.StatusCode === NotificationStatusCodes.NEW ? i18n.t('NotificationsList.NotificationListRowBack.markAsRead') : i18n.t('NotificationsList.NotificationListRowBack.markAsUnread')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.quickActionButtonsBox, styles.rightQuickPanel]}>
          <TouchableOpacity style={styles.quickActionButtons} onPress={() => { deleteNotification(rowData, rowMap); }}>
            {deletingRows.has(rowData.item.ID) ?
              <ActivityIndicator animating={true} color="#fff" size="small" /> :
              <Icon name="md-close" size={20} color="#FFFFFF" />
            }
            <Text style={styles.quickActionButtonText}>{i18n.t('NotificationsList.NotificationListRowBack.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eaeaea',
    minHeight: '75%',
    maxHeight: '100%',
  },
  quickActionButtonsBox: {
    width: 50,
    justifyContent: 'center',
    backgroundColor: '#d8d8d8'
  },
  quickActionButtons: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quickActionButtonText: {
    color: '#fff',
    fontWeight: '500'
  },
  unreadIcon: {
    width: 12,
    height: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8
  },
  leftQuickPanel: {
    backgroundColor: theme.PRIMARY_COLOR,
    width: 120
  },
  rightQuickPanel: {
    backgroundColor: '#FF3B30',
    width: 80
  }
});