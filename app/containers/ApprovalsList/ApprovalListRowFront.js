// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableHighlight
} from 'react-native';
import TimeAgo from 'react-native-timeago';
import Image from '../../components/CustomIcon';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { ApprovalStatusCodes } from '../../constants/ApprovalConstants';

// eslint-disable-next-line import/prefer-default-export
export const ApprovalListRowFront = ({ rowData, rowMap, onSelect, isPendingSection }) => {
  const isEntityTypeHour = rowData.item.Task.Model.Name === 'WorkItemGroup';
  return (
    <TouchableHighlight onPress={ () => onSelect(rowData.item.Task.EntityID, rowData.item.Task.Model.Name, rowData.item, isPendingSection)} underlayColor={theme.SCREEN_COLOR_LIGHT_GREY_1}>
      <View style={styles.rowFront}>
        <View style={styles.rowContainer}>
          <View style={styles.statusBarContainer}>
            <View style={[styles.icon, { backgroundColor: isEntityTypeHour ? theme.SCREEN_COLOR_LIGHT_GREEN : theme.SCREEN_COLOR_LIGHT_BLUE_1 }]}>
              <Image name={isEntityTypeHour ? 'md-time' : 'library-books'} size={23} color={theme.SYSTEM_COLOR_WHITE} style={styles.iconStyle} />
            </View>
          </View>
          <View style={styles.labelsContainer}>
            <View style={styles.topLabelsContainer}>
              <View style={styles.companyNameContainer}>
                <Text ellipsizeMode={'tail'} numberOfLines={2} style={styles.taskTitle}>{rowData.item.Task.Title}</Text>
              </View>
              <View style={styles.timestampContainer}>
                <Text style={styles.timestampLabel}><TimeAgo time={rowData.item.CreatedAt} /></Text>
              </View>
            </View>
            {isPendingSection
              ? <Text style={styles.dateAndAssigner}>{`${i18n.t('ApprovalsList.ApprovalListRowFront.awarded')} ${rowData.item.Task.User.DisplayName}`}</Text>
              : (
                <View style={Platform.OS === 'ios' ? styles.bottomTextContainerIOS : styles.bottomTextContainerAndroid}>
                  <Text style={styles.dateAndAssigner}>{`${i18n.t('ApprovalsList.ApprovalListRowFront.awarded')} ${rowData.item.Task.User.DisplayName}`}</Text>
                  {renderStatusText(rowData.item.StatusCode)}
                </View>
              )
            }
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};


renderStatusText = (StatusCode) => {
  if (StatusCode === ApprovalStatusCodes.ACTIVE) {
    return (
      <Text style={styles.statusTextPending}>{i18n.t('ApprovalsList.ApprovalListRowFront.pending')}</Text>
    );
  } else if (StatusCode === ApprovalStatusCodes.APPROVED) {
    return (
      <Text style={styles.statusTextApproved}>
        {i18n.t('ApprovalsList.ApprovalListRowFront.approved')}
      </Text>
    );
  } else if (StatusCode === ApprovalStatusCodes.REJECTED) {
    return (
      <Text style={styles.statusTextRejected}>
        {i18n.t('ApprovalsList.ApprovalListRowFront.rejected')}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  rowFront: {
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderBottomColor: 'rgba(50,50,50,0.1)',
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: 75,
    flex: 1,
    padding: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'stretch',
  },
  statusBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabelsContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  companyNameContainer: {
    flex: 2,
  },
  statusBarPending: {
    width: 3,
    flex: 1,
    backgroundColor: theme.SCREEN_COLOR_BLUE,
  },
  statusBarApproved: {
    width: 3,
    flex: 1,
    backgroundColor: theme.SCREEN_COLOR_GREEN,
  },
  statusBarRejected: {
    width: 3,
    flex: 1,
    backgroundColor: theme.SCREEN_COLOR_RED,
  },
  timestampContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  labelsContainer: {
    flex: 7,
    justifyContent: 'space-around',
    paddingLeft: 10,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.PRIMARY_COLOR,
  },
  timestampLabel: {
    fontSize: 11.5,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'right'
  },
  dateAndAssigner: {
    flex: 3,
    fontSize: 12.5,
    color: theme.PRIMARY_TEXT_COLOR,
    marginBottom: 5,
    marginTop: 5,
  },
  bottomTextContainerIOS: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomTextContainerAndroid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusTextPending: {
    flex: 1,
    color: theme.SCREEN_COLOR_BLUE,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  statusTextApproved: {
    flex: 1,
    color: theme.SCREEN_COLOR_GREEN,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  statusTextRejected: {
    flex: 1,
    color: theme.SCREEN_COLOR_RED,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  icon: {
    height: 40,
    width: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    marginLeft: 1,
    marginTop: 1,
  },
});
