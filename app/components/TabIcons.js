import React from 'react';
import { Platform } from 'react-native';
import Icon from '../components/CustomIcon';
import IconWithApprovalBadge from './IconWithApprovalBadge';
import IconWithNotificationBadge from './IconWithNotificationBadge';
import { theme } from '../styles';

const Styles = {
    container: {},
    badgeBackground: {
      width: 15,
      borderRadius: 50,
      zIndex: 10,
      height: 15,
      backgroundColor: '#FE3824',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      left: 8
    },
    badgeCount: {
      backgroundColor: 'rgba(0,0,0,0)',
      color: '#fff',
      fontSize: 10,
      fontWeight: '800'
    },
    iconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -4
    },
    iconStyle: { 
      alignSelf: 'center'
    }
}

const AccountingActive = <Icon name="ios-copy" size={Platform.OS === 'android' ? 25 : 30} color={theme.TAB_ICON_COLOR} style={Styles.iconStyle} />;
const AccountingInactive =  <Icon name="ios-copy-outline" size={Platform.OS === 'android' ? 25 : 30} color={theme.DISABLED_ITEM_COLOR}  style={Styles.iconStyle} />;

const SalesActive = <Icon name="ios-paper" size={Platform.OS === 'android' ? 24 : 28} color={theme.TAB_ICON_COLOR}  style={Styles.iconStyle} />;
const SalesInactive =  <Icon name="ios-paper-outline" size={Platform.OS === 'android' ? 24 : 28} color={theme.DISABLED_ITEM_COLOR}  style={Styles.iconStyle} />;

const HoursActive = <Icon name="ios-time" size={Platform.OS === 'android' ? 24 : 28} color={theme.TAB_ICON_COLOR}  style={Styles.iconStyle} />;
const HoursInactive = <Icon name="ios-time-outline" size={Platform.OS === 'android' ? 24 : 28} color={theme.DISABLED_ITEM_COLOR}  style={Styles.iconStyle} />;

const ApprovalsActive = Platform.OS === 'android' ? <IconWithApprovalBadge name="ios-checkmark-circle" size={24} color={theme.TAB_ICON_COLOR} containerStyle={Styles.container} iconContainerStyle={Styles.iconContainer} badgeBackgroundStyle={Styles.badgeBackground} badgeCountStyle={Styles.badgeCount} />
    : <IconWithApprovalBadge name="ios-checkmark-circle" size={28} color={theme.TAB_ICON_COLOR} />;
const ApprovalsInactive = Platform.OS === 'android' ? <IconWithApprovalBadge name="ios-checkmark-circle-outline" size={24} color={theme.DISABLED_ITEM_COLOR} containerStyle={Styles.container} iconContainerStyle={Styles.iconContainer} badgeBackgroundStyle={Styles.badgeBackground} badgeCountStyle={Styles.badgeCount} />
    : <IconWithApprovalBadge name="ios-checkmark-circle-outline" size={28} color={theme.DISABLED_ITEM_COLOR} />;

const NotificationActive = Platform.OS === 'android' ? <IconWithNotificationBadge name="ios-notifications" size={25} color={theme.TAB_ICON_COLOR} containerStyle={Styles.container} iconContainerStyle={Styles.iconContainer} badgeBackgroundStyle={Styles.badgeBackground} badgeCountStyle={Styles.badgeCount} />
    : <IconWithNotificationBadge name="ios-notifications" size={29} color={theme.TAB_ICON_COLOR} />;
const NotificationInactive = Platform.OS === 'android' ? <IconWithNotificationBadge name="ios-notifications-outline" size={25} color={theme.DISABLED_ITEM_COLOR} containerStyle={Styles.container} iconContainerStyle={Styles.iconContainer} badgeBackgroundStyle={Styles.badgeBackground} badgeCountStyle={Styles.badgeCount} />
    : <IconWithNotificationBadge name="ios-notifications-outline" size={29} color={theme.DISABLED_ITEM_COLOR} />;

export default {
    AccountingActive,
    AccountingInactive,
    SalesActive,
    SalesInactive,
    HoursActive,
    HoursInactive,
    ApprovalsActive,
    ApprovalsInactive,
    NotificationActive, 
    NotificationInactive
};
