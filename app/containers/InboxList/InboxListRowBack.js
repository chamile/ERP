// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import i18n from '../../i18n/i18nConfig'

export const InboxListRowBack =  ({ rowData, rowMap, deletingRows, deleteItem }) => {
  return (
      <View style={styles.rowBack}>
        <View style={styles.leftQuickPanel}/>
        <View style={[styles.quickActionButtonsBox, styles.rightQuickPanel]}>
          <TouchableOpacity style={styles.quickActionButtons} onPress={() => { deleteItem(rowData, rowMap); }}>
            {deletingRows.has(rowData.item.ID) ?
              <ActivityIndicator animating={true} color="#fff" size="small" /> :
              <Text style={styles.quickActionButtonText}>{i18n.t('InboxList.InboxListRowBack.delete')}</Text>
            }
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
    backgroundColor: 'white',
    width: 120
  },
  rightQuickPanel: {
    backgroundColor: '#FF3B30',
    width: 80
  }
});