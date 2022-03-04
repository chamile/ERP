import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import { SwipeRow } from 'react-native-swipe-list-view';
import DraggableFlatList from 'react-native-draggable-flatlist'
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import CommentService from '../../services/CommentService';
import { ItemListRowFront } from './itemListRowFront';
import { ItemListRowBack } from './itemListRowBack';
import i18n from '../../i18n/i18nConfig';
import StatusFlow from '../../components/StatusFlow';
import GenericButton from '../../components/GenericButton';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import QuoteService from '../../services/QuoteService';
import { QuoteStatusCodes } from '../../constants/QuoteConstants';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH = Dimensions.get('window').width;

class QuoteDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('QuoteDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: <CommentsIcon count={navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.QuoteID } })} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      scroll: true,
      isRefreshing: false,
      moveAnimation: new Animated.Value(0),
      message: new Animated.Value(0),
      actionStatusDes: '',
      quoteDetails: {
        CustomerName: '',
        Customer: { CustomerNumber: '' },
        QuoteNumber: '',
        QuoteDate: '',
        ValidUntilDate: '',
        TaxInclusiveAmount: 0,
        TaxInclusiveAmountCurrency: 0,
        CurrencyCode: { Code: '' },
        Items: [],
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
    this.fetchQuoteData = this.fetchQuoteData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.editItem = this.editItem.bind(this);
    this.handleDeleteTap = this.handleDeleteTap.bind(this);
    this.handleEditTap = this.handleEditTap.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.getActionListForUser = this.getActionListForUser.bind(this);
    this.transferQuoteToInvoice = this.transferQuoteToInvoice.bind(this);
    this.transferQuoteToOrder = this.transferQuoteToOrder.bind(this);
    this.registerQuote = this.registerQuote.bind(this);
    this.getLeftButtonActions = this.getLeftButtonActions.bind(this);
    this.handleLeftActionItemPress = this.handleLeftActionItemPress.bind(this);
    this.rearrangeSortIndex = this.rearrangeSortIndex.bind(this);
    this.showLeftButtonActionSheet = this.showLeftButtonActionSheet.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ updateComments: this.updateComments });
    this.getLeftButtonActions();
    this.fetchData();
    CommentService.getComments(this.props.navigation.state.params.quoteID, this.props.navigation.state.params.EntityType, this.props.company.selectedCompany.Key)
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
    this.fetchQuoteData(this.fetchData);
  }

  handleDeleteTap(itemID, rowData, rowId, rowMap) {
    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(itemID);
    this.setState({
      deletingRows: _deletingRows,
      currentActionButtonIndex: 1
    });

    QuoteService.deleteItem(this.props.navigation.state.params.quoteID, itemID, this.props.company.selectedCompany.Key)
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
        this.handleQuoteErrors(err.problem, null, i18n.t('QuoteDetails.index.deleteQuoteItemError'));
      });
  }


  handleEditTap(itemID, rowData, rowId, rowMap) {
    this.editItem(rowData);
    this.itemRefs[rowId].closeRow()
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchQuoteData(this.refreshData);
  }

  getInitialFlowEntities() {
    const flowEntities = [];
    flowEntities.push(i18n.t('QuoteDetails.index.draft'));
    flowEntities.push(i18n.t('QuoteDetails.index.registered'));
    flowEntities.push(i18n.t('QuoteDetails.index.transferred'));
    flowEntities.push(i18n.t('QuoteDetails.index.completed'));
    return flowEntities;
  }

  getActionListForUser(StatusCode, itemsLength = 0) {
    const actionList = [];
    if ((StatusCode === QuoteStatusCodes.TRANSFERRED_TO_INVOICE) || (StatusCode === QuoteStatusCodes.TRANSFERRED_TO_ORDER)) {
      actionList.push({ action: 'view', display: i18n.t('QuoteDetails.index.view') });
    }
    else {
      if (StatusCode === QuoteStatusCodes.REGISTERED && itemsLength > 0) {
        actionList.push({ action: 'transferToOrder', display: i18n.t('QuoteDetails.index.transferToOrder') });
        actionList.push({ action: 'transferToInvoice', display: i18n.t('QuoteDetails.index.transferToInvoice') });
      }
      if (StatusCode === QuoteStatusCodes.DRAFT && itemsLength > 0) {
        actionList.push({ action: 'register', display: i18n.t('QuoteDetails.index.register') });
      }
      actionList.push({ action: 'viewEdit', display: i18n.t('QuoteDetails.index.viewEdit') });
    }
    return actionList;
  }

  editItem(item) {
    if (item.AccountID != null) {
      this.props.navigation.navigate('AddNewQuoteItem', {
        quoteID: this.props.navigation.state.params.quoteID,
        item,
        edit: true,
        EntityType: EntityType.PRODUCT,
        CompanyKey: this.props.company.selectedCompany.Key,
        refreshData: this.refreshData,
      });
    }
    else {
      this.props.navigation.navigate({
        key: 'AddNewComment', routeName: 'AddNewComment', params: {
          navigation: this.props.navigation,
          isEditMode: true,
          refreshData: this.refreshData,
          quoteDetails: this.state.quoteDetails,
          quoteID: this.props.navigation.state.params.quoteID,
          editItem: item,
          entityType: EntityType.CUSTOMER_QUOTE,

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

  fetchQuoteData(caller) {
    QuoteService.getQuoteDetails(this.props.company.selectedCompany.Key, this.props.navigation.state.params.quoteID)
      .then((response) => {
        if (response.ok) {
          this.setState({
            isLoading: false,
            isRefreshing: false,
            quoteDetails: this.getOrderDeatilsWithSortedItems(response.data),
            actionList: this.getActionListForUser(response.data.StatusCode, response.data.Items.length),
          });
          this.processStatus(response.data.StatusCode);
          this.props.updateQuoteList ? this.props.updateQuoteList() : null;
        }
      })
      .catch((error) => {
        this.handleQuoteErrors(error.problem, caller, i18n.t('QuoteDetails.index.fetchQuoteDataError'));
      });
  }

  goToCustomerInvoiceDetails(response) {
    this.startAnimation(true);
    this.props.navigation.setParams({ disableCancel: false });
    this.props.navigation.replace('CustomerInvoiceDetails', {
      customerInvoiceID: response.data.CustomerInvoiceID,
      EntityType: 'customerinvoice',
      CompanyKey:  this.props.company.selectedCompany.Key,
    });
    this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
  }
  async updateInvoiceDueDate(response) {
    if (this.state.quoteDetails.CreditDays !== null && this.state.quoteDetails.CreditDays > 0) {
      response.data.CustomerInvoice.PaymentDueDate = moment().add('days', this.state.quoteDetails.CreditDays).format('YYYY-MM-DD');
    }
    else {
      response.data.CustomerInvoice.PaymentDueDate = moment().add('days', this.props.company.selectedCompany.CustomerCreditDays).format('YYYY-MM-DD');
    }
    await CustomerInvoiceService.editCustomerInvoiceDetails( this.props.company.selectedCompany.Key, response.data.CustomerInvoiceID, response.data.CustomerInvoice).then((result) => {
      this.goToCustomerInvoiceDetails(response);

    }).catch((error) => {
      this.goToCustomerInvoiceDetails(response);
    });


  }

  transferQuoteToInvoice(caller) {
    this.setState({ actionStatusDes: i18n.t('QuoteDetails.index.transferringToInvoice') });
    this.startAnimation();
    QuoteService.transferQuoteToInvoice(this.props.navigation.state.params.quoteID, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.updateInvoiceDueDate(response);

        }
      })
      .catch((error) => {
        this.startAnimation(true);
        this.handleQuoteErrors(error.problem, caller, i18n.t('QuoteDetails.index.transferQuoteToInvoiceError'));
      });
  }

  transferQuoteToOrder(caller) {
    this.setState({ actionStatusDes: i18n.t('QuoteDetails.index.transferringToOrder') });
    this.startAnimation();
    QuoteService.transferQuoteToOrder(this.props.navigation.state.params.quoteID, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.startAnimation(true);
          this.props.navigation.navigate('OrderDetails', {
            orderID: response.data.CustomerOrderID,
            EntityType: 'customerOrder',
            CompanyKey: this.props.company.selectedCompany.Key,
          });
          this.refreshData();
        }
      })
      .catch((error) => {
        this.startAnimation(true);
        this.handleQuoteErrors(error.problem, caller, i18n.t('QuoteDetails.index.transferQuoteToOrderError'));
      });
  }

  registerQuote(caller) {
    this.setState({ actionStatusDes: i18n.t('QuoteDetails.index.registeringQuote') });
    this.startAnimation();
    QuoteService.registerQuote(this.props.navigation.state.params.quoteID, { ID: this.props.navigation.state.params.quoteID, StatusCode: QuoteStatusCodes.REGISTERED }, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.startAnimation(true);
          this.refreshData();
        }
      })
      .catch((error) => {
        this.startAnimation(true);
        this.handleQuoteErrors(error.problem, caller, i18n.t('QuoteDetails.index.registerQuoteError'));
      });
  }

  handleQuoteErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('QuoteDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  processStatus(status) {
    let flowDepth = 0;
    const flowEntities = this.state.flowEntities;
    switch (status) {
      case QuoteStatusCodes.DRAFT: {
        flowDepth = 0;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.draft');
        break;
      }
      case QuoteStatusCodes.REGISTERED: {
        flowDepth = 1;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.registered');
        break;
      }
      case QuoteStatusCodes.TRANSFERRED_TO_ORDER: {
        flowDepth = 2;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.transferredToOrder');
        flowEntities.length > 3 ? flowEntities.splice(-1, 1) : null;
        break;
      }
      case QuoteStatusCodes.TRANSFERRED_TO_INVOICE: {
        flowDepth = 2;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.transferredToInvoice');
        flowEntities.length > 3 ? flowEntities.splice(-1, 1) : null;
        break;
      }
      case QuoteStatusCodes.COMPLETED: {
        flowDepth = 3;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.completed');
        flowEntities[flowDepth - 1] = i18n.t('QuoteDetails.index.transferred');
        break;
      }
      default: {
        flowDepth = 0;
        flowEntities[flowDepth] = i18n.t('QuoteDetails.index.draft');
      }
    }
    this.setState({
      flowDepth, flowEntities,
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
    if (index === 0) {
      return;
    }
    switch (this.state.actionList[index - 1].action) {
      case 'view':
        this.props.navigation.navigate('AddNewQuote',
          {
            navigation: this.props.navigation,
            isViewOnly: true,
            refreshData: this.refreshData,
            quoteData: this.state.quoteDetails
          });
        break;
      case 'viewEdit':
        this.props.navigation.navigate('AddNewQuote',
          {
            navigation: this.props.navigation,
            isEdit: true,
            refreshData: this.refreshData,
            quoteData: this.state.quoteDetails
          });
        break;
      case 'transferToInvoice':
        this.transferQuoteToInvoice(this.transferQuoteToInvoice);
        break;
      case 'transferToOrder':
        this.transferQuoteToOrder(this.transferQuoteToOrder);
        break;
      case 'register':
        this.registerQuote(this.registerQuote);
        break;
    }
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Order/noItems.png')} />
        <Text style={styles.placeholderTextMain}>{i18n.t('QuoteDetails.index.addItems')}</Text>
        <Text style={styles.placeholderText}>{i18n.t('QuoteDetails.index.noItems')}</Text>
      </View>
    );
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
    let newQuote = this.state.quoteDetails;
    let newIndexedList = await this.rearrangeSortIndex(sortedItems)
    newQuote.Items = newIndexedList
    let state = await QuoteService.editQuoteDetails(this.props.company.selectedCompany.Key, this.props.navigation.state.params.quoteID, newQuote);
    if (state.ok) {
      this.setState({ isLoading: false });
    }


  }


  renderItem = ({ item, index, rowMap, move, moveEnd, isActive }) => {
    return (
      <SwipeRow
        id={`${item.ID}-${index}`}
        leftOpenValue={100}
        disableRightSwipe={true}
        disableLeftSwipe={((this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_INVOICE) || (this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_ORDER))}
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
          quoteStatusCode={this.state.quoteDetails.StatusCode}
          onPressOut={moveEnd}
        />

      </SwipeRow>

    )
  }

  getLeftButtonActions() {
    const leftButtonactionList = [];
    leftButtonactionList.push({ action: 'addNewItem', display: i18n.t('QuoteDetails.index.addNewItem') });
    leftButtonactionList.push({ action: 'addComment', display: i18n.t('QuoteDetails.index.addComment') });

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
            title: i18n.t('QuoteDetails.index.searchItems'),
            entityType: EntityType.PRODUCT,
            placeholder: i18n.t('QuoteDetails.index.searchProductByIdOrName'),
            quoteID: this.props.navigation.state.params.quoteID,
            refreshData: this.refreshData,
            CurrencyCodeID: this.state.quoteDetails.CurrencyCodeID,
            CurrencyExchangeRate: this.state.quoteDetails.CurrencyExchangeRate,
            CurrencyCode: this.state.quoteDetails.CurrencyCode,
            action: 'AddNewQuoteItem',
            showInstantResults: true
          },
          navigateFrom: 'QuoteDetails',
          navigation: this.props.navigation,
        }
        )
        break;
      case 'addComment':
        this.props.navigation.navigate('AddNewComment', {
          navigation: this.props.navigation,
          isEditMode: false,
          refreshData: this.refreshData,
          quoteDetails: this.state.quoteDetails,
          quoteID: this.props.navigation.state.params.quoteID,
          entityType: EntityType.CUSTOMER_QUOTE,

        });
        break;
    }
  }

  showLeftButtonActionSheet() {
    this.leftButtonActionSheet.show();
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
          <View style={styles.animatedPanelText}>
            <Text>{i18n.t('QuoteDetails.index.permissonMessage')}</Text>
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
            <Text>{this.state.actionStatusDes}</Text>
          </View>
        </Animated.View>
  
        <View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{`${this.state.quoteDetails.CustomerName ? this.state.quoteDetails.CustomerName.trim() : i18n.t('QuoteDetails.itemListRow.unknown')} - ${this.state.quoteDetails.Customer ? this.state.quoteDetails.Customer.CustomerNumber : ''} `}</Text>
            </View>

          <View style={styles.header}>
            <View style={styles.infoContainer}>
              <View style={styles.infoTileLeft}>
                <Text style={styles.infoTileField}>{i18n.t('QuoteDetails.index.quoteNumber')}</Text>
                <Text style={styles.infoTileValue}>{this.state.quoteDetails.QuoteNumber}</Text>
              </View>
              <View style={styles.infoTileRight}>
                <Text style={styles.infoTileField}>{i18n.t('QuoteDetails.index.quoteDate')}</Text>
                <Text style={styles.infoTileValue}>{this.state.quoteDetails.QuoteDate}</Text>
              </View>
            </View>

            <View style={styles.infoAmountContainer}>
              <Text style={styles.infoAmountTileField}>{i18n.t('QuoteDetails.index.quoteAmount')}</Text>
              <View style={styles.rowContainer}>
                <Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit={this.state.quoteDetails.TaxInclusiveAmountCurrency > 99999999999} style={this.state.quoteDetails.TaxInclusiveAmountCurrency > 99999999999 ? styles.infoAmountTileValueAmountSmall : styles.infoAmountTileValueAmount}>{FormatNumber(this.state.quoteDetails.TaxInclusiveAmountCurrency, i18n.language)}</Text>
                  <Text style={styles.currencyCode}> {this.state.quoteDetails.CurrencyCode && this.state.quoteDetails.CurrencyCode.Code ? this.state.quoteDetails.CurrencyCode.Code : ''}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.infoAmountContainer}>
              <View style={styles.rowContainer}>
                <Text style={styles.infoTileField}>{i18n.t('QuoteDetails.index.validUntilLable')}</Text>
                <Text style={styles.infoTileValue}>{this.state.quoteDetails.ValidUntilDate}</Text>
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
            {this.state.quoteDetails.Items.length > 0 ?
            <DraggableFlatList
              data={this.state.quoteDetails.Items}
              renderItem={this.renderItem}
              keyExtractor={(item, index) => `draggable-item-${item.index}${item.ID}`}
              scrollPercent={5}
              onMoveEnd={({ data }) => {
                this.setState({ scroll: true});
                this.state.quoteDetails.StatusCode <= QuoteStatusCodes.REGISTERED ? this.setState({ quoteDetails: { ...this.state.quoteDetails, Items: data } }, () => { this.updateSortedItemsList(data) }) : this.showMessage();
              }}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
              scrollEventThrottle={200}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshData}
                  enabled={this.state.scroll}
                  />
                }
              ListFooterComponent={<View style={styles.spacer} />}
            />
            : this.renderPlaceholder()}
          </View>

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          {!(this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_ORDER || this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_INVOICE) ?

            <GenericButton
              text={i18n.t('QuoteDetails.index.addNew')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.addNewItemButton}
              onPress={this.showLeftButtonActionSheet}

            />

            :
            <GenericButton
              text={i18n.t('QuoteDetails.index.view')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.viewButton}
              onPress={() => this.props.navigation.navigate('AddNewQuote',
                {
                  navigation: this.props.navigation,
                  isViewOnly: true,
                  refreshData: this.refreshData,
                  quoteData: this.state.quoteDetails
                })
              }
            />}
          {!(this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_ORDER || this.state.quoteDetails.StatusCode === QuoteStatusCodes.TRANSFERRED_TO_INVOICE) ?
            <GenericButton text={i18n.t('QuoteDetails.index.actions')} buttonStyle={styles.actionButton} onPress={this.showActionSheet} /> : null}
        </FloatingBottomContainer>

        <ActionSheet
          ref={actionSheet => this.ActionSheet = actionSheet}
          options={[
            i18n.t('QuoteDetails.index.cancel'),
            ...this.state.actionList.map(actionItem => actionItem.display),
          ]
          }
          cancelButtonIndex={0}
          onPress={this.handleActionItemPress}
        />
        <ActionSheet
          ref={actionSheet => this.leftButtonActionSheet = actionSheet}
          options={[
            i18n.t('QuoteDetails.index.cancel'),
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
    updateQuoteList: () => dispatch({ type: 'UPDATE_QUOTES_LAST_EDITED_TIMESTAMP' })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(QuoteDetails);

const styles = StyleSheet.create({
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
    marginHorizontal: 15,
    marginBottom: 3,
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
    fontWeight: '400',
  },
  spacer: {
    height: 50
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
  animatedPanelLoader: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  animatedPanelText: {
    flex: 5,
    justifyContent: 'center',
    paddingLeft: 15,
  },
  animatedPanelMessageText: {
    flex: 4,
    justifyContent: 'center',
    textAlign: 'center',
    paddingLeft: 10,
    backgroundColor: theme.COLOR_LIGHT_GRAY
  },
  currencyCode: {
    fontSize: 13,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  scene: {
    flex: 1,
  },
  header: {
    height: 115,
  },
});
