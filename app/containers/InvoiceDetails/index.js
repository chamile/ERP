// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import TimeAgo from 'react-native-timeago';
import _ from 'lodash';
import ActionSheet from 'react-native-actionsheet';
import Analytics from 'appcenter-analytics';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import InvoiceService from '../../services/InvoiceService';
import CommentService from '../../services/CommentService';
import { getImageLink } from '../../helpers/APIUtil';
import { InvoiceStatusCodes } from '../../constants/InvoiceConstants';
import { getHeaderStyle } from '../../helpers/UIHelper';
import StatusFlow from '../../components/StatusFlow';
import i18n from '../../i18n/i18nConfig';
import { updateLastEditedTimestamp } from '../../actions/invoiceListActions';
import GenericButton from '../../components/GenericButton';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import ApprovalService from '../../services/ApprovalService';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import MultiplePhotoViewerWIthGallery from '../../components/MultiplePhotoViewerWIthGallery';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { ApprovalStatusCodes } from '../../constants/ApprovalConstants';

/**
 * Invoice details view displays supplier invoice details
 *  Expects: this.props.navigation.state.params
 *    where params should contain
 *      {
 *        ID: int
 *        CompanyKey: string
 *        fileId: string
 *      }
 *
 *  Entry points include invoice list and quick view of invoices via notifications.
 */
