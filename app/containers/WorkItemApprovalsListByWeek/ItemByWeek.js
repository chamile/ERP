/* eslint-disable import/prefer-default-export */
// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';
import Icon from '../../components/CustomIcon';

import i18n from '../../i18n/i18nConfig';
import { theme } from '../../styles';
import { TimesheetWorkflow } from '../../constants/TimesheetConstants';

const _processStatus = (status) => {
  let iconName = '';
  let iconSize = 12;
  let text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.noRecordsAdded');
  let color = theme.SCREEN_COLOR_LIGHT_GREY_2;
  switch (status) {
    case TimesheetWorkflow.DRAFT:
      iconName = 'ios-brush-outline';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.draft');
      color = theme.SCREEN_COLOR_LIGHT_GREY_2;
      iconSize = 13;
      break;
    case TimesheetWorkflow.PARTIAL_ASSIGN:
      iconName = 'ios-list-box-outline';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.partlyAssign');
      color = theme.SCREEN_COLOR_ORANGE;
      iconSize = 13;
      break;
    case TimesheetWorkflow.AWAITING_APPROVAL:
      iconName = 'ios-refresh-outline';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.waitingForApproval');
      color = theme.SCREEN_COLOR_YELLOW;
      iconSize = 15;
      break;
    case TimesheetWorkflow.PARTIAL_REJECT:
      iconName = 'ios-remove-circle-outline';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.partialReject');
      color = theme.SCREEN_COLOR_LIGHT_RED;
      iconSize = 12;
      break;
    case TimesheetWorkflow.PARTIAL_APPROVAL:
      iconName = 'ios-checkmark-circle-outline';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.partialApproval');
      color = theme.SCREEN_COLOR_LIGHT_PURPLE;
      iconSize = 12;
      break;
    case TimesheetWorkflow.REJECTED:
      iconName = 'ios-remove-circle';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.rejected');
      color = theme.SCREEN_COLOR_LIGHT_RED;
      iconSize = 12;
      break;
    case TimesheetWorkflow.APPROVED:
      iconName = 'ios-checkmark-circle';
      text = i18n.t('WorkItemApprovalsListByWeek.itemByWeek.approved');
      color = theme.SCREEN_COLOR_LIGHT_GREEN_1;
      iconSize = 12;
      break;
    default:
      break;
  }
  return {
    iconName,
    text,
    color,
    iconSize,
  };
};

export const ItemByWeek = ({ item, onSelectSend, showCommentIcon }) => {
  const processedStatus = _processStatus(item.status);
  return (
    <View style={styles.buttonStyle}>
      <TouchableHighlight style={styles.touch} underlayColor={'transparent'} onPress={() => onSelectSend(item)}>
        <React.Fragment>
          {showCommentIcon ? <Icon style={styles.commentIcon} name={'comment'} size={13} color={theme.SCREEN_COLOR_LIGHT_GREY_2} /> : null}
          <View style={[styles.statusBar, { backgroundColor: processedStatus.color }]} />
          <View style={styles.mainTextContainer}>
            <View style={styles.detailsContainer}>
              <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode="tail">
                <Icon name="ios-calendar-outline" size={23} color={theme.PRIMARY_TEXT_COLOR} />
                <Text>  {item.startDate.format('DD MMM')} - {item.endDate.format('DD MMM')}</Text>
              </Text>
              <Text style={[item.isTotalTimeLTExpected ? styles.lessHours : styles.amount, styles.textRight]}>{new Intl.NumberFormat(i18n.language).format(item.totalValidTime)} {i18n.t('App.hour')}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.infoLeft}>
                <Text style={styles.infoText}>{i18n.t('WorkItemApprovalsListByWeek.itemByWeek.week')} {item.weekNo}</Text>
              </View>
              <View style={styles.infoRight}>
                {((item.status === TimesheetWorkflow.PARTIAL_ASSIGN) || (item.status === TimesheetWorkflow.PARTIAL_APPROVAL && item.pendingHours > 0))
                  ? <Text style={styles.pendingAmount}><Icon name="ios-notifications" size={14} color={theme.SCREEN_COLOR_YELLOW} /> {!(i18n.language.includes('nb') || i18n.language.includes('nn')) ? i18n.t('WorkItemApprovalsListByWeek.itemByWeek.pending') : ''} <Text style={styles.pendingAmountVal}>{new Intl.NumberFormat(i18n.language).format(item.pendingHours)} {i18n.t('App.hour')}</Text>{i18n.language.includes('nb') || i18n.language.includes('nn') ? ` ${i18n.t('WorkItemApprovalsListByWeek.itemByWeek.pending')}` : ''}</Text>
                  : (
                    <Text style={[styles.infoTextStatus, { color: processedStatus.color }]}>
                      <Icon name={processedStatus.iconName} size={processedStatus.iconSize} color={processedStatus.color} />{` ${processedStatus.text}`}
                    </Text>
                  )}
              </View>
            </View>
          </View>
        </React.Fragment>
      </TouchableHighlight>
    </View>
  );
};


const styles = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginTop: 12,
  },
  infoLeft: {
    flex: 1,
    paddingVertical: 8,
  },
  infoRight: {
    flex: 1,
    paddingRight: 15,
    paddingVertical: 8,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '500',
    fontSize: 17,
    paddingLeft: 10,
    flex: 1,
  },
  infoTextButtons: {
    color: theme.SYSTEM_COLOR_LIGHT_BLUE,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoTextStatus: {
    color: theme.SYSTEM_COLOR_LIGHT_GRAY_3,
    fontSize: 12,
    textAlign: 'right',
  },
  infoText: {
    color: theme.SYSTEM_COLOR_LIGHT_GRAY_3,
    fontWeight: '400',
    fontSize: 13,
    paddingLeft: 10,
  },
  statusBar: {
    width: 6,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    marginTop: 0,
  },
  amountContainer: {
    flexDirection: 'row',
  },
  detailsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 5,
    paddingVertical: 15,
    backgroundColor: theme.SYSTEM_COLOR_WHITE
  },
  lessHours: {
    color: theme.SYSTEM_COLOR_LIGHT_RED,
    fontWeight: '400',
    fontSize: 19,
    alignSelf: 'flex-end',
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    fontSize: 19,
    alignSelf: 'flex-end',
  },
  pendingAmount: {
    color: theme.SCREEN_COLOR_GREY,
    fontSize: 12,
    textAlign: 'right',
  },
  pendingAmountVal: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '600',
  },
  textRight: {
    flex: 1,
    paddingRight: 15,
    textAlign: 'right',
  },
  touch: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  commentIcon: {
    position: 'absolute',
    zIndex: 4,
    right: 5,
    top: 5,
  },
});
