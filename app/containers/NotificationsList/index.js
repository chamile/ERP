// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { TabView, TabBar } from 'react-native-tab-view';
import { NavigationActions } from 'react-navigation';
import { NotificationStatusCodes, NotificationTypes } from '../../constants/NotificationConstants';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import NotificationService from '../../services/NotificationService';
import { DrawerIcon } from '../../components/DrawerIcon';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { incrementUnreadNotificationCount, updateUnreadNotificationCount, decrementUnreadNotificationCount } from '../../actions/notificationActions';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import SingleTabView from './SingleTabView';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import { AlertType } from '../../constants/AlertTypes';
import ApprovalService from '../../services/ApprovalService';
import { ApprovalStatusCodes } from '../../constants/ApprovalConstants';
import AlertService from '../../services/AlertService';
import { companySwitch } from '../../helpers/CompanySwitchHelper';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class NotificationsList extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('NotificationsList.index.title'),
      headerLeft: <DrawerIcon />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      fetchNextPage: false,
      isLoading: true, // initial controller
      isRefreshing: false, // pull to refresh controller
      pageSize: 20, // notifications per page
      hasNextPage: false, // check if there is a next page
      allNotifications_hasNextPage: false,
      approvalNorifications_hasNextPage: false,
      commentsNotifications_hasNextPage: false,
      inboxNotifications_hasNextPage: false,
      fetchedNotifications: [], // all fetched notifications
      deletingRows: new Set(),
      selectedIndex: 0,
      index: 0,
      placeHolderIndex: 0,
      routes: [
        { key: NotificationTypes.TAB_KEY_ALL, title: i18n.t('NotificationsList.index.allTab') },
        { key: NotificationTypes.TAB_KEY_APPROVALS, title: i18n.t('NotificationsList.index.approvalsTab') },
        { key: NotificationTypes.TAB_KEY_COMMENTS, title: i18n.t('NotificationsList.index.comments') },
        { key: NotificationTypes.TAB_KEY_INBOX, title: i18n.t('NotificationsList.index.inboxTab') },

      ],
      allPendingNotificationsCount: 0,
      pendingApprovalsCount: 0,
      pendingInboxCount: 0,
      pendingCommentCount: 0,
      allNotifications: [],
      approvalNorifications: [],
      inboxNotifications: [],
      commentsNotifications: []

    };

    this.fetchNotifications = this.fetchNotifications.bind(this);
    this.refreshNotifications = this.refreshNotifications.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.handleNotificationTap = this.handleNotificationTap.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.readToggleNotification = this.readToggleNotification.bind(this);
    this.renderTabs = this.renderTabs.bind(this);
    this.renderLables = this.renderLables.bind(this);
    this.fetchNextAllNotificationPage = this.fetchNextAllNotificationPage.bind(this);
    this.fetchNextInboxNotificationPage = this.fetchNextInboxNotificationPage.bind(this);
    this.fetchNextCommentNotificationPage = this.fetchNextCommentNotificationPage.bind(this);
    this.getRelavantDataset = this.getRelavantDataset.bind(this);
    this.setDataSetAfterDeletion = this.setDataSetAfterDeletion.bind(this);
    this.incOrDecNotificationCount = this.incOrDecNotificationCount.bind(this);
    this.setAllTabselectedItemStatus = this.setAllTabselectedItemStatus.bind(this);
    this.setSpecificTabselectedItem = this.setSpecificTabselectedItem.bind(this);
    this.deleteRowFromSpecificTab = this.deleteRowFromSpecificTab.bind(this);
    this.deleteRowFromAllTab = this.deleteRowFromAllTab.bind(this);
  }

  componentDidMount() {
    this.fetchNotifications(this.refreshNotifications);
  }

  // Infinite scroll
  onEndReached() {
    if (!this.state.fetchNextPage) { // Retrieve next batch of notifications if it has more pages
      this.fetchNextPage(this.onEndReached);
    }
  }

  handleNotificationErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('NotificationsList.index.errorGeneric')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshNotifications() {
    this.setState({ isRefreshing: true });
    this.fetchNotifications(this.refreshNotifications);
    this.props.updateUnreadNotificationCount(this.props.company.selectedCompany.Key);
  }


  fetchNextAllNotificationPage() {
    this.setState({ fetchNextPage: true }, () => {
      const companyKey = this.props.company.selectedCompany.Key;
      NotificationService.getNotifications(companyKey, this.state.allNotifications.length, this.state.pageSize)
        .then((response) => {
          if (response.ok) {
            this.setState({
              allNotifications: [...this.state.allNotifications, ...response.data],
              allNotifications_hasNextPage: (response.data.length === this.state.pageSize),
              fetchNextPage: false
            });
          } else {
            this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
          }
        })
        .catch((error) => {
          this.handleNotificationErrors(error.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
        });
    });
  }

  fetchNextApprovalNotificationPage() {
    this.setState({ fetchNextPage: true }, () => {
      const companyKey = this.props.company.selectedCompany.Key;
      NotificationService.getAllAprovalsNotification(companyKey, this.state.approvalNorifications.length, this.state.pageSize)
        .then((response) => {
          if (response.ok) {
            this.setState({
              approvalNorifications: [...this.state.approvalNorifications, ...response.data],
              approvalNorifications_hasNextPage: (response.data.length === this.state.pageSize),
              fetchNextPage: false
            });
          } else {
            this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
          }
        })
        .catch((error) => {
          this.handleNotificationErrors(error.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
        });
    });
  }

  fetchNextInboxNotificationPage() {
    this.setState({ fetchNextPage: true }, () => {
      const companyKey = this.props.company.selectedCompany.Key;
      NotificationService.getNotificationsByType('File', companyKey, this.state.inboxNotifications.length, this.state.pageSize)
        .then((response) => {
          if (response.ok) {
            this.setState({
              inboxNotifications: [...this.state.inboxNotifications, ...response.data],
              inboxNotifications_hasNextPage: (response.data.length === this.state.pageSize),
              fetchNextPage: false
            });
          } else {
            this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
          }
        })
        .catch((error) => {
          this.handleNotificationErrors(error.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
        });
    });
  }

  fetchNextCommentNotificationPage() {
    this.setState({ fetchNextPage: true }, () => {
      const companyKey = this.props.company.selectedCompany.Key;
      NotificationService.getNotificationsByType('File', companyKey, this.state.commentsNotifications.length, this.state.pageSize)
        .then((response) => {
          if (response.ok) {
            this.setState({
              commentsNotifications: [...this.state.commentsNotifications, ...response.data],
              commentsNotifications_hasNextPage: (response.data.length === this.state.pageSize),
              fetchNextPage: false
            });
          } else {
            this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
          }
        })
        .catch((error) => {
          this.handleNotificationErrors(error.problem, caller, i18n.t('NotificationsList.index.fetchMoreNotificationsError'));
        });
    });
  }

  fetchNextPage(caller) {
    switch (this.state.index) {
      case Tabs.ALL:
        if (this.state.allNotifications_hasNextPage) {
          this.fetchNextAllNotificationPage();
        }
        break;
      case Tabs.APPROVALS:
        if (this.state.approvalNorifications_hasNextPage) {
          this.fetchNextApprovalNotificationPage();
        }
        break;
      case Tabs.COMMENTS:
        if (this.state.commentsNotifications_hasNextPage) {
          this.fetchNextCommentNotificationPage();
        }
        break;
      case Tabs.INBOX:
        if (this.state.inboxNotifications_hasNextPage) {
          this.fetchNextInboxNotificationPage();
        }
        break;
    }
  }


  fetchNotifications(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const { userId } = this.props.user.activeUser;
    Promise.all([
      NotificationService.getAllNewNotifications(NotificationStatusCodes.NEW, companyKey),//new all Notifications
      NotificationService.getNotifications(companyKey, 0, this.state.pageSize),//all notifications
      NotificationService.getAllAprovalsNotification(companyKey, 0, this.state.pageSize),//all approval notifications
      NotificationService.getNotificationsByType('File', companyKey, 0, this.state.pageSize),//all inbox notifications
      NotificationService.getNotificationsByType('Comment', companyKey, 0, this.state.pageSize)//all comment notifications
    ]).then((response) => {
      if (response[0].ok && response[1].ok && response[2].ok && response[3].ok) {
        let pendingApprovalsCount = response[0].data.filter(ele => ele.SourceEntityType === 'SupplierInvoice' || ele.SourceEntityType === 'WorkItemGroup').length;
        let pendingInboxCount = response[0].data.filter(ele => ele.SourceEntityType === 'File').length;
        let pendingCommentCount = response[0].data.filter(ele => ele.SourceEntityType === 'Comment').length;
        let allPendingNotificationsCount = pendingApprovalsCount + pendingInboxCount + pendingCommentCount;
        let allNotifications = [];

        this.setState({
          isLoading: false,
          isRefreshing: false,
          pendingApprovalsCount,
          pendingInboxCount,
          pendingCommentCount,
          allPendingNotificationsCount,
          allNotifications: response[1].data,
          approvalNorifications: response[2].data,
          commentsNotifications: response[4].data,
          inboxNotifications: response[3].data,
          allNotifications_hasNextPage: (response[1].data.length === this.state.pageSize),
          approvalNorifications_hasNextPage: (response[2].data.length === this.state.pageSize),
          commentsNotifications_hasNextPage: (response[4].data.length === this.state.pageSize),
          inboxNotifications_hasNextPage: (response[3].data.length === this.state.pageSize)
        });
      } else {
        this.handleNotificationErrors(response.problem, caller, i18n.t('NotificationsList.index.fetchNotificationsError'));
      }
    })
      .catch((error) => {
        this.handleNotificationErrors(error.problem, caller, i18n.t('NotificationsList.index.fetchNotificationsError'));
      });
  }


  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('NotificationsList.index.errorGeneric')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  handleNotificationTap(rowData, rowMap, route) {
    const companyKey = this.props.company.selectedCompany.Key;

    if (companyKey === rowData.item.CompanyKey) { // user clicks on a same company notification
      switch (rowData.item.SourceEntityType) {
        case 'SupplierInvoice':
          if ((PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS)) || PermissionChecker.hasUserPermissionType(PermissionType.UI_APPROVAL_ACCOUNTING)) {
            this.props.navigation.navigate('InvoiceDetails', {
              invoiceID: rowData.item.SourceEntityID,
              approvalID: rowData.item.EntityID,
              EntityType: 'supplierinvoice',
              CompanyKey: companyKey,
            });
          } else {
            AlertService.showSimpleAlert(i18n.t('ApprovalsList.index.noAccess'), i18n.t('ApprovalsList.index.noAccessToSupplierInvoice'), AlertType.WARNING);
          }
          break;
        case 'WorkItemGroup':
          this.props.navigation.navigate({
            key: 'HoursApproval',
            routeName: 'HoursApproval',
            params: {
              CompanyKey: companyKey,
              itemID: rowData.item.EntityID,
              refreshApprovals: () => {},
              showRejectionMessage: true,
            }
          });
          break;
        case 'File':
          this.props.navigation.navigate('QuickViewInvoice', { ...rowData.item, displayInvoiceSummary: false });
          break;
        case 'Comment':
          this.props.navigation.navigate('QuickViewInvoice', { ...rowData.item, displayInvoiceSummary: false });
          break;
      }
    }
    else if (this.props.company.companyList.find(e => e.Key === rowData.item.CompanyKey)) {  // if user clicks on a different company
      AlertService.showSimpleAlert(
        i18n.t('NotificationsList.index.confirmation'),
        i18n.t('NotificationsList.index.accSwitchDes',
          { companyName: rowData.item.CompanyName }),
        AlertType.CONFIRMATION,
        () => {
          switch (rowData.item.SourceEntityType) {
            case 'SupplierInvoice': 
              companySwitch(
                rowData.item.CompanyKey,
                NavigationActions.navigate({
                  routeName: 'NotificationsTab',
                  action: NavigationActions.navigate({
                    routeName: 'InvoiceDetails',
                    params: {
                      invoiceID: rowData.item.SourceEntityID,
                      approvalID: rowData.item.EntityID,
                      EntityType: 'supplierinvoice',
                    }
                  }),
                }),
              );
              break;
            case 'WorkItemGroup':
              companySwitch(
                rowData.item.CompanyKey,
                NavigationActions.navigate({
                  routeName: 'NotificationsTab',
                  action: NavigationActions.navigate({ routeName: 'HoursApproval', params: { itemID: rowData.item.EntityID, showRejectionMessage: true } }),
                }),
              );
              break;
            case 'File':
              companySwitch(
                rowData.item.CompanyKey,
                NavigationActions.navigate({
                  routeName: 'NotificationsTab',
                  action: NavigationActions.navigate({ routeName: 'QuickViewInvoice', params: { ...rowData.item, displayInvoiceSummary: false } }),
                }),
              );
              break;
            case 'Comment':
              companySwitch(
                rowData.item.CompanyKey,
                NavigationActions.navigate({
                  routeName: 'NotificationsTab',
                  action: NavigationActions.navigate({ routeName: 'QuickViewInvoice', params: { ...rowData.item, displayInvoiceSummary: false } }),
                }),
              );
              break;
          }
        },
        null,
        i18n.t('NotificationsList.index.switchCompany'),
        i18n.t('NotificationsList.index.cancel')
      );
    }
    else {
      AlertService.showSimpleAlert(i18n.t('ApprovalsList.index.noAccess'), i18n.t('ApprovalsList.index.noAccessToSupplierInvoice'), AlertType.WARNING);
    }

    if (rowData.item.StatusCode === NotificationStatusCodes.NEW) {
      this.readToggleNotification(rowData, rowMap, route);
    }
  }


  deleteRowFromAllTab(notification) {
    const _newNotificationList = this.state.allNotifications.filter((obj) => {
      return (obj.ID !== notification.item.ID);
    });
    this.setState({ allNotifications: _newNotificationList });
  }

  deleteRowFromSpecificTab(notification) {
    const setItemDelete = (notification, specificDataset, dsType) => {

      const _newNotificationList = specificDataset.filter((obj) => {
        return obj.ID !== notification.item.ID;
      });


      switch (dsType) {
        case 'SupplierInvoice':
          this.setState({ approvalNorifications: _newNotificationList });
          break;
        case 'WorkItemGroup':
          this.setState({ approvalNorifications: _newNotificationList });
          break;
        case 'File':
          this.setState({ inboxNotifications: _newNotificationList });
          break;
        case 'Comment':
          this.setState({ commentsNotifications: _newNotificationList });
          break;
      }
    }

    switch (notification.item.SourceEntityType) {
      case 'SupplierInvoice':
        setItemDelete(notification, this.state.approvalNorifications, notification.item.SourceEntityType);
        break;
      case 'WorkItemGroup':
        setItemDelete(notification, this.state.approvalNorifications, notification.item.SourceEntityType);
        break;
      case 'File':
        setItemDelete(notification, this.state.inboxNotifications, notification.item.SourceEntityType);
        break;
      case 'Comment':
        setItemDelete(notification, this.state.commentsNotifications, notification.item.SourceEntityType);
        break;
    }
  }

  setDataSetAfterDeletion(deletingRows, newNotificationList, notification) {
    switch (this.state.index) {
      case Tabs.ALL:
        this.deleteRowFromSpecificTab(notification);
        this.setState({
          deletingRows: deletingRows,
          allNotifications: [...newNotificationList],
        });
        break;
      case Tabs.APPROVALS:
        this.deleteRowFromAllTab(notification);
        this.setState({
          deletingRows: deletingRows,
          approvalNorifications: [...newNotificationList],
        });
        break;
      case Tabs.COMMENTS:
        this.deleteRowFromAllTab(notification);
        this.setState({
          deletingRows: deletingRows,
          commentsNotifications: [...newNotificationList],
        });
        break;
      case Tabs.INBOX:
        this.deleteRowFromAllTab(notification);
        this.setState({
          deletingRows: deletingRows,
          inboxNotifications: [...newNotificationList],
        });
        break;
    }
  }

  deleteNotification(notification, rowMap) {
    // add notification id to SET without mutating
    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(notification.item.ID);
    this.setState({
      deletingRows: _deletingRows
    });
    // Do the delete request. This returns a promise
    const companyKey = this.props.company.selectedCompany.Key;
    NotificationService.deleteNotification(companyKey, notification.item.ID)
      .then((res) => { // handle success
        rowMap[`${notification.item.ID}`].closeRow();
        const _newNotificationList = this.getRelavantDataset().filter((obj) => {
          return obj.ID !== notification.item.ID;
        });
        _deletingRows.delete(notification.item.ID);
        this.setDataSetAfterDeletion(_deletingRows, _newNotificationList, notification)
        // reduce the notification count on the store
        //this.props.dispatch(decreaseInvoiceCount(this.props.notification.unreadCount));
        notification.StatusCode === NotificationStatusCodes.NEW ? this.props.decrementUnreadNotificationCount() : null;
        this.props.updateUnreadNotificationCount(this.props.company.selectedCompany.Key);
        notification.item.StatusCode === NotificationStatusCodes.NEW ? this.incOrDecNotificationCount(0) : null

      })
      .catch((err) => { // if there is a error , handle it
        _deletingRows.delete(notification.item.ID);
        this.setState({ deletingRows: _deletingRows });
        this.handleNotificationErrors(err.problem, null, i18n.t(`NotificationsList.index.errorDelete`));
      });
  }

  getRelavantDataset() {
    switch (this.state.index) {
      case Tabs.ALL:
        return this.state.allNotifications;
        break;
      case Tabs.APPROVALS:
        return this.state.approvalNorifications;
        break;
      case Tabs.COMMENTS:
        return this.state.commentsNotifications;
        break;
      case Tabs.INBOX:
        return this.state.inboxNotifications;
        break;
    }
  }

  setAllTabselectedItemStatus(selectedRow, setSateTo) {
    let _notifications = [...this.state.allNotifications];
    _notifications = this.state.allNotifications.map((item) => {
      if ((item.ID == selectedRow.item.ID) && (item.SourceEntityType == selectedRow.item.SourceEntityType)) {
        item.StatusCode = setSateTo;
      }
      return item;
    });
    this.setState({ allNotifications: _notifications });
  }

  setSpecificTabselectedItem(selectedRow, setSateTo) {
    const setItemState = (rowData1, specificDataset, setSateTo, dsType) => {
      let _notifications = [...specificDataset];
      _notifications = specificDataset.map((item) => {
        if (item.ID == rowData1.item.ID) {
          item.StatusCode = setSateTo;
        }
        return item;
      });

      switch (dsType) {
        case 'SupplierInvoice':
          this.setState({ approvalNorifications: _notifications });
          break;
        case 'WorkItemGroup':
          this.setState({ approvalNorifications: _notifications });
          break;
        case 'File':
          this.setState({ inboxNotifications: _notifications });
          break;
        case 'Comment':
          this.setState({ commentsNotifications: _notifications });
          break;
      }
    };

    switch (selectedRow.item.SourceEntityType) {
      case 'SupplierInvoice':
        setItemState(selectedRow, this.state.approvalNorifications, setSateTo, 'SupplierInvoice')
        break;
      case 'WorkItemGroup':
        setItemState(selectedRow, this.state.approvalNorifications, setSateTo, 'WorkItemGroup')
        break;
      case 'File':
        setItemState(selectedRow, this.state.inboxNotifications, setSateTo, 'File')
        break;
      case 'Comment':
        setItemState(selectedRow, this.state.commentsNotifications, setSateTo, 'Comment')
        break;
    }
  }

  setDataSet(selectedRow, setSateTo, _notifications) {
    switch (this.state.index) {
      case Tabs.ALL:
        this.setSpecificTabselectedItem(selectedRow, setSateTo)
        this.setState({
          allNotifications: _notifications,
        });
        break;
      case Tabs.APPROVALS:
        this.setAllTabselectedItemStatus(selectedRow, setSateTo)
        this.setState({
          approvalNorifications: _notifications,
        });
        break;
      case Tabs.COMMENTS:
        this.setAllTabselectedItemStatus(selectedRow, setSateTo)
        this.setState({
          commentsNotifications: _notifications,
        });
        break;
      case Tabs.INBOX:
        this.setAllTabselectedItemStatus(selectedRow, setSateTo)
        this.setState({
          inboxNotifications: _notifications,
        });
        break;
    }
  }

  incOrDecNotificationCount(incOrDec) {
    switch (this.state.index) {
      case Tabs.ALL:
        if (incOrDec == 1) {
          this.setState({
            allPendingNotificationsCount: this.state.allPendingNotificationsCount + 1,
            pendingApprovalsCount: this.state.pendingApprovalsCount + 1,
          });
        }
        else {
          this.setState({
            allPendingNotificationsCount: this.state.allPendingNotificationsCount - 1,
            pendingApprovalsCount: this.state.pendingApprovalsCount - 1,
          });
        }
        break;
      case Tabs.APPROVALS:
        if (incOrDec == 1) {
          this.setState({
            pendingApprovalsCount: this.state.pendingApprovalsCount + 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount + 1,
          });
        }
        else {
          this.setState({
            pendingApprovalsCount: this.state.pendingApprovalsCount - 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount - 1,
          });
        }

        break;
      case Tabs.COMMENTS:
        if (incOrDec == 1) {
          this.setState({
            pendingCommentCount: this.state.pendingCommentCount + 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount + 1,
          });
        }
        else {
          this.setState({
            pendingCommentCount: this.state.pendingCommentCount - 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount - 1,
          });
        }
        break;
      case Tabs.INBOX:
        if (incOrDec == 1) {
          this.setState({
            pendingInboxCount: this.state.pendingInboxCount + 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount + 1,
          });
        }
        else {
          this.setState({
            pendingInboxCount: this.state.pendingInboxCount - 1,
            allPendingNotificationsCount: this.state.allPendingNotificationsCount - 1,
          });
        }
        break;
    }
  }


  readToggleNotification(rowData, rowMap, route) {
    const setNotificationRead = (rowData1, rowMap1) => {
      let _notifications = [...this.getRelavantDataset()];
      _notifications = _notifications.map((item) => {
        if (item.ID == rowData1.item.ID) {
          item.StatusCode = NotificationStatusCodes.READ;
        }
        return item;
      });

      rowMap[`${rowData.item.ID}`].closeRow();

      this.setDataSet(rowData, NotificationStatusCodes.READ, _notifications);
      // this.setState({
      //   datsetKey: _notifications,
      // });
      this.incOrDecNotificationCount(0);
    };

    const setNotificationUnread = (rowData2, rowMap2) => {
      let _notifications = [...this.getRelavantDataset()];
      _notifications = _notifications.map((item) => {
        if (item.ID == rowData2.item.ID) {
          item.StatusCode = NotificationStatusCodes.NEW;
        }
        return item;
      });
      rowMap[`${rowData.item.ID}`].closeRow();

      this.setDataSet(rowData, NotificationStatusCodes.NEW, _notifications);
      this.incOrDecNotificationCount(1);
    };

    const companyKey = this.props.company.selectedCompany.Key;
    if (rowData.item.StatusCode === NotificationStatusCodes.NEW) { // NEW
      setNotificationRead(rowData, rowMap);
      this.props.decrementUnreadNotificationCount();
      // do the api call here
      NotificationService.markNotificationAsRead(companyKey, rowData.item.ID)
        .then((res) => { // handle success
          //this.props.dispatch(decreaseInvoiceCount(this.props.notification.unreadCount));
        })
        .catch((err) => { // if there is a error , handle it
          setNotificationUnread(rowData, rowMap);
          this.props.incrementUnreadNotificationCount();
          this.handleNotificationErrors(err.problem, null, i18n.t(`NotificationsList.index.errorGeneric`));
        });
    }
    else if (rowData.item.StatusCode === NotificationStatusCodes.READ) { // READ
      setNotificationUnread(rowData, rowMap);
      this.props.incrementUnreadNotificationCount();
      // do the api call here
      NotificationService.markNotificationAsUnread(companyKey, rowData.item.ID)
        .then((res) => { // handle success
        })
        .catch((err) => { // if there is a error , handle it
          setNotificationRead(rowData, rowMap);
          this.props.decrementUnreadNotificationCount();
          this.handleNotificationErrors(err.problem, null, i18n.t('NotificationsList.index.errorGeneric'));
        });
    }
  }

  renderFooter() {
    let showSpinner = false;
    switch (this.state.index) {
      case Tabs.ALL:
        if (this.state.allNotifications_hasNextPage) {
          showSpinner = true;
        }
        break;
      case Tabs.APPROVALS:
        if (this.state.approvalNorifications_hasNextPage) {
          showSpinner = true;
        }
        break;
      case Tabs.COMMENTS:
        if (this.state.commentsNotifications_hasNextPage) {
          showSpinner = true;
        }
        break;
      case Tabs.INBOX:
        if (this.state.inboxNotifications_hasNextPage) {
          showSpinner = true;
        }
        break;
    }

    if (showSpinner) {
      return (
        <View style={styles.footerLoaderBox}>
          <ActivityIndicator
            animating={true}
            color="#0082C0"
            size="small"
          />
        </View>
      );
    }
    else {
      return (
        <ListPaddingComponent height={120} />
      );
    }
  }

  renderTabs({ route, jumpTo }) {
    switch (route.key) {
      case NotificationTypes.TAB_KEY_ALL:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            tabKey={route.key}
            notifications={this.state.allNotifications}
            onEndReached={this.onEndReached}
            onRefresh={this.refreshNotifications}
            onSelect={this.handleNotificationTap}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            readToggleNotification={this.readToggleNotification}
            deleteNotification={this.deleteNotification}
            deletingRows={this.state.deletingRows}
            placeHolderIndex={this.state.placeHolderIndex}

          />
        );
        break;
      case NotificationTypes.TAB_KEY_APPROVALS:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            tabKey={route.key}
            notifications={this.state.approvalNorifications}
            onEndReached={this.onEndReached}
            onRefresh={this.refreshNotifications}
            onSelect={this.handleNotificationTap}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            readToggleNotification={this.readToggleNotification}
            deleteNotification={this.deleteNotification}
            deletingRows={this.state.deletingRows}
            placeHolderIndex={this.state.placeHolderIndex}

          />
        );
        break;
      case NotificationTypes.TAB_KEY_INBOX:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            tabKey={route.key}
            notifications={this.state.inboxNotifications}
            onEndReached={this.onEndReached}
            onRefresh={this.refreshNotifications}
            onSelect={this.handleNotificationTap}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            readToggleNotification={this.readToggleNotification}
            deleteNotification={this.deleteNotification}
            deletingRows={this.state.deletingRows}
            placeHolderIndex={this.state.placeHolderIndex}

          />
        );
        break;
      case NotificationTypes.TAB_KEY_COMMENTS:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            tabKey={route.key}
            notifications={this.state.commentsNotifications}
            onEndReached={this.onEndReached}
            onRefresh={this.refreshNotifications}
            onSelect={this.handleNotificationTap}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            readToggleNotification={this.readToggleNotification}
            deleteNotification={this.deleteNotification}
            deletingRows={this.state.deletingRows}
            placeHolderIndex={this.state.placeHolderIndex}

          />
        );
        break;
    }
  }

  getBadgeCount(key) {
    let badge = 0;
    if (key === NotificationTypes.TAB_KEY_ALL) {
      badge = this.state.allPendingNotificationsCount;
    }
    else if (key === NotificationTypes.TAB_KEY_APPROVALS) {
      badge = this.state.pendingApprovalsCount;
    }
    else if (key === NotificationTypes.TAB_KEY_INBOX) {
      badge = this.state.pendingInboxCount;
    }
    else if (key === NotificationTypes.TAB_KEY_COMMENTS) {
      badge = this.state.pendingCommentCount;
    }
    return badge;
  }

  returnStyle(badge) {
    if (badge < 10)
      return styles.tabBadgeContainerStyle;
    else if (badge > 9 && badge < 100)
      return styles.tabBadgeContainer9and100Style;
    else if (badge > 99 && badge < 1000)
      return styles.tabBadgeContainer100and1000Style;
    else if (badge > 999 && badge < 10000)
      return styles.tabBadgeContainer1000and10000Style;
      else
      return styles.tabBadgeContainerMaxStyle
  }
  renderLables({ route, color }) {
    const badge = this.getBadgeCount(route.key);
    return (
      <View style={[{ color }, styles.tabLable]}>
        <Text style={styles.tabBarLable}>{route.title}</Text>
        {badge > 0 ? (
          <View style={this.returnStyle(badge)}>
            <Text style={[styles.tabBadgeStyle, badge < 10 ? {} : { fontSize: 10 }]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav'} toBackgroundStyle={styles.toBackgroundStyle}>
        <View style={styles.TabControlContainer}>
          <TabView
            navigationState={this.state}
            onIndexChange={index => this.setState({ index, placeHolderIndex: 10 }, () => {
              setTimeout(() => this.setState({ placeHolderIndex: index }), 200);
            })}
            renderScene={this.renderTabs}
            swipeEnabled={false}
            renderTabBar={props => (
              <TabBar
                {...props}
                indicatorStyle={styles.indicatorStyle}
                style={styles.tabBar}
                labelStyle={styles.tabBarLable}
                renderLabel={this.renderLables}
                scrollEnabled={true}
              />
            )}
          />
        </View>
      </ViewWrapperAsync>

    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    notification: state.notification
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    incrementUnreadNotificationCount: () => dispatch(incrementUnreadNotificationCount()),
    decrementUnreadNotificationCount: () => dispatch(decrementUnreadNotificationCount()),
    updateUnreadNotificationCount: companyKey => dispatch(updateUnreadNotificationCount(companyKey))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NotificationsList);

const styles = StyleSheet.create({
  TabControlContainer: {
    flex: 1,
    marginTop: 20,
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 60,
    width: 60,
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  rowFront: {
    height: 50,
    backgroundColor: 'red',
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorStyle: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 2,
  },
  tabBar: {
    backgroundColor: theme.SCREEN_COLOR_TAB_BAR_GRAY,
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    height: 50,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  tabBarLable: {
    color: '#3d3d3d',
    fontSize: 14,
    paddingHorizontal: 5,
    fontWeight: '500'
  },
  tabLable: {

    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadgeContainerStyle: {
    borderRadius: 20,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  tabBadgeContainer9and100Style: {
    borderRadius: 24,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  tabBadgeContainer100and1000Style: {
    borderRadius: 30,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  tabBadgeContainer1000and10000Style: {
    borderRadius: 30,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  tabBadgeContainerMaxStyle: {
    borderRadius: 30,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5
  },
  tabBadgeStyle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center'
  },
  toBackgroundStyle: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
  },
});

export const Tabs = {
  ALL: 0,
  APPROVALS: 1,
  COMMENTS: 2,
  INBOX: 3,
};
