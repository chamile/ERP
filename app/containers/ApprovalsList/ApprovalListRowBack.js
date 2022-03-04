// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from '../../components/CustomIcon';

import i18n from '../../i18n/i18nConfig';
import { theme } from '../../styles';

export const ApprovalListRowBack = ({ rowData, rowMap, approveApproval, rejectApproval, sectionKey, actionPendingRowsApprove, actionPendingRowsReject}) => {
  return (
    <View style={styles.rowBack}>
      <View style={[styles.quickActionButtonsBox, styles.rightQuickPanel]}>
        <TouchableOpacity
          style={[styles.quickActionButtons, styles.btnApprove]}
          onPress={() => {
            approveApproval(
              rowData, rowMap,
              i18n.t('ApprovalsList.ApprovalListRowBack.confirm'),
              i18n.t('ApprovalsList.ApprovalListRowBack.sure'),
              i18n.t('ApprovalsList.ApprovalListRowBack.approve'),
              i18n.t('ApprovalsList.ApprovalListRowBack.cancel'),
              rowData.item.ID,
              sectionKey,
            );
          }}
        >
          {actionPendingRowsApprove.has(`${rowData.item.ID}${sectionKey}`) ? 
          <ActivityIndicator animating={true} color="#fff" size="small" />
          : <Icon name="md-checkmark" size={20} color="#FFFFFF" />}
          <Text style={styles.quickActionButtonText}>{i18n.t('ApprovalsList.ApprovalListRowBack.approve')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButtons, styles.btnDelete]}
          onPress={() => {
            rejectApproval(
              rowData, rowMap,
              i18n.t('ApprovalsList.ApprovalListRowBack.confirm'),
              i18n.t('ApprovalsList.ApprovalListRowBack.sure'),
              i18n.t('ApprovalsList.ApprovalListRowBack.reject'),
              i18n.t('ApprovalsList.ApprovalListRowBack.cancel'),
              rowData.item.ID,
              sectionKey,
            );
          }}
        >
          {actionPendingRowsReject.has(`${rowData.item.ID}${sectionKey}`) ? 
          <ActivityIndicator animating={true} color="#fff" size="small" />
          : <Icon name="md-close" size={20} color="#FFFFFF" />}
          <Text style={styles.quickActionButtonText}>{i18n.t('ApprovalsList.ApprovalListRowBack.reject')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#eaeaea'
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
  btnApprove: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREEN,
  },
  btnDelete: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_RED,
  },
  quickActionButtonText: {
    color: '#fff',
    fontWeight: '500'
  },
  rightQuickPanel: {
    flexDirection: 'row',
    width: 160
  }
});
