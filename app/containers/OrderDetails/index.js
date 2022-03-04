// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  Platform,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,


} from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import { SwipeRow } from 'react-native-swipe-list-view';
import DraggableFlatList from 'react-native-draggable-flatlist'
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import OrderService from '../../services/OrderService';
import CommentService from '../../services/CommentService';
import { OrderStatusCodes } from '../../constants/OrderConstants';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ItemListRowFront } from './itemListRowFront';
import { ItemListRowBack } from './itemListRowBack';
import i18n from '../../i18n/i18nConfig';
import StatusFlow from '../../components/StatusFlow';
import GenericButton from '../../components/GenericButton';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import { CustomerOrderItemStatusCodes } from '../../constants/CustomerOrderItemConstants';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH = Dimensions.get('window').width;
class OrderDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('OrderDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: <CommentsIcon count={navigation.state.params && navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.orderID } })} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      message: new Animated.Value(0),
      isLoading: true,
      scroll: true,
      isRefreshing: false,
      orderDetails: {
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
        CreditDays: 0
      },
      flowDepth: 0,
      flowEntities: this.getInitialFlowEntities(),
      deletingRows: new Set(),
      currentActionButtonIndex: 0,
      actionList: [],
      leftButtonactionList: [],
    };

    this.itemRefs = [];
    this.openRowIndex = null;

    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.fetchOrderData = this.fetchOrderData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.editItem = this.editItem.bind(this);
    this.handleDeleteTap = this.handleDeleteTap.bind(this);
    this.handleEditTap = this.handleEditTap.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.getActionListForUser = this.getActionListForUser.bind(this);
    this.updateSortedItemsList = this.updateSortedItemsList.bind(this);
    this.showLeftButtonActionSheet = this.showLeftButtonActionSheet.bind(this);
    this.getLeftButtonActions = this.getLeftButtonActions.bind(this);
    this.handleLeftActionItemPress = this.handleLeftActionItemPress.bind(this);
    this.rearrangeSortIndex = this.rearrangeSortIndex.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ updateComments: this.updateComments });
    this.getLeftButtonActions();
    this.fetchData();
    CommentService.getComments(this.props.navigation.state.params.orderID, this.props.navigation.state.params.EntityType,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.props.navigation.setParams({ comments: response.data }); }
      })
      .catch(() => {});
  }

  updateComments(comments) {
    this.props.navigation.setParams({ comments });
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchOrderData(this.fetchData);
  }

  handleDeleteTap(itemID, rowData, rowId, rowMap) {
    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(itemID);
    this.setState({
      deletingRows: _deletingRows,
      currentActionButtonIndex: 1
    });

    OrderService.deleteItem(this.props.navigation.state.params.orderID, itemID, this.props.company.selectedCompany.Key)
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
        this.handleOrderErrors(err.problem, null, i18n.t('OrderDetails.index.deleteOrderItemError'));
      });
  }


  handleEditTap(itemID, rowData, rowId, rowMap) {
    this.editItem(rowData);
    this.itemRefs[rowId].closeRow()
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchOrderData(this.refreshData);
  }

  getInitialFlowEntities() {
    const flowEntities = [];
    flowEntities.push(i18n.t('OrderList.OrderListRow.draft'));
    flowEntities.push(i18n.t('OrderList.OrderListRow.registered'));
    flowEntities.push(i18n.t('OrderList.OrderListRow.transferredToInvoice'));
    flowEntities.push(i18n.t('OrderList.OrderListRow.completed'));
    return flowEntities;
  }

  getActionListForUser(StatusCode, orderDetails = { Items: [] }) {
    const actionList = [];
    if (StatusCode < OrderStatusCodes.TRANSFERRED_TO_INVOICE) {
      actionList.push({ action: 'viewEdit', display: i18n.t('OrderDetails.index.viewEdit') });

      if (orderDetails.Items.filter(item => item.StatusCode === CustomerOrderItemStatusCodes.DRAFT).length > 0) { // check if any items which are not transferred available
        actionList.push({ action: 'transfer', display: i18n.t('OrderDetails.index.saveTransfer') });
      }
    }
    else {
      actionList.push({ action: 'view', display: i18n.t('OrderDetails.index.view') });
    }
    // actionList.push({ action: 'sendMail', display: i18n.t('OrderDetails.index.sendMail') }); to be implemented in future
    return actionList;
  }

  editItem(item) {
    if (item.AccountID != null) {
      this.props.navigation.navigate({
        key: 'AddNewOrderItem', routeName: 'AddNewOrderItem', params: {
          orderID: this.props.navigation.state.params.orderID,
          item,
          edit: true,
          EntityType: EntityType.PRODUCT,
          CompanyKey:  this.props.company.selectedCompany.Key,
          refreshData: this.refreshData,
        }
      });
    }
    else {
      this.props.navigation.navigate({
        key: 'AddNewComment', routeName: 'AddNewComment', params: {
          navigation: this.props.navigation,
          isEditMode: true,
          refreshData: this.refreshData,
          orderDetails: this.state.orderDetails,
          orderID: this.props.navigation.state.params.orderID,
          editItem: item,
          entityType: EntityType.CUSTOMER_ORDER,

        }
      });

    }
  }

  //Sorting order items by sort index of the item
  getOrderDeatilsWithSortedItems(data) {
    let oldData = data;
    let sortedItems = data.Items.sort(function (obj1, obj2) { return obj1.SortIndex - obj2.SortIndex })
    oldData.Items = sortedItems;

    return oldData;

  }
  fetchOrderData(caller) {
    OrderService.getOrderDetails( this.props.company.selectedCompany.Key, this.props.navigation.state.params.orderID)
      .then((response) => {
        if (response.ok) {
          this.setState({
            isLoading: false,
            isRefreshing: false,
            orderDetails: this.getOrderDeatilsWithSortedItems(response.data),
            actionList: this.getActionListForUser(response.data.StatusCode, response.data),
          });
          this.processStatus(response.data.StatusCode);
          this.props.updateOrderList ? this.props.updateOrderList() : null;
        }
      })
      .catch((error) => {
        this.handleOrderErrors(error.problem, caller, i18n.t('OrderDetails.index.fetchOrderDataError'));
      });
  }

  handleOrderErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('OrderDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  processStatus(status) {
    let flowDepth = 0;
    const flowEntities = this.state.flowEntities;
    let StatusDescription = '';
    switch (status) {
      case OrderStatusCodes.DRAFT: {
        flowDepth = 0;
        StatusDescription = i18n.t('OrderList.OrderListRow.draft');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.draft');
        break;
      }
      case OrderStatusCodes.REGISTERED: {
        flowDepth = 1;
        StatusDescription = i18n.t('OrderList.OrderListRow.registered');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.registered');
        break;
      }
      case OrderStatusCodes.PARTIALLY_TRANSFERRED_TO_INVOICE: {
        flowDepth = 2;
        StatusDescription = i18n.t('OrderList.OrderListRow.partlyTransferredToInvoice');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.partlyTransferredToInvoice');
        flowEntities[flowDepth + 1] = i18n.t('OrderList.OrderListRow.done');
        break;
      }
      case OrderStatusCodes.TRANSFERRED_TO_INVOICE: {
        flowDepth = 2;
        StatusDescription = i18n.t('OrderList.OrderListRow.transferredToInvoice');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.transferredToInvoice');
        break;
      }
      case OrderStatusCodes.COMPLETED: {
        flowDepth = 3;
        StatusDescription = i18n.t('OrderList.OrderListRow.completed');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.completed');
        break;
      }
      default: {
        flowDepth = 0;
        StatusDescription = i18n.t('OrderList.OrderListRow.draft');
        flowEntities[flowDepth] = i18n.t('OrderList.OrderListRow.draft');
      }
    }
    this.setState({
      flowDepth, flowEntities, orderDetails: { ...this.state.orderDetails, StatusDescription }
    });
  }

  _processAmount(amount) {
    amount = amount ? amount.toString() : '0';
    if (amount.includes('.')) {
      return amount + ' ';
    } else {
      amount = amount.length > 5 ? `${amount.slice(0, amount.length - 3)} ${amount.slice(amount.length - 3)}` : amount;
      return `${amount}.00 `;
    }
  }

  showActionSheet() {
    this.ActionSheet.show();
  }

  handleActionItemPress(index) {
    if (index === 0) {
      return;
    }
    switch (this.state.actionList[index - 1].action) {
      case 'view':
        this.props.navigation.navigate('CreateOrder',
          {
            navigation: this.props.navigation,
            isViewOnly: true,
            refreshData: this.refreshData,
            orderData: this.state.orderDetails
          });
        break;
      case 'viewEdit':
        this.props.navigation.navigate('CreateOrder',
          {
            navigation: this.props.navigation,
            isEdit: true,
            refreshData: this.refreshData,
            orderData: this.state.orderDetails
          });
        break;
      case 'transfer':
        this.props.navigation.navigate('TransferCustomerOrderToInvoiceView',
          {
            refreshData: this.refreshData,
            orderData: this.state.orderDetails,
            CompanyKey:  this.props.company.selectedCompany.Key,
          });
        break;
    }
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Order/noItems.png')} />
        <Text style={styles.placeholderTextMain}>{i18n.t('OrderDetails.index.addItems')}</Text>
        <Text style={styles.placeholderText}>{i18n.t('OrderDetails.index.noItems')}</Text>
      </View>
    );
  }

  renderItem = ({ item, index, rowMap, move, moveEnd, isActive }) => {
    return (
      <SwipeRow
        id={`${item.ID}-${index}`}
        leftOpenValue={100}
        disableRightSwipe={true}
        disableLeftSwipe={item.StatusCode === CustomerOrderItemStatusCodes.TRANSFERRED}
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
    let newOrder = this.state.orderDetails;
    let newIndexedList = await this.rearrangeSortIndex(sortedItems)
    newOrder.Items = newIndexedList
    let state = await OrderService.editOrderDetails(this.props.company.selectedCompany.Key, this.props.navigation.state.params.orderID, newOrder);
    if (state.ok) {
      this.setState({ isLoading: false });
    }


  }


  showLeftButtonActionSheet() {
    this.leftButtonActionSheet.show();
  }

  getLeftButtonActions() {
    const leftButtonactionList = [];
    leftButtonactionList.push({ action: 'addNewItem', display: i18n.t('OrderDetails.index.addNewItem') });
    leftButtonactionList.push({ action: 'addComment', display: i18n.t('OrderDetails.index.addComment') });

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
            title: i18n.t('OrderDetails.index.searchItems'),
            entityType: EntityType.PRODUCT,
            placeholder: i18n.t('OrderDetails.index.searchProductByIdOrName'),
            orderID: this.props.navigation.state.params.orderID,
            refreshData: this.refreshData,
            CurrencyCodeID: this.state.orderDetails.CurrencyCodeID,
            CurrencyExchangeRate: this.state.orderDetails.CurrencyExchangeRate,
            CurrencyCode: this.state.orderDetails.CurrencyCode,
            action: 'AddNewOrderItem',
            showInstantResults: true
          },
          navigateFrom: 'OrderDetails',
          navigation: this.props.navigation,
        }
        )
        break;
      case 'addComment':
        this.props.navigation.navigate('AddNewComment', {
          navigation: this.props.navigation,
          isEditMode: false,
          refreshData: this.refreshData,
          orderDetails: this.state.orderDetails,
          orderID: this.props.navigation.state.params.orderID,
          entityType: EntityType.CUSTOMER_ORDER,

        });
        break;
    }
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


  showMessage() {
    this.startMessageAnimation();
    setTimeout(() => this.startMessageAnimation(true), 3000)

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
            <Text>{i18n.t('OrderDetails.index.permissonMessage')}</Text>
          </View>

        </Animated.View>

        <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{`${this.state.orderDetails.CustomerName ? this.state.orderDetails.CustomerName : i18n.t('OrderList.OrderListRow.unknown')} - ${this.state.orderDetails.Customer ? this.state.orderDetails.Customer.CustomerNumber : ''} `}</Text>
            </View>

          <View style={styles.header}>
            <View style={styles.infoContainer}>
              <View style={styles.infoTileLeft}>
                <Text style={styles.infoTileField}>{i18n.t('OrderDetails.index.orderNumber')}</Text>
                <Text style={styles.infoTileValue}>{this.state.orderDetails.OrderNumber}</Text>
              </View>
              <View style={styles.infoTileRight}>
                <Text style={styles.infoTileField}>{i18n.t('OrderDetails.index.orderDate')}</Text>
                <Text style={styles.infoTileValue}>{this.state.orderDetails.OrderDate}</Text>
              </View>
            </View>

            <View style={styles.infoAmountContainer}>
              <Text style={styles.infoAmountTileField}>{i18n.t('OrderDetails.index.orderAmount')}</Text>
              <View style={styles.rowContainer}>
                <Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit={this.state.orderDetails.TaxInclusiveAmountCurrency > 99999999999} style={this.state.orderDetails.TaxInclusiveAmountCurrency > 99999999999 ? styles.infoAmountTileValueAmountSmall : styles.infoAmountTileValueAmount}>{this.state.orderDetails.CurrencyCode.Code ? FormatNumber(this.state.orderDetails.TaxInclusiveAmountCurrency, i18n.language) : this.state.orderDetails.TaxInclusiveAmountCurrency.toString() + this.state.orderDetails.CurrencyCode.Code}</Text>
                  <Text style={styles.currencyCode}> {this.state.orderDetails.CurrencyCode && this.state.orderDetails.CurrencyCode.Code ? this.state.orderDetails.CurrencyCode.Code : ''}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.infoAmountContainer}>
              <View style={styles.rowContainer}>
                <Text style={styles.infoTileField}>{i18n.t('OrderDetails.index.deliveryDate')}</Text>
                <Text style={styles.infoTileValue}>{this.state.orderDetails.DeliveryDate}</Text>
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

          <View style={styles.scene}>
            <DraggableFlatList
              data={this.state.orderDetails.Items}
              renderItem={this.renderItem}
              keyExtractor={(item, index) => `draggable-item-${item.index}${item.ID}`}
              scrollPercent={5}
              onMoveEnd={({ data }) => {
                this.setState({ scroll: true});
                this.state.orderDetails.StatusCode <= OrderStatusCodes.REGISTERED ? this.setState({ orderDetails: { ...this.state.orderDetails, Items: data } }, () => { this.updateSortedItemsList(data) }) : this.showMessage();
              }}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshData}
                  enabled={this.state.scroll}
                />
              }
              ListFooterComponent={<View style={styles.spacer} />}
            />
          </View>

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          {this.state.orderDetails.StatusCode < OrderStatusCodes.TRANSFERRED_TO_INVOICE ?
            <GenericButton
              text={i18n.t('OrderDetails.index.addNew')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.addNewItemButton}
              onPress={this.showLeftButtonActionSheet}

            />
            :
            <GenericButton
              text={i18n.t('OrderDetails.index.view')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.viewButton}
              onPress={() => this.props.navigation.navigate('CreateOrder',
                {
                  navigation: this.props.navigation,
                  isViewOnly: true,
                  refreshData: this.refreshData,
                  orderData: this.state.orderDetails
                })
              }
            />}
          {this.state.orderDetails.StatusCode < OrderStatusCodes.TRANSFERRED_TO_INVOICE ? <GenericButton text={i18n.t('OrderDetails.index.actions')} buttonStyle={styles.actionButton} onPress={this.showActionSheet} /> : null}
        </FloatingBottomContainer>

        <ActionSheet
          ref={actionSheet => this.ActionSheet = actionSheet}
          options={[
            i18n.t('OrderDetails.index.cancel'),
            ...this.state.actionList.map(actionItem => actionItem.display),
          ]
          }
          cancelButtonIndex={0}
          onPress={this.handleActionItemPress}
        />
        <ActionSheet
          ref={actionSheet => this.leftButtonActionSheet = actionSheet}
          options={[
            i18n.t('OrderDetails.index.cancel'),
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
    updateOrderList: () => dispatch({ type: 'UPDATE_ORDERS_LAST_EDITED_TIMESTAMP' })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OrderDetails);

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginBottom: -2
  },
  titleContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
    marginBottom: 10
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
    alignItems: 'center'
  },
  infoTileLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    marginRight: 10,
    marginTop: 3
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
    marginBottom: 5,
    marginHorizontal: 15,
    height: 25
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
  addNewItemButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400'
  },
  spacer: {
    height: 80
  },
  viewButton: {
    height: 35,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    width: 3 * (WIDTH / 4),
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  animatedPanelMessageText: {
    flex: 5,
    justifyContent: 'center',
    paddingLeft: 15,
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  header: {
    height: 115,
  },
  scene: {
    flex: 1,
  },
});
