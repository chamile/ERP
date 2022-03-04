// @flow
import React from 'react';
import {
    ActivityIndicator,
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import Icon from '../../components/CustomIcon';

import i18n from '../../i18n/i18nConfig';
import { theme } from '../../styles';

export const ItemListRowBack = ({rowData, rowId, rowMap, editItem, deleteItem, deletingRows, actionButtonIndex}) => {
  return (
    <View style={styles.rowBack}>
      <View />
      <View style={[styles.quickActionButtonsBox, styles.rightQuickPanel]}>
        <TouchableOpacity
          style={[styles.quickActionButtons, styles.btnEdit]}
          onPress={() => { editItem(rowData.ID, rowData, rowId, rowMap); }}
        >
          {deletingRows.has(rowData.ID) && actionButtonIndex === 0 ?
            <ActivityIndicator animating={true} color="#fff" size="small" /> :
            <Icon name="ios-create-outline" size={22} color="#FFFFFF" />
          }
          <Text style={styles.quickActionButtonText}>{i18n.t('CustomerInvoiceDetails.itemListRow.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButtons, styles.btnDelete]}
          onPress={() => { deleteItem(rowData.ID, rowData, rowId, rowMap); }}
        >
          {deletingRows.has(rowData.ID) && actionButtonIndex === 1 ?
            <ActivityIndicator animating={true} color="#fff" size="small" /> :
            <Icon name="md-close" size={20} color="#FFFFFF" />
            }
          <Text style={styles.quickActionButtonText}>{i18n.t('CustomerInvoiceDetails.itemListRow.delete')}</Text>
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
  btnEdit: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE,
  },
  btnDelete: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_RED,
  },
  quickActionButtonText: {
    color: '#fff',
    fontWeight: '500',
    paddingTop: 1
  },
  rightQuickPanel: {
    flexDirection: 'row',
    width: 160
  }
});