const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class InvoiceDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('InvoiceDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      headerRight: <CommentsIcon disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false} count={navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.invoiceID } })} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      hasError: false,
      moveAnimation: new Animated.Value(0),
      invoiceDetails: {
        supplierName: null,
        id: null,
        fileID: null,
        fileRef: null,
        amount: null,
        vat: null,
        invoiceDate: '',
        dueDate: '',
        currencyCode: null,
        statusCode: null,
        statusDescription: null,
        images: [],
        imagesCount: 0,
        imageIdList: [],
      },
      flowDepth: 0,
      flowEntities: this.getInitialFlowEntities(),
      isPhotoViewVisible: false,
      actionList: [],
      actionDescription: '',
      hasPermissionToModule: this.checkAccessPermission(),
    };

    this.possibleStatusCodesForEditOption = new Set([
      InvoiceStatusCodes.NEW,
      InvoiceStatusCodes.FOR_APPROVAL,
      InvoiceStatusCodes.REJECTED,
    ]);

    this.possibleStatusCodesForAssignOption = new Set([
      InvoiceStatusCodes.NEW,
      InvoiceStatusCodes.REJECTED,
    ]);

    this.showPhotoView = this.showPhotoView.bind(this);
    this.closePhotoView = this.closePhotoView.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.getActionListForUser = this.getActionListForUser.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.rejectInvoice = this.rejectInvoice.bind(this);
    this.approveInvoice = this.approveInvoice.bind(this);
  }

  checkAccessPermission() {
    if (PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS))
      { return true; }
    else if (PermissionChecker.hasUserPermissionType(PermissionType.UI_APPROVAL_ACCOUNTING))
      { return true; }
    else
      { return false; }
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchData() : this.setState({ isLoading: false });
    this.props.navigation.setParams({ updateComments: this.updateComments, isActionButtonDisabled: !this.state.hasPermissionToModule });
    CommentService.getComments(this.props.navigation.state.params.invoiceID, this.props.navigation.state.params.EntityType, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.props.navigation.setParams({ comments: response.data }); }
      })
      .catch(() => {});
  }

  updateComments(comments) {
    this.props.navigation.setParams({ comments });
  }

  updateStatus() {
    this.refreshData();
    this.props.navigation.state.params.refreshInvoiceList ? this.props.navigation.state.params.refreshInvoiceList() : null;
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchInvoiceData(this.fetchData);
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchInvoiceData(this.refreshData);
    this.props.updateLastEditedTimestamp();
    if (this.props.navigation.state.params.refreshInvoiceSummary) {
      this.props.navigation.state.params.refreshInvoiceSummary();
    }
  }

  showActionSheet() {
    this.ActionSheet.show();
  }

  fetchDataOnPermission() {
    if (PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS)) {
      return PermissionHandler.FULL_PERMISSION;
    }
    else if (PermissionChecker.hasUserPermissionType(PermissionType.UI_APPROVAL_ACCOUNTING)) {
      return PermissionHandler.LESS_PERMISSION;
    }

  }

  fetchLessPermissionData(caller, invoiceID) {
    Promise.all([
      InvoiceService.getInvoiceDetails(invoiceID, this.props.company.selectedCompany.Key),
      InvoiceService.getInvoiceImages(invoiceID, this.props.company.selectedCompany.Key),
      this.props.navigation.state.params && this.props.navigation.state.params.approvalID
      ? ApprovalService.getAllApprovalById(this.props.navigation.state.params.approvalID, this.props.navigation.state.params.EntityType, this.props.company.selectedCompany.Key) : null
    ]).then((responses) => {
      if (responses[0].ok && responses[1].ok) {
        const invoiceDetails = responses[0].data;
        const invoiceImages = responses[1].data;
        const showApproveActions = this.props.navigation.state.params && this.props.navigation.state.params.approvalID ? responses[2].data.StatusCode === ApprovalStatusCodes.ACTIVE : false;
        InvoiceService.getCurrencyCode(invoiceDetails.CurrencyCodeID, this.props.company.selectedCompany.Key).then((response) => {
          const currencyCode = response.ok ? response.data.Code : '';
          this.setState({
            invoiceDetails: {
              PaymentID: invoiceDetails.PaymentID ? invoiceDetails.PaymentID : null,
              supplierID: invoiceDetails.SupplierID,
              supplierName: invoiceDetails.Supplier ? invoiceDetails.Supplier.Info.Name : i18n.t('InvoiceDetails.index.notAvailable'),
              id: invoiceDetails.ID,
              invoiceNumber: invoiceDetails.InvoiceNumber,
              fileID: invoiceImages.length > 0 ? invoiceImages[0].ID : null,
              fileRef: invoiceImages.length > 0 ? invoiceImages[0].StorageReference : null,
              amount: invoiceDetails.TaxInclusiveAmountCurrency,
              vat: 0,
              invoiceDate: invoiceDetails.InvoiceDate,
              dueDate: invoiceDetails.PaymentDueDate,
              currencyCode,
              statusCode: invoiceDetails.StatusCode,
              images: invoiceImages.length > 0 ? invoiceImages.length === 0 ? [] : invoiceImages.filter(image => (image.ID !== null) && (image.StorageReference !== null)).map((image) => { return { ID: image.ID, StorageReference: image.StorageReference }; }) : null,
              imagesCount: invoiceImages.length > 0 ? invoiceImages.length : 0,
              imageIdList: invoiceImages.length > 0 ? invoiceImages.map(ele => ele.ID) : [],
              defaultDimensions: invoiceDetails.DefaultDimensions,
            },
            isPhotoViewVisible: false,
            hasError: false,
            actionList: this.getActionListForUser(showApproveActions),
          }, () => {
            this.processStatus(invoiceDetails.StatusCode);
          });
        });
      } else {
        this.handleCompanyFetchErrors(responses[0].problem || responses[1].problem, caller, i18n.t('InvoiceDetails.index.fetchInvoiceDataError'));
      }
    }).catch((error) => {
      if (error.status != 404)
        { this.handleCompanyFetchErrors(error.problem, caller, i18n.t('InvoiceDetails.index.fetchInvoiceDataError')); }
      else
        { this.setState({ isLoading: false, isRefreshing: false, hasError: true }); }
    });
  }

  fetchFullPermissionData(caller, invoiceID) {
    Promise.all([
      InvoiceService.getInvoiceDetails(invoiceID, this.props.company.selectedCompany.Key),
      InvoiceService.getInvoiceSummary(invoiceID, this.props.company.selectedCompany.Key),
      this.props.navigation.state.params && this.props.navigation.state.params.approvalID
        ? ApprovalService.getAllApprovalById(this.props.navigation.state.params.approvalID, this.props.navigation.state.params.EntityType, this.props.company.selectedCompany.Key) : null
    ]).then((responses) => {
      if (responses[0].ok && responses[1].ok) {
        const invoiceDetails = responses[0].data;
        const invoiceImages = responses[1].data.Data;
        const showApproveActions = this.props.navigation.state.params && this.props.navigation.state.params.approvalID ? responses[2].data.StatusCode === ApprovalStatusCodes.ACTIVE : false;
        InvoiceService.getCurrencyCode(invoiceDetails.CurrencyCodeID, this.props.company.selectedCompany.Key).then((response) => {
          const currencyCode = response.ok ? response.data.Code : '';
          this.setState({
            invoiceDetails: {
              PaymentID: invoiceDetails.PaymentID ? invoiceDetails.PaymentID : null,
              supplierID: invoiceDetails.SupplierID,
              supplierName: invoiceDetails.Supplier ? invoiceDetails.Supplier.Info.Name : i18n.t('InvoiceDetails.index.notAvailable'),
              id: invoiceDetails.ID,
              invoiceNumber: invoiceDetails.InvoiceNumber,
              fileID: invoiceImages.length > 0 ? invoiceImages[0].fileID : '',
              fileRef: invoiceImages.length > 0 ? invoiceImages[0].fileRef : '',
              amount: invoiceDetails.TaxInclusiveAmountCurrency,
              vat: 0,
              invoiceDate: invoiceDetails.InvoiceDate,
              dueDate: invoiceDetails.PaymentDueDate,
              currencyCode,
              statusCode: invoiceDetails.StatusCode,
              images: invoiceImages.length === 0 ? [] : invoiceImages.filter(image => (image.fileID !== null) && (image.fileRef !== null)).map((image) => { return { ID: image.fileID, StorageReference: image.fileRef }; }),
              imagesCount: invoiceImages.length,
              imageIdList: invoiceImages.map(ele => ele.fileID),
              defaultDimensions: invoiceDetails.DefaultDimensions,
            },
            isPhotoViewVisible: false,
            hasError: false,
            actionList: this.getActionListForUser(showApproveActions),
          }, () => {
            this.processStatus(invoiceDetails.StatusCode);
          });
        });
      } else {
        this.handleCompanyFetchErrors(responses[0].problem || responses[1].problem, caller, i18n.t('InvoiceDetails.index.fetchInvoiceDataError'));
      }
    }).catch((error) => {
      if (error.status != 404)
      { this.handleCompanyFetchErrors(error.problem, caller, i18n.t('InvoiceDetails.index.fetchInvoiceDataError')); }
      else
      { this.setState({ isLoading: false, isRefreshing: false, hasError: true }); }
    });
  }

  fetchInvoiceData(caller) {
    const { invoiceID } = this.props.navigation.state.params;

    if (this.fetchDataOnPermission() == PermissionHandler.FULL_PERMISSION) {
      this.fetchFullPermissionData(caller, invoiceID);
    }
    if (this.fetchDataOnPermission() == PermissionHandler.LESS_PERMISSION) {
      this.fetchLessPermissionData(caller, invoiceID);
    }
  }

  handleCompanyFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('InvoiceDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false, hasError: true });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  rejectInvoice() {
    this.setState({ actionDescription: i18n.t('InvoiceDetails.index.rejecting') }, () => {
      this.startAnimation();
    });
    ApprovalService.rejectApproval(this.props.navigation.state.params.approvalID, this.props.company.selectedCompany.Key)
      .then((res) => {
        this.startAnimation(true);
        this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null;
        this.refreshData();
        this.props.navigation.goBack();
      })
      .catch((err) => {
        this.startAnimation(true);
        this.handleCompanyFetchErrors(err.problem, null, i18n.t('InvoiceDetails.index.rejectInvoiceError'));
      });
    Analytics.trackEvent(AnalyticalEventNames.APPROVAL_ACTION, {
      Action: 'reject',
      View: 'InvoiceDetails',
    });
  }

  approveInvoice() {
    this.setState({ actionDescription: i18n.t('InvoiceDetails.index.approving') }, () => {
      this.startAnimation();
    });
    ApprovalService.approveApproval(this.props.navigation.state.params.approvalID, this.props.company.selectedCompany.Key)
      .then((res) => {
        this.startAnimation(true);
        this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null;
        this.refreshData();
        this.props.navigation.goBack();
      })
      .catch((err) => {
        this.startAnimation(true);
        this.handleCompanyFetchErrors(err.problem, null, i18n.t('InvoiceDetails.index.approveInvoiceError'));
      });
    Analytics.trackEvent(AnalyticalEventNames.APPROVAL_ACTION, {
      Action: 'approve',
      View: 'InvoiceDetails',
    });
  }

  showPhotoView(fileRef, companyKey, token) {
    if (fileRef) {
      this.setState({ isPhotoViewVisible: true });
    }
  }

  closePhotoView() {
    this.setState({ isPhotoViewVisible: false });
  }

  processStatus(status) {
    let flowDepth = 0;
    const flowEntities = this.state.flowEntities;
    let statusDescription = '';
    switch (status) {
      case InvoiceStatusCodes.NEW: {
        flowDepth = 0;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.draft');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.draft');
        break;
      }
      case InvoiceStatusCodes.FOR_APPROVAL: {
        flowDepth = 1;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.forApproval');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.forApproval');
        break;
      }
      case InvoiceStatusCodes.APPROVED: {
        flowDepth = 1;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.approved');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.approved');
        break;
      }
      case InvoiceStatusCodes.DELETED: {
        flowDepth = 3;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.deleted');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.deleted');
        break;
      }
      case InvoiceStatusCodes.JOURNALED: {
        flowDepth = 2;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.journaled');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.journaled');
        break;
      }
      case InvoiceStatusCodes.TO_PAYMENT: {
        flowDepth = 2;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.toPayment');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.toPayment');
        break;
      }
      case InvoiceStatusCodes.PARTLY_PAID: {
        flowDepth = 2;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.partlyPaid');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.partlyPaid');
        break;
      }
      case InvoiceStatusCodes.PAID: {
        flowDepth = 3;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.paid');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.paid');
        break;
      }
      case InvoiceStatusCodes.REJECTED: {
        flowDepth = 2;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.rejected');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.rejected');
        break;
      }
      case InvoiceStatusCodes.COMPLETED: {
        flowDepth = 3;
        statusDescription = i18n.t('InvoiceList.InvoiceListRow.completed');
        flowEntities[flowDepth] = i18n.t('InvoiceList.InvoiceListRow.completed');
        break;
      }
    }
    this.setState({
      flowDepth, flowEntities, invoiceDetails: { ...this.state.invoiceDetails, statusDescription }, isLoading: false, isRefreshing: false,
    });
  }

  getInitialFlowEntities() {
    const flowEntities = [];
    flowEntities.push(i18n.t('InvoiceList.InvoiceListRow.draft'));
    flowEntities.push(i18n.t('InvoiceList.InvoiceListRow.forApproval'));
    flowEntities.push(i18n.t('InvoiceList.InvoiceListRow.journaled'));
    flowEntities.push(i18n.t('InvoiceList.InvoiceListRow.paid'));
    return flowEntities;
  }

  handleEditClick() {
    this.props.navigation.navigate('AddNewInvoice', { isEdit: true, invoice: this.state.invoiceDetails, refreshInvoiceDetails: this.refreshData });
  }

  _getItemStatus(status) {
    switch (status) {
      case InvoiceStatusCodes.NEW:
        return i18n.t('InvoiceList.InvoiceListRow.draft');
      case InvoiceStatusCodes.FOR_APPROVAL:
        return i18n.t('InvoiceList.InvoiceListRow.forApproval');
      case InvoiceStatusCodes.APPROVED:
        return i18n.t('InvoiceList.InvoiceListRow.approved');
      case InvoiceStatusCodes.DELETED:
        return i18n.t('InvoiceList.InvoiceListRow.deleted');
      case InvoiceStatusCodes.JOURNALED:
        return i18n.t('InvoiceList.InvoiceListRow.journaled');
      case InvoiceStatusCodes.TO_PAYMENT:
        return i18n.t('InvoiceList.InvoiceListRow.toPayment');
      case InvoiceStatusCodes.PARTLY_PAID:
        return i18n.t('InvoiceList.InvoiceListRow.partlyPaid');
      case InvoiceStatusCodes.PAID:
        return i18n.t('InvoiceList.InvoiceListRow.paid');
      case InvoiceStatusCodes.REJECTED:
        return i18n.t('InvoiceList.InvoiceListRow.rejected');
      case InvoiceStatusCodes.COMPLETED:
        return i18n.t('InvoiceList.InvoiceListRow.completed');
    }
  }

  getActionListForUser(showApproveActions) {
    const actionList = [];
    if (showApproveActions) {
      actionList.push({ action: 'approve', display: i18n.t('InvoiceDetails.index.approve') });
      actionList.push({ action: 'rejectInvoice', display: i18n.t('InvoiceDetails.index.reject') });

      // add asign button inside actions list
      if (this.possibleStatusCodesForAssignOption.has(this.state.invoiceDetails.statusCode) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ASSIGNMENTS) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ASSIGNMENTS_APPROVALS)) {
        actionList.push({ action: 'assign-to', display: i18n.t('InvoiceDetails.index.assign') });
      }
    }
    return actionList;
  }

  handleActionItemPress(index) {
    if (index === 0) {
      return;
    }
    switch (this.state.actionList[index - 1].action) {
      case 'approve':
        this.approveInvoice();
        break;
      case 'rejectInvoice':
        this.rejectInvoice();
        break;
      case 'assign-to':
        this.props.navigation.navigate('SelectAssigneeView', { ID: this.props.navigation.state.params.invoiceID, refresh: this.updateStatus });
        break;
    }
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: reverse ? 0 : 1,
        duration: 250,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceImageIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('InvoiceDetails.index.noInvoiceDetails')}</Text>
      </View>
    );
  }

  renderActionButton() {
    if (this.state.actionList.length > 0) {
      return (
        <GenericButton text={i18n.t('InvoiceDetails.index.actions')} buttonStyle={styles.assignButton} onPress={this.showActionSheet} />
      );
    }
    else if (this.possibleStatusCodesForAssignOption.has(this.state.invoiceDetails.statusCode) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ASSIGNMENTS) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ASSIGNMENTS_APPROVALS)) {
      return (
        <GenericButton text={i18n.t('InvoiceDetails.index.assign')} buttonStyle={styles.assignButton} onPress={() => this.props.navigation.navigate('SelectAssigneeView', { ID: this.props.navigation.state.params.invoiceID, refresh: this.updateStatus })} />
      );
    }
    else {
      return null;
    }
  }

  renderEditButton(oneButtonOnly = true) {
    if (this.possibleStatusCodesForEditOption.has(this.state.invoiceDetails.statusCode)) {
      return (
        <GenericButton text={i18n.t('InvoiceDetails.index.edit')} textStyle={styles.editButtonText} buttonStyle={oneButtonOnly ? styles.editButtonAlone : styles.editButton} onPress={() => this.handleEditClick()} />
      );
    }
    else {
      return null;
    }
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('InvoiceList.index.noAccessToSupplierInvoice')}</Text>
      </View>
    );
  }

  showImgesCountBadge() {
    if (this.state.invoiceDetails.imagesCount > 1) {
      return (
        <View style={[styles.imageCountWrapper, this.state.invoiceDetails.imagesCount > 9 ? { width: 25 } : {}]}>
          <Text style={[styles.imageCountText, this.state.invoiceDetails.imagesCount > 9 ? styles.imageCountTextMedium : {}, this.state.invoiceDetails.imagesCount > 99 ? styles.imageCountTextLarge : {}]}>{this.state.invoiceDetails.imagesCount > 99 ? '99+' : this.state.invoiceDetails.imagesCount}</Text>
        </View>
      );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <Animated.View
          style={[styles.animatedPanel, {
            transform: [
              {
                translateY: this.state.moveAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0],
                })
              }
            ]
          }]}
        >
          <View style={styles.animatedPanelLoader}>
            <ActivityIndicator
              animating={true}
              style={[{ height: 80 }]}
              size="small"
            />
          </View>
          <View style={styles.animatedPanelText}>
            <Text>{`${this.state.actionDescription} ...`}</Text>
          </View>
        </Animated.View>
        {this.state.hasPermissionToModule ?

          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this.refreshData}
              />
            }
            scrollEventThrottle={200}
            onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
          >
            {!this.state.hasError ?
              <View style={styles.mainView}>
                <View style={styles.topInfoBar}>
                  <View style={styles.topInfoLeft}>
                    <Text style={styles.topInfoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{this.state.invoiceDetails.supplierName}</Text>
                    <Text style={styles.topInfoText}>{i18n.t('InvoiceDetails.index.invoice')}  {this.state.invoiceDetails.invoiceNumber !== null ? this.state.invoiceDetails.invoiceNumber : i18n.t('InvoiceDetails.index.notSpecified')}</Text>
                    <Text style={styles.topInfoTextSub}>{i18n.t('InvoiceDetails.index.documentNo')} {this.state.invoiceDetails.fileID}</Text>
                  </View>
                  <View style={styles.topInfoRight}>
                    {this.showImgesCountBadge()}
                    <Touchable onPress={this.showPhotoView}>

                      <Image style={styles.topInfoThumbnail} source={getImageLink(this.state.invoiceDetails.fileRef, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true)} />
                    </Touchable>
                  </View>
                </View>

                <View style={styles.statusFlowContainer}>
                  <StatusFlow
                    entities={this.state.flowEntities}
                    isTouchable={false}
                    flowDepth={this.state.flowDepth}
                    statusFlowHeight={20}
                    borderRadius={5}
                  />
                </View>

                <View style={styles.spacer} />

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.supplier')}</Text>
                    <Text style={styles.infoText}>{this.state.invoiceDetails.supplierName}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.invoiceNo')}</Text>
                    <Text style={styles.infoText}>{this.state.invoiceDetails.invoiceNumber !== null ? this.state.invoiceDetails.invoiceNumber : i18n.t('InvoiceDetails.index.notSpecified')}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  {this.state.invoiceDetails.defaultDimensions && this.state.invoiceDetails.defaultDimensions.Project && this.state.invoiceDetails.defaultDimensions.Project.Name ?
                    <View style={styles.infoCol}>
                      <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.project')}</Text>
                      <Text style={styles.infoText}>{this.state.invoiceDetails.defaultDimensions.Project.Name}</Text>
                    </View>
                    : null
                  }
                  {this.state.invoiceDetails.defaultDimensions && this.state.invoiceDetails.defaultDimensions.Department && this.state.invoiceDetails.defaultDimensions.Department.Name ?
                    <View style={styles.infoCol}>
                      <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.department')}</Text>
                      <Text style={styles.infoText}>{this.state.invoiceDetails.defaultDimensions.Department.Name}</Text>
                    </View>
                    : null
                  }
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.amount')}</Text>
                    <Text>
                      <Text style={styles.infoText}>{this.state.invoiceDetails.currencyCode && this.state.invoiceDetails.amount ? FormatNumber(this.state.invoiceDetails.amount, i18n.language) : `${this.state.invoiceDetails.currencyCode} ${this.state.invoiceDetails.amount}`}</Text>
                      <Text style={styles.currencyCode}> {this.state.invoiceDetails.currencyCode ? this.state.invoiceDetails.currencyCode : ''}</Text>
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.status')}</Text>
                    <Text style={styles.infoText}>{this._getItemStatus(this.state.invoiceDetails.statusCode)}</Text>
                  </View>
                </View>

                <View style={styles.spacer} />

                <View style={styles.infoRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.invoiceDate')}</Text>
                    <Text style={styles.infoText}>{this.state.invoiceDetails.invoiceDate ? this.state.invoiceDetails.invoiceDate.replace(/-/g, '.') : this.state.invoiceDetails.invoiceDate}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoTitle}>{i18n.t('InvoiceDetails.index.dueDate')}</Text>
                    <Text style={styles.infoText}>{this.state.invoiceDetails.dueDate ? this.state.invoiceDetails.dueDate.replace(/-/g, '.') : this.state.invoiceDetails.dueDate}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoCol} />
                  <View style={styles.infoCol}>
                    <Text style={styles.timestampText}>{this.state.invoiceDetails.dueDate ? (<TimeAgo time={this.state.invoiceDetails.dueDate} />) : null}</Text>
                  </View>
                </View>

                <View style={styles.spacer} />
              </View>
              : null}
            <View style={styles.spacerBottom} />
          </ScrollView>
          : this.renderPlaceholderWithNoPermission()}
        {this.state.hasError ? this.renderPlaceholder() : null}
        {this.state.invoiceDetails.fileRef ? (
          <MultiplePhotoViewerWIthGallery fileIds={this.state.invoiceDetails.imageIdList} open={this.state.isPhotoViewVisible} onClose={this.closePhotoView} />
        ) : null}

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          {this.renderEditButton(!this.renderActionButton())}
          {this.renderActionButton()}
        </FloatingBottomContainer>

        <ActionSheet
          ref={actionSheet => this.ActionSheet = actionSheet}
          options={[
            i18n.t('OrderDetails.index.cancel'),
            ...this.state.actionList.map(actionItem => actionItem.display),
          ]
          }
          cancelButtonIndex={0}
          destructiveButtonIndex={_.findIndex(this.state.actionList, actionItem => actionItem.action === 'rejectInvoice') + 1}
          onPress={this.handleActionItemPress}
        />

      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateLastEditedTimestamp: () => dispatch(updateLastEditedTimestamp()),
    // completeOnboarding: () => dispatch(completeOnboarding()),
    // resetToCompanySelect: () => dispatch(resetToCompanySelect())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(InvoiceDetails);

