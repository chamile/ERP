import BadgeAndroid from 'react-native-android-badge';
import { PushNotificationIOS, Platform } from 'react-native';
import ApiBuilder from '../helpers/ApiBuilder';

const _setCount = Platform.select({
  ios: () => PushNotificationIOS.setApplicationIconBadgeNumber,
  android: () => BadgeAndroid.setBadge,
})();

const setApplicationBadgeCount = (count) => {
  _setCount(count)
};

const registerForNotifications = (deviceToken, globalUserId) => {
  return ApiBuilder.PUSH_ADAPTOR.post('api/devices',
    {
      DeviceToken: deviceToken,
      UserIdentity: globalUserId
    },
    { headers: {} });
};

const getNotifications = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/notifications?top=${pageSize}&orderby=ID desc,CreatedAt asc,CreatedBy&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getNotificationCount = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/notifications?action=count',
    { headers: { 'CompanyKey': companyKey } });
};

const deleteNotification = (companyKey, notificationId = 0) => {
  return ApiBuilder.API.delete(`/api/biz/notifications/${notificationId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const markNotificationAsRead = (companyKey, notificationId = 0) => {
  return ApiBuilder.API.put(`/api/biz/notifications/${notificationId}?action=mark-as-read`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const markNotificationAsUnread = (companyKey, notificationId = 0) => {
  return ApiBuilder.API.put(`/api/biz/notifications/${notificationId}?action=mark-as-unread`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const getNotificationsByType = (notificationType,companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/notifications?filter=SourceEntityType eq '${notificationType}' &top=${pageSize}&orderby=ID desc,CreatedAt asc,CreatedBy&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};
const getAllAprovalsNotification = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`api/biz/notifications?filter=SourceEntityType eq  'WorkItemGroup' or  SourceEntityType eq 'SupplierInvoice' &top=${pageSize}&orderby=ID desc,CreatedAt asc,CreatedBy&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};
const getAllNewNotifications = (StatusCode, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/notifications?filter= StatusCode eq ${StatusCode}`,
    { headers: { 'CompanyKey': companyKey } });
};


export default {
  getNotifications,
  getNotificationCount,
  deleteNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  registerForNotifications,
  setApplicationBadgeCount,
  getAllNewNotifications,
  getAllAprovalsNotification,
  getNotificationsByType,
  
};
