// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import { SwipeRow } from 'react-native-swipe-list-view';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { TabView, TabBar, PagerScroll } from 'react-native-tab-view';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import CommentService from '../../services/CommentService';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ItemListRowFront } from './itemListRowFront';
import { ItemListRowBack } from './itemListRowBack';
import { DistributionItem } from './distributionItem';
import i18n from '../../i18n/i18nConfig';
import StatusFlow from '../../components/StatusFlow';
import GenericButton from '../../components/GenericButton';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import { CustomerInvoiceStatusCodes } from '../../constants/CustomerInvoiceConstants';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH = Dimensions.get('window').width;

class CustomerInvoiceDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('CustomerInvoiceDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: <CommentsIcon count={navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.customerInvoiceID } })} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      dataSet: [],
      index: 0,
      scroll: true,
      routes: [
        { key: '1', title: i18n.t('CustomerInvoiceDetails.index.details') },
        { key: '2', title: i18n.t('CustomerInvoiceDetails.index.distibutions') },
      ],
      disableButton: false,
      infoMessage: '',
      isLoading: true,
      isRefreshing: false,
      moveAnimation: new Animated.Value(0),
      message: new Animated.Value(0),
      customerInvoiceDetails: {
        CustomerName: '',
        Customer: { CustomerNumber: '' },
        OrderNumber: '',
        OrderDate: '',
        TaxInclusiveAmount: 0,
        TaxInclusiveAmountCurrency: 0,
        CurrencyCode: { Code: '' },
        Items: [],
        StatusDescription: '',
        StatusCode: null,
        PaymentDueDate: null
      },
      flowDepth: 0,
      flowEntities: this.getInitialFlowEntities(),
      spaceRatio: [],
      deletingRows: new Set(),
      currentActionButtonIndex: 0,
      leftButtonactionList: [],
    };

    this.scrollOffset = 0;
    this.itemRefs = [];
    this.openRowIndex = null;

    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.fetchCustomerInvoiceData = this.fetchCustomerInvoiceData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.editItem = this.editItem.bind(this);
    this.handleDeleteTap = this.handleDeleteTap.bind(this);
    this.handleEditTap = this.handleEditTap.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.editInvoice = this.editInvoice.bind(this);
    this.callInvoiceAction = this.callInvoiceAction.bind(this);
    this.getLeftButtonActions = this.getLeftButtonActions.bind(this);
    this.showLeftButtonActionSheet = this.showLeftButtonActionSheet.bind(this);
    this.handleLeftActionItemPress = this.handleLeftActionItemPress.bind(this);
    this.triggerInvoiceDistribution = this.triggerInvoiceDistribution.bind(this);
    this.startInfoMessageAnimation = this.startInfoMessageAnimation.bind(this);
    this.distributionAction = this.distributionAction.bind(this);
    this.loadDistributions = this.loadDistributions.bind(this);
    this.renderSceneHelper = this.renderSceneHelper.bind(this);
    this.refreshDistributions = this.refreshDistributions.bind(this);
    this.navigateToDistributionDetails = this.navigateToDistributionDetails.bind(this);



  }


  componentDidMount() {
    this.getLeftButtonActions();
    this.props.navigation.setParams({ updateComments: this.updateComments });
    this.fetchData();
    CommentService.getComments(this.props.navigation.state.params.customerInvoiceID, this.props.navigation.state.params.EntityType,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.props.navigation.setParams({ comments: response.data }); }
      })
      .catch(() => {});

    this.loadDistributions();
  }

  updateComments(comments) {
    this.props.navigation.setParams({ comments });
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchCustomerInvoiceData(this.fetchData);
  }

  handleDeleteTap(itemID, rowData, rowId, rowMap) {
    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(itemID);
    this.setState({
      deletingRows: _deletingRows,
      currentActionButtonIndex: 1
    });

    CustomerInvoiceService.deleteItem(this.props.navigation.state.params.customerInvoiceID, itemID, this.props.company.selectedCompany.Key)
      .then((res) => {
        _deletingRows.delete(itemID);
        this.setState({ deletingRows: _deletingRows });
        this.itemRefs[rowId].closeRow()
        this.refreshData();
        this.openRowIndex = null;
      })
      .catch((err) => {
        _deletingRows.delete(itemID);
        this.setState({ deletingRows: _deletingRows });
        this.handleCustomerInvoiceErrors(err.problem, null, i18n.t('CustomerInvoiceDetails.index.deleteInvoiceItemError'));
      });
  }

  showLeftButtonActionSheet() {
    this.leftButtonActionSheet.show();
  }

  getLeftButtonActions() {
    const leftButtonactionList = [];
    leftButtonactionList.push({ action: 'addNewItem', display: i18n.t('CustomerInvoiceDetails.index.addNewItem') });
    leftButtonactionList.push({ action: 'addComment', display: i18n.t('CustomerInvoiceDetails.index.addComment') });

    this.setState({ leftButtonactionList: leftButtonactionList });
  }

  handleLeftActionItemPress(index) {
    if (index === 0) {
      return;
    }
    switch (this.state.leftButtonactionList[index - 1].action) {
      case 'addNewItem':
        this.props.navigation.navigate('SearchView', {
          data: {
            title: i18n.t('CustomerInvoiceDetails.index.searchItems'),
            entityType: EntityType.PRODUCT,
            placeholder: i18n.t('CustomerInvoiceDetails.index.searchProductByIdOrName'),
            customerInvoiceID: this.props.navigation.state.params.customerInvoiceID,
            refreshData: this.refreshData,
            CurrencyCodeID: this.state.customerInvoiceDetails.CurrencyCodeID,
            CurrencyExchangeRate: this.state.customerInvoiceDetails.CurrencyExchangeRate,
            CurrencyCode: this.state.customerInvoiceDetails.CurrencyCode,
            action: 'AddNewCustomerInvoiceItem',
            showInstantResults: true
          },
          navigateFrom: 'CustomerInvoiceDetails',
          navigation: this.props.navigation,
        }
        )
        break;
      case 'addComment':
        this.props.navigation.navigate('AddNewComment', {
          navigation: this.props.navigation,
          isEditMode: false,
          refreshData: this.refreshData,
          customerInvoiceDetails: this.state.customerInvoiceDetails,
          customerInvoiceID: this.props.navigation.state.params.customerInvoiceID,
          entityType: EntityType.CUSTOMER_INVOICE,

        });
        break;
    }
  }



  handleEditTap(itemID, rowData, rowId, rowMap) {
    this.editItem(rowData);
    this.itemRefs[rowId].closeRow()
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchCustomerInvoiceData(this.refreshData);
  }

  getInitialFlowEntities() {
    const flowEntities = [];
    flowEntities.push(i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft'));
    flowEntities.push(i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoiced'));
    flowEntities.push(` ${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.partlyPaid')} `);
    flowEntities.push(i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.paid'));
    return flowEntities;
  }

  callInvoiceAction() {
    if (this.state.customerInvoiceDetails.PaymentDueDate) {
      this.startAnimation();
      CustomerInvoiceService.invoiceCustomerInvoiceDetails(this.props.company.selectedCompany.Key, this.state.customerInvoiceDetails.ID)
        .then((res) => {
          this.refreshData();
          this.startAnimation(true);
        })
        .catch((err) => {
          this.startAnimation(true);
          this.handleCustomerInvoiceErrors(err.problem, null, i18n.t('CustomerInvoiceDetails.index.invoiceActionError'));
        });
    }
    else {
      let errorMsg = i18n.t('CustomerInvoiceDetails.index.invoiceDueDateError');
      let errorMsgTitle = i18n.t('CustomerInvoiceDetails.index.invoiceDueDateErrorTitle');
      Alert.alert(errorMsgTitle, errorMsg);
    }
  }

  editItem(item) {
    if (item.AccountID != null) {
      this.props.navigation.navigate('AddNewCustomerInvoiceItem', {
        customerInvoiceID: this.props.navigation.state.params.customerInvoiceID,
        item,
        edit: true,
        EntityType: EntityType.PRODUCT,
        CompanyKey:  this.props.company.selectedCompany.Key,
        refreshData: this.refreshData,
      });
    }
    else {
      this.props.navigation.navigate({
        key: 'AddNewComment', routeName: 'AddNewComment', params: {
          navigation: this.props.navigation,
          isEditMode: true,
          refreshData: this.refreshData,
          customerInvoiceDetails: this.state.customerInvoiceDetails,
          customerInvoiceID: this.props.navigation.state.params.customerInvoiceID,
          editItem: item,
          entityType: EntityType.CUSTOMER_INVOICE,

        }
      });

    }
  }

  editInvoice() {
    this.props.navigation.navigate('AddNewCustomerInvoice', {
      navigation: this.props.navigation,
      isEdit: true,
      refreshData: this.refreshData,
      customerInvoiceData: this.state.customerInvoiceDetails
    });
  }

  //Sorting order items by sort index of the item
  getOrderDeatilsWithSortedItems(data) {
    let oldData = data;
    let sortedItems = data.Items.sort(function (obj1, obj2) { return obj1.SortIndex - obj2.SortIndex })
    oldData.Items = sortedItems;

    return oldData;

  }

  fetchCustomerInvoiceData(caller) {
    CustomerInvoiceService.getCustomerInvoiceDetails( this.props.company.selectedCompany.Key, this.props.navigation.state.params.customerInvoiceID)
      .then((response) => {
        if (response.ok) {
          this.setState({
            isLoading: false,
            isRefreshing: false,
            customerInvoiceDetails: this.getOrderDeatilsWithSortedItems(response.data),
          });
          this.processStatus(response.data.StatusCode);
          this.props.updateCustomerInvoiceList ? this.props.updateCustomerInvoiceList() : null;
        }
      })
      .catch((error) => {
        this.handleCustomerInvoiceErrors(error.problem, caller, i18n.t('CustomerInvoiceDetails.index.fetchInvoiceDataError'));
      });
  }

  handleCustomerInvoiceErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('CustomerInvoiceDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  processStatus(status) {
    let flowDepth = 0;
    const flowEntities = this.state.flowEntities;
    let StatusDescription = '';
    switch (status) {
      case CustomerInvoiceStatusCodes.DRAFT: {
        flowDepth = 0;
        StatusDescription = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
        flowEntities[flowDepth] = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
        break;
      }
      case CustomerInvoiceStatusCodes.INVOICED: {
        flowDepth = 1;
        StatusDescription = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoiced');
        flowEntities[flowDepth] = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.invoiced');
        break;
      }
      case CustomerInvoiceStatusCodes.PAID: {
        flowDepth = 3;
        StatusDescription = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.paid');
        flowEntities[flowDepth] = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.paid');
        break;
      }
      case CustomerInvoiceStatusCodes.PARTLY_PAID: {
        flowDepth = 2;
        StatusDescription = ` ${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.partlyPaid')} `;
        flowEntities[flowDepth] = ` ${i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.partlyPaid')} `;
        break;
      }
      default: {
        flowDepth = 0;
        StatusDescription = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
        flowEntities[flowDepth] = i18n.t('CustomerInvoiceList.CustomerInvoiceListRow.draft');
      }
    }
    this.setState({
      flowDepth, flowEntities, customerInvoiceDetails: { ...this.state.customerInvoiceDetails, StatusDescription }
    });
  }

  _processAmount(amount) {
    amount = amount ? amount.toString() : '0';
    if (amount.includes('.')) {
      return `${amount} `;
    } else {
      amount = amount.length > 5 ? `${amount.slice(0, amount.length - 3)} ${amount.slice(amount.length - 3)}` : amount;
      return `${amount}.00 `;
    }
  }

  showActionSheet() {
    this.ActionSheet.show();
  }

  startMessageAnimation(reverse = false) {
    Animated.timing(
      this.state.message,
      {
        toValue: reverse ? 0 : 1,
        duration: 300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: reverse ? 0 : 1,
        duration: 300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  handleActionItemPress(index) {
    if ((this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.DRAFT) && (this.state.customerInvoiceDetails.Items.length > 0)) {
      switch (index) {
        case 1:
          this.callInvoiceAction();
          break;
        case 2:
          this.props.navigation.navigate('AddNewCustomerInvoice', {
            navigation: this.props.navigation,
            isEdit: true,
            refreshData: this.refreshData,
            customerInvoiceData: this.state.customerInvoiceDetails
          });
          break;
      }
    }
    else {
      switch (index) {
        case 1:
          this.props.navigation.navigate('AddNewCustomerInvoice', {
            navigation: this.props.navigation,
            isEdit: true,
            refreshData: this.refreshData,
            customerInvoiceData: this.state.customerInvoiceDetails
          });
          break;
      }
    }
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Order/noItems.png')} />
        <Text style={styles.placeholderTextMain}>{i18n.t('CustomerInvoiceDetails.index.addItems')}</Text>
        <Text style={styles.placeholderText}>{i18n.t('CustomerInvoiceDetails.index.noItems')}</Text>
      </View>
    );
  }


  renderItem = ({ item, index, rowMap, move, moveEnd, isActive }) => {
    return (
      <SwipeRow
        id={`${item.ID}-${index}`}
        leftOpenValue={100}
        disableRightSwipe={true}
        disableLeftSwipe={this.state.customerInvoiceDetails.StatusCode != CustomerInvoiceStatusCodes.DRAFT}
        rightOpenValue={-160}
        recalculateHiddenLayout={true}
        ref={ref => this.itemRefs[index] = ref}
        onRowOpen={() => { (this.openRowIndex != null && (this.openRowIndex != index)) ? this.itemRefs[this.openRowIndex].closeRow() : null; this.openRowIndex = index; }}>

        <ItemListRowBack
          rowData={item}
          rowId={index}
          rowMap={rowMap}
          editItem={this.handleEditTap}
          deleteItem={this.handleDeleteTap}
          deletingRows={this.state.deletingRows}
          actionButtonIndex={this.state.currentActionButtonIndex}

        />

        <ItemListRowFront
          item={item}
          onSelect={() => { }}
          onLongPress={(props) => { this.openRowIndex != null ? this.itemRefs[this.openRowIndex].closeRow() : null; this.setState({ scroll: false}); move(props) }}
          isActive={isActive}
          defaultCurrencyCode={this.state.customerInvoiceDetails.CurrencyCode.Code}
          onPressOut={moveEnd}
        />

      </SwipeRow>

    )
  }

  async rearrangeSortIndex(items) {

    let orderedItems = items.map((item, index) => {
      delete item.SortIndex;
      return {
        ...item,
        SortIndex: (1 + index),
      };
    });

    return orderedItems;

  }

  async updateSortedItemsList(sortedItems) {
    this.setState({ isLoading: true });
    let newCustomerInvoice = this.state.customerInvoiceDetails;
    let newIndexedList = await this.rearrangeSortIndex(sortedItems)
    newCustomerInvoice.Items = newIndexedList
    let state = await CustomerInvoiceService.editCustomerInvoiceDetails(this.props.company.selectedCompany.Key, this.props.navigation.state.params.customerInvoiceID, newCustomerInvoice);
    if (state.ok) {
      this.setState({ isLoading: false });
    }


  }

  startInfoMessageAnimation() {
    this.startMessageAnimation();
    setTimeout(() => this.startMessageAnimation(true), 3000)
  }
  showMessage(message) {
    this.setState({ infoMessage: message }, this.startInfoMessageAnimation())

  }

  distributionAction() {
    CustomerInvoiceService.triggerInvoiceDistribution(this.props.company.selectedCompany.Key, this.props.navigation.state.params.customerInvoiceID)
      .then((res) => {
        if (res.ok) {
          this.setState({ isLoading: false }, this.showMessage(i18n.t('CustomerInvoiceDetails.index.invoiceDistributionSuccess')));
          setTimeout(() => this.setState({ disableButton: false }), 4000)
          this.refreshDistributions(1);

        }
        else {
          this.setState({ isLoading: false, disableButton: false }, this.handleCustomerInvoiceErrors(err.problem, null, i18n.t('CustomerInvoiceDetails.index.invoiceDistibutionAlreadyInProgressError')));
        }
      })
      .catch((err) => {
        this.setState({ isLoading: false, disableButton: false }, this.handleCustomerInvoiceErrors(err.problem, null, i18n.t('CustomerInvoiceDetails.index.invoiceDistibutionAlreadyInProgressError')));

      });

  }
  loadDistributions() {
    CustomerInvoiceService.getDistributions(this.props.company.selectedCompany.Key, this.props.navigation.state.params.customerInvoiceID)
      .then((res) => {
        this.setState({ ...this.state, dataSet: res.data.Data })
      })
      .catch(() => {});
  }

  triggerInvoiceDistribution() {
    CustomerInvoiceService.getDistributions(this.props.company.selectedCompany.Key, this.props.navigation.state.params.customerInvoiceID)
      .then((res) => {
        if (res.ok) {
          if (res.data.Data.length == 0) {
            this.distributionAction();
          }
          else if (res.data.Data.length > 0) {
            //Already distibuted
            Alert.alert(
              i18n.t('CustomerInvoiceDetails.index.alreadyDistributedTitle'),
              i18n.t('CustomerInvoiceDetails.index.alreadyDistributedAlertDes'),
              [
                { text: i18n.t('CustomerInvoiceDetails.index.cancel'), onPress: () => () => { }, style: 'cancel' },
                { text: i18n.t('CustomerInvoiceDetails.index.ok'), onPress: () => this.setState({ isLoading: true, disableButton: true }, this.distributionAction()) },
              ],
              { cancelable: false }
            )

          }

        }
        else {
          this.handleCustomerInvoiceErrors("", null, i18n.t('CustomerInvoiceDetails.index.invoiceDistibutionAlreadyInProgressError'));
        }
      })
      .catch(() => {});

  }

  navigateToDistributionDetails(item) {
    this.props.navigation.navigate({
      key: 'DistributionDetails', routeName: 'DistributionDetails', params: { data: item }
    });
  }
  renderSceneHelper = (route) => {
    const scenes = {
      1: (
        <View style={[styles.scene, { backgroundColor: 'transparent' }]}>
          <DraggableFlatList
            data={this.state.customerInvoiceDetails.Items}
            renderItem={this.renderItem}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this.refreshData}
                enabled={this.state.scroll}
                />
              }
            keyExtractor={(item, index) => `draggable-item-${item.index}${item.ID}`}
            scrollPercent={5}
            onMoveEnd={({ data }) => {
              this.setState({ scroll: true});
              this.state.customerInvoiceDetails.StatusCode <= CustomerInvoiceStatusCodes.DRAFT ? this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, Items: data } }, () => { this.updateSortedItemsList(data) }) : this.showMessage(i18n.t('CustomerInvoiceDetails.index.permissonMessage'));
            }}
            ListHeaderComponent={() => <ListPaddingComponent height={10} />}
            ListFooterComponent={() => <ListPaddingComponent height={60} />}
            scrollEventThrottle={200}
            onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
          />
        </View>
      ),
      2: (
        <View style={[styles.scene, { backgroundColor: 'transparent' }]}>
          {
            this.state.dataSet.length > 0 ?
              <FlatList
                keyExtractor={(item, index) => item.SharingID}
                data={this.state.dataSet}
                refreshControl={
                  <RefreshControl
                    refreshing={this.state.isRefreshing}
                    onRefresh={this.refreshData}
                    enabled={this.state.scroll}
                    />
                  }
                renderItem={(props) => <DistributionItem item {...props} onSelect={this.navigateToDistributionDetails} />}
                ListHeaderComponent={() => <ListPaddingComponent height={10} />}
                ListFooterComponent={() => <ListPaddingComponent height={60} />}
                scrollEnabled={true}
                alwaysBounceVertical={false}
                scrollEventThrottle={200}
                onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
              />
              :
              <View style={Platform.OS === 'android' ? {} : styles.distributionsPlaceHolder}>
                <Text style={Platform.OS === 'android' ? styles.distributionsPlaceHolderText_android : styles.distributionsPlaceHolderText}>{i18n.t('CustomerInvoiceDetails.index.noDistributions')}</Text>
              </View>
          }

        </View>
      )
    };
    return scenes[route.route.key];
  };

  refreshDistributions(tabIndex) {
    //Clicked on the distribution tab
    if (tabIndex == 1) {
      this.loadDistributions();
    }
  }
  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <Animated.View
          style={[styles.animatedPanel, {
            transform: [
              {
                translateY: this.state.message.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0],
                })
              }
            ]
          }]}
        >
          <View style={styles.animatedPanelMessageText}>
            <Text>{this.state.infoMessage}</Text>
          </View>

        </Animated.View>
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
              style={styles.activityIndicator}
              size="small"
            />
          </View>
          <View style={styles.animatedPanelText}>
            <Text>{i18n.t('CustomerInvoiceDetails.index.creatingInvoice')}</Text>
          </View>
        </Animated.View>
        <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{`${this.state.customerInvoiceDetails.CustomerName ? this.state.customerInvoiceDetails.CustomerName : i18n.t('CustomerInvoiceDetails.index.unknown')}${this.state.customerInvoiceDetails.CustomerOrgNumber ? ` - ${this.state.customerInvoiceDetails.CustomerOrgNumber}` : ''} `}</Text>
            </View>
          <View style={styles.header}>
            <View style={styles.infoContainer}>
              <View style={styles.infoTileLeft}>
                <Text style={styles.infoTileField}>{i18n.t('CustomerInvoiceDetails.index.invoiceNumber')}</Text>
                <Text style={styles.infoTileValue}>{this.state.customerInvoiceDetails.InvoiceNumber ? this.state.customerInvoiceDetails.InvoiceNumber : i18n.t('CustomerInvoiceDetails.index.unknown')}</Text>
              </View>
              <View style={styles.infoTileRight}>
                <Text style={styles.infoTileField}>{i18n.t('CustomerInvoiceDetails.index.invoiceDate')}</Text>
                <Text style={styles.infoTileValue}>{this.state.customerInvoiceDetails.InvoiceDate ? this.state.customerInvoiceDetails.InvoiceDate : i18n.t('CustomerInvoiceDetails.index.unknown')}</Text>
              </View>
            </View>

            <View style={styles.infoAmountContainer}>
              <Text style={styles.infoAmountTileField}>{i18n.t('CustomerInvoiceDetails.index.invoiceAmount')}</Text>
              <View style={styles.rowContainer}>
                <Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit={this.state.customerInvoiceDetails.TaxInclusiveAmountCurrency > 99999999999} style={this.state.customerInvoiceDetails.TaxInclusiveAmountCurrency > 99999999999 ? styles.infoAmountTileValueAmountSmall : styles.infoAmountTileValueAmount}>{FormatNumber(this.state.customerInvoiceDetails.TaxInclusiveAmountCurrency, i18n.language)}</Text>
                  <Text style={styles.currencyCode}> {this.state.customerInvoiceDetails.CurrencyCode && this.state.customerInvoiceDetails.CurrencyCode.Code ? this.state.customerInvoiceDetails.CurrencyCode.Code : ''}</Text>
                </Text>
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
            </View>
          </View>

          <View style={styles.content}>
            <TabView
              renderPager={(props) => <PagerScroll {...props} />}
              swipeEnabled={false}
              navigationState={this.state}
              renderScene={this.renderSceneHelper}
              onIndexChange={index => this.setState({ index })}
              initialLayout={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
              renderTabBar={props =>
                <TabBar
                  {...props}
                  indicatorStyle={{ backgroundColor: theme.SCREEN_COLOR_TAB_INDICATOR, height: 1 }}
                  style={styles.tabBar}
                  labelStyle={styles.tabBarLable}
                  getLabelText={({ route }) => route.title}
                />

              }

            />
          </View>

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          {this.state.customerInvoiceDetails.StatusCode !== CustomerInvoiceStatusCodes.DRAFT ?
            <GenericButton
              text={i18n.t('CustomerInvoiceDetails.index.viewDetails')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={(this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.INVOICED) ? styles.viewDetailsButtonStyle : styles.addNewItemButtonAlone}
              onPress={() => this.props.navigation.navigate('AddNewCustomerInvoice', {
                navigation: this.props.navigation,
                isViewOnly: true,
                refreshData: this.refreshData,
                customerInvoiceData: this.state.customerInvoiceDetails,
              })
              }
            /> : null}
          {this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.DRAFT ?
            <GenericButton
              text={i18n.t('CustomerInvoiceDetails.index.addNew')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.addNewItemButton}
              onPress={this.showLeftButtonActionSheet}

            />

            : null}
          {(this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.DRAFT) && (this.state.customerInvoiceDetails.Items.length > 0) ? <GenericButton text={i18n.t('CustomerInvoiceDetails.index.actions')} buttonStyle={styles.actionButton} onPress={this.showActionSheet} /> : null}
          {(this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.DRAFT) && !(this.state.customerInvoiceDetails.Items.length > 0) ? <GenericButton text={i18n.t('CustomerInvoiceDetails.index.viewEdit')} buttonStyle={styles.actionButton} onPress={this.editInvoice} /> : null}
          {(this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.INVOICED) ? <GenericButton onPress={this.triggerInvoiceDistribution} text={i18n.t('CustomerInvoiceDetails.index.distributeBtn')} textStyle={styles.addNewItemButtonText} buttonStyle={styles.viewDetailsButtonStyle} disabled={this.state.disableButton} /> : null}
        </FloatingBottomContainer>

        <ActionSheet
          ref={actionSheet => this.ActionSheet = actionSheet}
          options={(this.state.customerInvoiceDetails.StatusCode === CustomerInvoiceStatusCodes.DRAFT) && (this.state.customerInvoiceDetails.Items.length > 0) ?
            [
              i18n.t('CustomerInvoiceDetails.index.cancel'),
              i18n.t('CustomerInvoiceDetails.index.invoice'),
              i18n.t('CustomerInvoiceDetails.index.viewEdit'),
            ] :
            [
              i18n.t('CustomerInvoiceDetails.index.cancel'),
              i18n.t('CustomerInvoiceDetails.index.viewEdit'),
            ]
          }
          cancelButtonIndex={0}
          onPress={this.handleActionItemPress}
        />

        <ActionSheet
          ref={actionSheet => this.leftButtonActionSheet = actionSheet}
          options={[
            i18n.t('CustomerInvoiceDetails.index.cancel'),
            ...this.state.leftButtonactionList.map(actionItem => actionItem.display),
          ]
          }
          cancelButtonIndex={0}
          onPress={this.handleLeftActionItemPress}
        />

      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateCustomerInvoiceList: () => dispatch({ type: 'UPDATE_CUSTOMER_INVOICE_LIST_LAST_EDITED_TIMESTAMP' })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomerInvoiceDetails);

const styles = StyleSheet.create({
  tabBarLable: {
    flex: 1,
    color: '#3d3d3d',
    fontSize: 12,
    marginTop: 0,
  },
  tabBar: {
    backgroundColor: theme.SCREEN_COLOR_TAB_BAR_GRAY,
    borderBottomColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    borderBottomWidth: 0.25,
    height: 30,
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: 5,
  },
  scene: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    marginBottom: -2
  },
  titleContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
    marginBottom: 15
  },
  placeholderContainer: {
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 80,
    width: 80,
  },
  placeholderText: {
    marginTop: 12,
    color: '#8f8d94',
    textAlign: 'center',
    lineHeight: 23
  },
  placeholderTextMain: {
    marginTop: 20,
    color: '#8f8d94',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 23
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR
  },
  leftInfoContainer: {
    flex: 2,
    flexDirection: 'row'
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: 15,
    flexDirection: 'row'
  },
  infoTileRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  infoTileLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  infoTileField: {
    color: theme.DISABLED_ITEM_COLOR,
    fontSize: 12,
    marginTop: 2,
    marginRight: 10
  },
  infoTileValue: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '500',
  },
  infoAmountContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 10
  },
  infoAmountTileField: {
    color: theme.HINT_TEXT_COLOR,
    fontSize: 12,
    marginRight: 10,
    marginTop: 3,
  },
  infoAmountTileValueAmount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 17,
    fontWeight: '800',
    alignSelf: 'flex-end'
  },
  infoAmountTileValueCurrency: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 15,
    fontWeight: '400',
    alignSelf: 'flex-end'
  },
  infoAmountTileValueAmountSmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 15,
    fontWeight: '800',
    alignSelf: 'flex-end'
  },
  infoAmountTileValueCurrencySmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '400',
    alignSelf: 'flex-end'
  },
  statusFlowContainer: {
    marginTop: 15,
    marginHorizontal: 15,
    height: 25,
    marginBottom: 3,
  },
  actionButton: {
    height: 35,
    flex: 1,
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  addNewItemButton: {
    height: 35,
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
  },
  viewDetailsButtonStyle: {
    height: 35,
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
    marginRight: 15,
  },
  addNewItemButtonAlone: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
  },
  addNewItemButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400'
  },
  spacer: {
    height: 50
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 60,
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
  animatedPanelMessageText: {
    flex: 5,
    justifyContent: 'center',
    paddingLeft: 15,
  },
  currencyCode: {
    fontSize: 13,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  distributionsPlaceHolder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distributionsPlaceHolderText: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 13,
  },
  distributionsPlaceHolderText_android: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 13,
    marginTop: 100,
    marginLeft: 110
  },
  header: {
    height: 90,
  },
  content: {
    flex: 1,
  }
});
