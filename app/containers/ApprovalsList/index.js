// @flow
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { connect } from 'react-redux';
import Analytics from 'appcenter-analytics';
import { TabView, TabBar } from 'react-native-tab-view';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { ApprovalStatusCodes, ApprovalTypes } from '../../constants/ApprovalConstants';
import { theme } from '../../styles';
import ApprovalService from '../../services/ApprovalService';
import { DrawerIcon } from '../../components/DrawerIcon';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import AngleHeader from '../../components/AngleHeader';
import { setPendingApprovalCount } from '../../actions/approvalActions';
import AlertService from '../../services/AlertService';
import SingleTabView from './SingleTabView';
import { getHeaderStyle } from '../../helpers/UIHelper';
import { AlertType } from '../../constants/AlertTypes';
import i18n from '../../i18n/i18nConfig';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

class ApprovalsList extends Component {
  static navigationOptions = () => {
    return {
      title: i18n.t('ApprovalsList.index.approvals'),
      headerLeft: <DrawerIcon />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      pageSize: 20,
      hasNextPage: false,
      selectedIndex: 0,
      allPendingApprovals: [],
      allApprovals: [],
      invoicePendingApprovals: [],
      invoiceApprovals: [],
      hourPendingApprovals: [],
      hourApprovals: [],
      allPendingApprovalsCount: 0,
      invoicePendingApprovalsCount: 0,
      hourPendingApprovalsCount: 0,
      lastUpdatedTimestamp: null,
      index: 0,
      actionPendingRowsApprove: new Set(),
      actionPendingRowsReject: new Set(),
      routes: [
        { key: ApprovalTypes.TAB_KEY_ALL, title: i18n.t('ApprovalsList.index.allCaps') },
        { key: ApprovalTypes.TAB_KEY_INVOICE, title: i18n.t('ApprovalsList.index.invoices') },
        { key: ApprovalTypes.TAB_KEY_HOUR, title: i18n.t('ApprovalsList.index.hours') },
      ],
    };

    this.fetchApprovals = this.fetchApprovals.bind(this);
    this.refreshApprovals = this.refreshApprovals.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.handleApprovalTap = this.handleApprovalTap.bind(this);
    this.handleRejectTap = this.handleRejectTap.bind(this);
    this.renderTabs = this.renderTabs.bind(this);
    this.onApprovalItemSelect = this.onApprovalItemSelect.bind(this);
    this.renderLables = this.renderLables.bind(this);
    this.getBadgeCount = this.getBadgeCount.bind(this);
    this.onWorkItemGroupReject = this.onWorkItemGroupReject.bind(this);
    this.onApprovalRejectWithComment = this.onApprovalRejectWithComment.bind(this);
    this.addCommentToWorkGroup = this.addCommentToWorkGroup.bind(this);
  }

  componentDidMount() {
    this.fetchApprovals(this.refreshApprovals);
  }

  handleApprovalFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ApprovalsList.index.errorGeneric')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  refreshApprovals() {
    this.setState({ isRefreshing: true });
    this.fetchApprovals(this.refreshApprovals);
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const { userId } = this.props.user.activeUser;
    ApprovalService.getAllApprovals(userId, companyKey, ApprovalStatusCodes.ACTIVE, this.state.allApprovals.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          const allApprovalsNew = response.data || [];
          const invoiceApprovalsNew = allApprovalsNew.filter(ele => ele.Task.Model.Name === 'SupplierInvoice');
          const hourApprovalsNew = allApprovalsNew.filter(ele => ele.Task.Model.Name === 'WorkItemGroup');
          this.setState({
            allApprovals: [...this.state.allApprovals, ...allApprovalsNew],
            invoiceApprovals: [...this.state.invoiceApprovals, ...invoiceApprovalsNew],
            hourApprovals: [...this.state.hourApprovals, ...hourApprovalsNew],
            lastUpdatedTimestamp: new Date(),
            hasNextPage: (allApprovalsNew.length === this.state.pageSize)
          });
        } else {
          this.handleApprovalFetchErrors(response.problem, caller, i18n.t('ApprovalsList.index.fetchApprovalsError'));
        }
      })
      .catch((error) => {
        this.handleApprovalFetchErrors(error.problem, caller, i18n.t('ApprovalsList.index.fetchApprovalsError'));
      });
  }

  fetchApprovals(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const { userId } = this.props.user.activeUser;
    try {
      Promise.all([
        ApprovalService.getPendingApprovals(userId, ApprovalStatusCodes.ACTIVE, companyKey),
        ApprovalService.getAllApprovals(userId, companyKey, ApprovalStatusCodes.ACTIVE, 0, this.state.pageSize)
      ]).then(
        (responses) => {
          if (responses[0].ok && responses[1].ok) {
            const allPendingApprovals = responses[0].data || [];
            const allApprovals = responses[1].data || [];
            const invoicePendingApprovals = allPendingApprovals.filter(ele => ele.Task.Model.Name === 'SupplierInvoice');
            const invoiceApprovals = allApprovals.filter(ele => ele.Task.Model.Name === 'SupplierInvoice');
            const hourPendingApprovals = allPendingApprovals.filter(ele => ele.Task.Model.Name === 'WorkItemGroup');
            const hourApprovals = allApprovals.filter(ele => ele.Task.Model.Name === 'WorkItemGroup');
            this.setState({
              isLoading: false,
              isRefreshing: false,
              allPendingApprovals,
              allApprovals,
              invoicePendingApprovals,
              invoiceApprovals,
              hourPendingApprovals,
              hourApprovals,
              lastUpdatedTimestamp: new Date(),
              hasNextPage: (allApprovals.length === this.state.pageSize),
              allPendingApprovalsCount: allPendingApprovals.length,
              invoicePendingApprovalsCount: invoicePendingApprovals.length,
              hourPendingApprovalsCount: hourPendingApprovals.length,
            });
            this.props.setPendingApprovalCount(allPendingApprovals.length);
          }
        }
      );
    }
    catch (error) {
      this.handleApprovalFetchErrors(error.problem, caller, i18n.t('ApprovalsList.index.fetchApprovalsError'));
    }
  }

  onApprovalItemSelect(entityID, entityType = '', item = null, approvalEnabled) {
    const companyKey = this.props.company.selectedCompany.Key;
    switch (entityType) {
      case 'SupplierInvoice':
        if ((PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS)) || PermissionChecker.hasUserPermissionType(PermissionType.UI_APPROVAL_ACCOUNTING)) {
          const _onApprovalItemSelect = () => {
            this.props.navigation.navigate('InvoiceDetails', {
              invoiceID: entityID,
              approvalID: item.ID,
              EntityType: 'supplierinvoice',
              CompanyKey: companyKey,
              tabTitle: i18n.t('CustomDrawer.approvals'),
              tabIcon: 'Approvals',
              showActionItems: approvalEnabled,
              refreshApprovals: this.refreshApprovals,
            });
          };
          Platform.OS == 'ios' ? _onApprovalItemSelect() : setTimeout(_onApprovalItemSelect, 25);
        } else {
          AlertService.showSimpleAlert(i18n.t('ApprovalsList.index.noAccess'), i18n.t('ApprovalsList.index.noAccessToSupplierInvoice'), 'WARNING');
        }
        break;
      case 'WorkItemGroup':
        this.props.navigation.navigate({
          key: 'HoursApproval',
          routeName: 'HoursApproval',
          params: {
            CompanyKey: companyKey,
            item,
            itemID: item.ID,
            refreshApprovals: this.refreshApprovals,
          }
        });
        break;
      default:
        this.props.navigation.navigate('ApprovalItemDetails', {
          item,
          CompanyKey: companyKey,
          refreshApprovalList: this.refreshApprovals,
        });
    }
  }


  handleApprovalTap(rowData, rowMap, title, message, btnText_1, btnText_2, approvalID, sectionKey) {
    AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalConfirm.bind(this, approvalID, rowData, rowMap, sectionKey), null, btnText_1, btnText_2);
  }

  handleRejectTap(rowData, rowMap, title, message, btnText_1, btnText_2, approvalID, sectionKey) {
    if (rowData.item.Task.Model.Name == "WorkItemGroup")
      this.onWorkItemGroupReject(rowData, approvalID, rowMap, sectionKey)
    else
      AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalReject.bind(this, approvalID, rowData, rowMap, sectionKey), null, btnText_1, btnText_2);
  }

  async onWorkItemGroupReject(rowData, approvalID, rowMap, sectionKey) {
    this.props.navigation.navigate({
      key: 'HoursRejectView',
      routeName: 'HoursRejectView',
      params: {
        disableActionButton: false,
        approvalID: approvalID,
        taskItem: rowData.item,
        rowData: rowData,
        rowMap: rowMap,
        sectionKey: sectionKey,
        onApprovalRejectWithComment: this.onApprovalRejectWithComment,
        parent: "APPROVAL_LIST"

      },
    });

  }

  async onApprovalConfirm(approvalID, rowData, rowMap, sectionKey) {
    const companyKey = this.props.company.selectedCompany.Key;
    const _actionPendingRowsApprove = new Set([...this.state.actionPendingRowsApprove]);
    _actionPendingRowsApprove.add(`${rowData.item.ID}${sectionKey}`);
    this.setState({
      actionPendingRowsApprove: _actionPendingRowsApprove
    });
    try {
      const approvalResponse = await ApprovalService.approveApproval(approvalID, companyKey);
      if (approvalResponse.data && approvalResponse.data.Message === 'Transition is not valid') {
        Alert.alert(i18n.t('ApprovalsList.ApprovalListRowBack.approved'));
      }
      _actionPendingRowsApprove.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsApprove: _actionPendingRowsApprove,
      });
      rowMap[`${rowData.item.ID}${sectionKey}`].closeRow();
      this.refreshApprovals();
    } catch (error) {
      _actionPendingRowsApprove.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsApprove: _actionPendingRowsApprove,
      });
      this.handleApprovalFetchErrors(error.problem, null, i18n.t('ApprovalsList.index.approvalConfirmError'));
    }
    Analytics.trackEvent(AnalyticalEventNames.APPROVAL_ACTION, {
      Action: 'approve',
      View: 'ApprovalList',
    });
  }

  async onApprovalReject(approvalID, rowData, rowMap, sectionKey) {
    const companyKey = this.props.company.selectedCompany.Key;
    const _actionPendingRowsReject = new Set([...this.state.actionPendingRowsReject]);
    _actionPendingRowsReject.add(`${rowData.item.ID}${sectionKey}`);
    this.setState({
      actionPendingRowsReject: _actionPendingRowsReject
    });
    try {
      const approvalResponse = await ApprovalService.rejectApproval(approvalID, companyKey);
      if (approvalResponse.data && approvalResponse.data.Message === 'Transition is not valid') {
        Alert.alert(i18n.t('ApprovalsList.ApprovalListRowBack.rejected'));
      }
      _actionPendingRowsReject.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsReject: _actionPendingRowsReject,
      });
      rowMap[`${rowData.item.ID}${sectionKey}`].closeRow();
      this.refreshApprovals();
    } catch (error) {
      _actionPendingRowsReject.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsReject: _actionPendingRowsReject,
      });
      this.handleApprovalFetchErrors(error.problem, null, i18n.t('ApprovalsList.index.approvalRejectError'));
    }
    Analytics.trackEvent(AnalyticalEventNames.APPROVAL_ACTION, {
      Action: 'reject',
      View: 'ApprovalList',
    });
  }

  async addCommentToWorkGroup(comment, rowData) {
    const companyKey = this.props.company.selectedCompany.Key;
    let entityID = rowData.item.Task.EntityID;
    try {
      const approvalResponse = await ApprovalService.addCommentAtRejection(comment, entityID, companyKey);
    } catch (error) {
      throw error
    }
  }

  async onApprovalRejectWithComment(approvalID, rowData, rowMap, sectionKey, comment = "", cKey) {
    const companyKey = cKey;
    const _actionPendingRowsReject = new Set([...this.state.actionPendingRowsReject]);
    _actionPendingRowsReject.add(`${rowData.item.ID}${sectionKey}`);
    this.setState({
      actionPendingRowsReject: _actionPendingRowsReject
    });
    try {
      const approvalResponse = await ApprovalService.rejectApproval(approvalID, companyKey);
      await this.addCommentToWorkGroup(comment, rowData)
      if (approvalResponse.data && approvalResponse.data.Message === 'Transition is not valid') {
        Alert.alert(i18n.t('ApprovalsList.ApprovalListRowBack.rejected'));
      }
      _actionPendingRowsReject.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsReject: _actionPendingRowsReject,
      });
      rowMap[`${rowData.item.ID}${sectionKey}`].closeRow();
      this.refreshApprovals();
    } catch (error) {
      _actionPendingRowsReject.delete(`${rowData.item.ID}${sectionKey}`);
      this.setState({
        actionPendingRowsReject: _actionPendingRowsReject,
      });
      this.handleApprovalFetchErrors(error.problem, null, i18n.t('ApprovalsList.index.approvalRejectError'));
    }
    Analytics.trackEvent(AnalyticalEventNames.APPROVAL_ACTION, {
      Action: 'reject',
      View: 'ApprovalList',
    });
  }

  getBadgeCount(key) {
    let badge = 0;
    if (key === ApprovalTypes.TAB_KEY_ALL) {
      badge = this.state.allPendingApprovalsCount;
    }
    else if (key === ApprovalTypes.TAB_KEY_INVOICE) {
      badge = this.state.invoicePendingApprovalsCount;
    }
    else if (key === ApprovalTypes.TAB_KEY_HOUR) {
      badge = this.state.hourPendingApprovalsCount;
    }
    return badge;
  }

  renderLables({ route, color }) {
    const badge = this.getBadgeCount(route.key);
    return (
      <View style={[{ color }, styles.tabLable]}>
        <Text style={styles.tabBarLable}>{route.title}</Text>
        {badge > 0 ? (
          <View style={styles.tabBadgeContainerStyle}>
            <Text style={[styles.tabBadgeStyle, badge > 9 ? { fontSize: 10 } : {}]}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  renderTabs({ route, jumpTo }) {
    switch (route.key) {
      case ApprovalTypes.TAB_KEY_ALL:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            approvalKey={route.key}
            pendingItems={this.state.allPendingApprovals}
            allItems={this.state.allApprovals}
            onEndReached={this.onEndReached}
            handleApprovalTap={this.handleApprovalTap}
            handleRejectTap={this.handleRejectTap}
            onRefresh={this.refreshApprovals}
            onSelect={this.onApprovalItemSelect}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            actionPendingRowsApprove={this.state.actionPendingRowsApprove}
            actionPendingRowsReject={this.state.actionPendingRowsReject}
          />
        );
      case ApprovalTypes.TAB_KEY_INVOICE:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            approvalKey={route.key}
            pendingItems={this.state.invoicePendingApprovals}
            allItems={this.state.invoiceApprovals}
            onEndReached={this.onEndReached}
            handleApprovalTap={this.handleApprovalTap}
            handleRejectTap={this.handleRejectTap}
            onRefresh={this.refreshApprovals}
            onSelect={this.onApprovalItemSelect}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            actionPendingRowsApprove={this.state.actionPendingRowsApprove}
            actionPendingRowsReject={this.state.actionPendingRowsReject}
          />
        );
      case ApprovalTypes.TAB_KEY_HOUR:
        return (
          <SingleTabView
            jumpTo={jumpTo}
            selectedKey={this.state.routes[this.state.index].key}
            lastUpdatedTimestamp={this.state.lastUpdatedTimestamp}
            approvalKey={route.key}
            pendingItems={this.state.hourPendingApprovals}
            allItems={this.state.hourApprovals}
            onEndReached={this.onEndReached}
            handleApprovalTap={this.handleApprovalTap}
            handleRejectTap={this.handleRejectTap}
            onRefresh={this.refreshApprovals}
            onSelect={this.onApprovalItemSelect}
            isRefreshing={this.state.isRefreshing}
            renderFooter={this.renderFooter}
            key={route.key}
            actionPendingRowsApprove={this.state.actionPendingRowsApprove}
            actionPendingRowsReject={this.state.actionPendingRowsReject}
          />
        );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav'} toBackgroundStyle={styles.toBackgroundStyle}>
        <View style={styles.TabControlContainer}>
          <TabView
            navigationState={this.state}
            onIndexChange={index => this.setState({ index })}
            renderScene={this.renderTabs}
            swipeEnabled={false}
            renderTabBar={props => (
              <TabBar
                {...props}
                indicatorStyle={styles.indicatorStyle}
                style={styles.tabBar}
                labelStyle={styles.tabBarLable}
                renderLabel={this.renderLables}
              />
            )}
          />
        </View>
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    company: state.company,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setPendingApprovalCount: count => dispatch(setPendingApprovalCount(count)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApprovalsList);

const styles = StyleSheet.create({
  TabControlContainer: {
    flex: 1,
    marginTop: 20,
  },
  tabBarLable: {
    color: '#3d3d3d',
    fontSize: 14,
    paddingHorizontal: 5,
    fontWeight: '500'
  },
  tabBar: {
    backgroundColor: theme.SCREEN_COLOR_TAB_BAR_GRAY,
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
    height: 50,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  tabBadgeContainerStyle: {
    borderRadius: 20,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 18,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabLable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorStyle: {
    backgroundColor: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    height: 2,
  },
});