const styles = StyleSheet.create({
  mainView: {
    paddingHorizontal: 5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-around',
    paddingRight: 5,
  },
  infoTitle: {
    color: theme.PRIMARY_COLOR,
    marginBottom: 3,
    fontSize: 12,
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
  },
  spacerTop: {
    height: 30,
  },
  spacer: {
    height: 20,
  },
  spacerBottom: {
    height: 50,
  },
  topInfoBar: {
    height: 100,
    marginTop: 20,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  topInfoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topInfoRight: {
    width: 100,
    backgroundColor: 'rgba(200,200,200,0.1)',
    padding: 5,
  },
  topInfoTextMain: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '500',
    fontSize: 15,
  },
  topInfoText: {
    color: theme.PRIMARY_TEXT_COLOR,
  },
  topInfoTextSub: {
    color: theme.SECONDARY_TEXT_COLOR,
  },
  topInfoThumbnail: {
    width: 90,
    height: 90,
  },
  timestampText: {
    color: theme.SECONDARY_TEXT_COLOR,
    marginTop: -8,
    marginBottom: 10,
    fontSize: 12,
  },
  imageStyle: {
    width: 28,
    height: 28,
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.8,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  statusFlowContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'space-around',
    paddingRight: 6,
    alignItems: 'center',
  },
  assignButton: {
    height: 35,
    flex: 1,
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  editButton: {
    height: 35,
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
  },
  editButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  },
  editButtonAlone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    height: 35,
    width: 3 * (WIDTH / 4),
    borderRadius: 5,
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 59,
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  animatedPanelLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  animatedPanelText: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  imageCountWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    bottom: 0,
    backgroundColor: theme.COLOR_DARK_GRAY,
    zIndex: 100,
    marginLeft: 5,
    marginBottom: 4.5,
    width: 20,
    height: 20,
    borderTopRightRadius: 5,
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imageCountTextMedium: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  imageCountTextLarge: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  currencyCode: {
    fontSize: 12,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});

export const PermissionHandler = {
  FULL_PERMISSION: 'full_permission',
  LESS_PERMISSION: 'less_permission',

};
