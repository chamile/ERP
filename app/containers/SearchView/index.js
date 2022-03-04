// @flow
import React, { Component } from 'react';
import {
  Text,
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import _ from 'lodash';
import Analytics from 'appcenter-analytics';

import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { OrderSearchListRow } from './orderSearchListRow';
import { ProductSearchListRow } from './productSearchListRow';
import { PhonebookSearchListRow } from './phonebookSearchListRow';
import { RecentSearchListRow } from './recentSearchListRow';
import { CustomerSearchListRow } from './customerSearchListRow';
import { CustomerInvoiceSearchListRow } from './customerInvoiceSearchListRow';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { updateSearchKeywords } from '../../actions/recentDataActions';
import { EntityType } from '../../constants/EntityTypes';
import { OrderStatusCodes } from '../../constants/OrderConstants';
import ViewWrapper from '../../components/ViewWrapper';
import OrderService from '../../services/OrderService';
import ProductService from '../../services/ProductService';
import CustomerService from '../../services/CustomerService';
import PhonebookService from '../../services/PhonebookService';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import i18n from '../../i18n/i18nConfig';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import { QuoteStatusCodes } from '../../constants/QuoteConstants';
import QuoteService from '../../services/QuoteService';
import SupplierService from '../../services/SupplierService';
import { QuoteSearchListRow } from './quoteSearchListRow';
import { SupplierSearchListRow } from './supplierSearchListRow';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class SearchView extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.data.title ? navigation.state.params.data.title : i18n.t('SearchView.index.title'),
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { navigation.goBack(); }} text={i18n.t('SearchView.index.cancel')} position="left" />,
      headerRight: navigation.state.params.headerRightAction ? <HeaderTextButton navigate={navigation.navigate} position="right" onPress={() => navigation.state.params.headerRightAction()} text={navigation.state.params.headerRightText} /> : <HeaderTextButton />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      pageSize: 20,
      hasNextPage: false,
      isLoading: false,
      showSearchResult: false,
      entityType: props.navigation.state.params.data.entityType,
      searchText: '',
      action: props.navigation.state.params.data.action ? props.navigation.state.params.data.action : null,
      selectedFilterIndex: null,
      defaultSelectedFilterIndex: this._getDefaultSelectedFilter(props.navigation.state.params.data.entityType),
      searchResults: [],
      filterListOriginal: this._getFilterList(props.navigation.state.params.data.entityType),
      filterList: this._getFilterList(props.navigation.state.params.data.entityType),
      service: this._getService(props.navigation.state.params.data.entityType),
    };

    this.onSearchItemSelect = this.onSearchItemSelect.bind(this);
    this.onRecentItemSelect = this.onRecentItemSelect.bind(this);
    this.search = this.search.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.handleFilterTap = this.handleFilterTap.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.setHeaderRightAction = this.setHeaderRightAction.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.setHeaderRightAction();
    if (this.props.navigation.state.params && this.props.navigation.state.params.data && this.props.navigation.state.params.data.showInstantResults) {
      this.search();
    }
  }

  _getDefaultSelectedFilter(entityType) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      return 0;
    }
    return 0;
  }

  setHeaderRightAction() {
    const { entityType, action } = this.state;
    if (entityType === EntityType.PHONEBOOK_SEARCH) {
      //Phone book search done in only both customer and supplier so to determine from were it from navigated
      //New prop has been passing from the supplier search result list called "origine"
      if (this.props.navigation.state.params.data.origine != EntityType.SUPPLIER) {
        this.props.navigation.setParams({
          headerRightAction: () => this.props.navigation.navigate('AddNewCustomer', {
            goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
            isEdit: false
          }),
          headerRightText: i18n.t('AddNewCustomer.index.addNew')
        });
      }
      else {
        this.props.navigation.setParams({
          headerRightAction: () => this.props.navigation.navigate('AddNewSupplier', {
            goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
            isEdit: false
          }),
          headerRightText: i18n.t('AddNewSupplier.index.addNew')
        });
      }

    }

  }
  addNewItem() {
    const { entityType } = this.state;
    if (entityType === EntityType.PRODUCT) {
      this.props.navigation.setParams({
        headerRightAction: () => this.props.navigation.navigate('AddNewProduct', {
          goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
          isEditMode: false, CompanyKey: this.props.company.selectedCompany.Key,
          navigateFrom: this.props.navigation.state.params.navigateFrom ? this.props.navigation.state.params.navigateFrom : null,
          customerSetter: this.onSearchItemSelect
        }),
        headerRightText: i18n.t('AddNewProduct.index.addNew')
      });
    }
    else if (entityType === EntityType.CUSTOMER) {
      this.props.navigation.setParams({
        headerRightAction: () => this.props.navigation.navigate('AddNewCustomer', {
          goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
          isEditMode: false, CompanyKey: this.props.company.selectedCompany.Key,
          navigateFrom: this.props.navigation.state.params.navigateFrom ? this.props.navigation.state.params.navigateFrom : null
        }),
        headerRightText: i18n.t('AddNewCustomer.index.addNew')
      });
    }
    else if (entityType === EntityType.SUPPLIER) {
      this.props.navigation.setParams({
        headerRightAction: () => this.props.navigation.navigate('AddNewSupplier', {
          goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
          isEditMode: false, CompanyKey: this.props.company.selectedCompany.Key,
          navigateFrom: this.props.navigation.state.params.navigateFrom ? this.props.navigation.state.params.navigateFrom : null
        }),
        headerRightText: i18n.t('AddNewSupplier.index.addNew')
      });
    }

  }

  _getFilterList(entityType) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      return [{
        icon: 'ios-list-box-outline',
        text: i18n.t('SearchView.index.all'),
        size: 26,
        filter: new Map().set('StatusCode-ne', [OrderStatusCodes.DRAFT])
      }, {
        icon: 'ios-contact',
        text: i18n.t('SearchView.index.myoders'),
        size: 30,
        filter: new Map().set()
      }, {
        icon: 'ios-paper-outline',
        text: i18n.t('SearchView.index.drafts'),
        size: 26,
        filter: new Map().set('StatusCode-eq', [OrderStatusCodes.DRAFT])
      }, {
        icon: 'ios-people-outline',
        text: i18n.t('SearchView.index.others'),
        size: 30,
        filter: new Map().set('StatusCode-eq', [OrderStatusCodes.REGISTERED, OrderStatusCodes.COMPLETED])
      }, {
        icon: 'ios-pulse',
        text: i18n.t('SearchView.index.ongoing'),
        size: 28,
        filter: new Map().set('StatusCode-eq', [OrderStatusCodes.PARTIALLY_TRANSFERRED_TO_INVOICE])
      }, {
        icon: 'ios-refresh-circle-outline',
        text: i18n.t('SearchView.index.transferred'),
        size: 30,
        filter: new Map().set('StatusCode-eq', [OrderStatusCodes.TRANSFERRED_TO_INVOICE])
      }];
    }
    else if (entityType === EntityType.CUSTOMER_INVOICE) {
      return [{
        icon: 'ios-list-box-outline',
        text: i18n.t('SearchView.index.all'),
        size: 26,
        filter: new Map().set('FilterName', 'all')
      }, {
        icon: 'ios-contact',
        text: i18n.t('SearchView.index.myInvoices'),
        size: 30,
        filter: new Map().set('FilterName', 'mine')
      }, {
        icon: 'ios-document-outline',
        text: i18n.t('SearchView.index.drafts'),
        size: 30,
        filter: new Map().set('FilterName', 'draft')
      }, {
        icon: 'ios-paper-outline',
        text: i18n.t('SearchView.index.invoiced'),
        size: 26,
        filter: new Map().set('FilterName', 'invoiced')
      }, {
        icon: 'ios-timer-outline',
        text: i18n.t('SearchView.index.overdue'),
        size: 28,
        filter: new Map().set('FilterName', 'overdue')
      }, {
        icon: 'ios-stopwatch-outline',
        text: i18n.t('SearchView.index.reminders'),
        size: 28,
        filter: new Map().set('FilterName', 'reminders')
      }, {
        icon: 'ios-hand-outline',
        text: i18n.t('SearchView.index.sendToDebtCollection'),
        size: 28,
        filter: new Map().set('FilterName', 'sendToDebtCollection')
      }, {
        icon: 'ios-cash-outline',
        text: i18n.t('SearchView.index.paid'),
        size: 26,
        filter: new Map().set('FilterName', 'paid')
      }, {
        icon: 'ios-done-all-outline',
        text: i18n.t('SearchView.index.credited'),
        size: 40,
        filter: new Map().set('FilterName', 'credited')
      }];
    }
    if (entityType === EntityType.CUSTOMER_QUOTE) {
      return [{
        icon: 'ios-list-box-outline',
        text: i18n.t('SearchView.index.all'),
        size: 26,
        filter: new Map().set('StatusCode-ne', [QuoteStatusCodes.DRAFT])
      }, {
        icon: 'ios-contact',
        text: i18n.t('SearchView.index.myquotes'),
        size: 30,
        filter: new Map().set()
      }, {
        icon: 'ios-create-outline',
        text: i18n.t('SearchView.index.drafts'),
        size: 28,
        filter: new Map().set('StatusCode-eq', [QuoteStatusCodes.DRAFT])
      }, {
        icon: 'ios-paper-outline',
        text: i18n.t('SearchView.index.registered'),
        size: 28,
        filter: new Map().set('StatusCode-eq', [QuoteStatusCodes.REGISTERED])
      }, {
        icon: 'ios-copy-outline',
        text: i18n.t('SearchView.index.transferredToOrder'),
        size: 30,
        filter: new Map().set('StatusCode-eq', [QuoteStatusCodes.TRANSFERRED_TO_ORDER])
      }, {
        icon: 'ios-folder-outline',
        text: i18n.t('SearchView.index.transferredToInvoice'),
        size: 26,
        filter: new Map().set('StatusCode-eq', [QuoteStatusCodes.TRANSFERRED_TO_INVOICE])
      }, {
        icon: 'ios-done-all-outline',
        text: i18n.t('SearchView.index.completed'),
        size: 34,
        filter: new Map().set('StatusCode-eq', [QuoteStatusCodes.COMPLETED])
      }];
    }
    return [];
  }

  _getRecentSearchKeywords(entityType) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      return _.reverse(this.props.recentData.searchKeywords.CUSTOMER_ORDER.slice());
    }
    else if (entityType === EntityType.PRODUCT) {
      return _.reverse(this.props.recentData.searchKeywords.PRODUCT.slice());
    }
    else if (entityType === EntityType.CUSTOMER) {
      return _.reverse(this.props.recentData.searchKeywords.CUSTOMER.slice());
    }
    else if (entityType === EntityType.PHONEBOOK_SEARCH) {
      return _.reverse(this.props.recentData.searchKeywords.PHONEBOOK_SEARCH.slice());
    }
    else if (entityType === EntityType.CUSTOMER_INVOICE) {
      return _.reverse(this.props.recentData.searchKeywords.CUSTOMER_INVOICE.slice());
    }
    else if (entityType === EntityType.CUSTOMER_QUOTE) {
      return _.reverse(this.props.recentData.searchKeywords.CUSTOMER_QUOTE.slice());
    }
    else if (entityType === EntityType.SUPPLIER) {
      return _.reverse(this.props.recentData.searchKeywords.SUPPLIER.slice());
    }
    return [];
  }

  _getService(entityType) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      return OrderService.searchOrders;
    }
    else if (entityType === EntityType.PRODUCT) {
      return ProductService.searchProducts;
    }
    else if (entityType === EntityType.CUSTOMER) {
      return CustomerService.searchCustomers;
    }
    else if (entityType === EntityType.PHONEBOOK_SEARCH) {
      return PhonebookService.searchPhonebook;
    }
    else if (entityType === EntityType.CUSTOMER_INVOICE) {
      return CustomerInvoiceService.searchCustomersInvoices;
    }
    else if (entityType === EntityType.CUSTOMER_QUOTE) {
      return QuoteService.searchQuotes;
    }
    else if (entityType === EntityType.SUPPLIER) {
      return SupplierService.searchSupliers;
    }
    return null;
  }

  _getSearchListItem(entityType, props, onSelect, companyKey) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      return (
        <OrderSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.PRODUCT) {
      return (
        <ProductSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.CUSTOMER) {
      return (
        <CustomerSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.PHONEBOOK_SEARCH) {
      return (
        <PhonebookSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.CUSTOMER_INVOICE) {
      return (
        <CustomerInvoiceSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.CUSTOMER_QUOTE) {
      return (
        <QuoteSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    else if (entityType === EntityType.SUPPLIER) {
      return (
        <SupplierSearchListRow {...props} onSelect={onSelect} companyKey={companyKey} />
      );
    }
    return null;
  }

  _onItemSelect(entityType, item, companyKey) {
    if (entityType === EntityType.CUSTOMER_ORDER) {
      this.props.navigation.navigate('OrderDetails', {
        orderID: item.ID,
        EntityType: EntityType.CUSTOMER_ORDER,
        CompanyKey: companyKey,
      });
    }
    else if (entityType === EntityType.PRODUCT) {
      if (this.props.navigation.state.params.data.action) {
        switch (this.props.navigation.state.params.data.action) {
          case 'AddNewOrderItem':
            this.props.navigation.navigate('AddNewOrderItem', {
              orderID: this.props.navigation.state.params.data.orderID,
              productID: item.ID,
              EntityType: EntityType.PRODUCT,
              CompanyKey: companyKey,
              goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
              refreshData: this.props.navigation.state.params.data.refreshData ? this.props.navigation.state.params.data.refreshData : () => { },
              CurrencyCodeID: this.props.navigation.state.params.data.CurrencyCodeID ? this.props.navigation.state.params.data.CurrencyCodeID : null,
              CurrencyExchangeRate: this.props.navigation.state.params.data.CurrencyExchangeRate ? this.props.navigation.state.params.data.CurrencyExchangeRate : null,
              CurrencyCode: this.props.navigation.state.params.data.CurrencyCode ? this.props.navigation.state.params.data.CurrencyCode : { Code: '' },
            });
            break;
          case 'AddNewQuoteItem':
            this.props.navigation.navigate('AddNewQuoteItem', {
              quoteID: this.props.navigation.state.params.data.quoteID,
              productID: item.ID,
              EntityType: EntityType.PRODUCT,
              CompanyKey: companyKey,
              goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
              refreshData: this.props.navigation.state.params.data.refreshData ? this.props.navigation.state.params.data.refreshData : () => { },
              CurrencyCodeID: this.props.navigation.state.params.data.CurrencyCodeID ? this.props.navigation.state.params.data.CurrencyCodeID : null,
              CurrencyExchangeRate: this.props.navigation.state.params.data.CurrencyExchangeRate ? this.props.navigation.state.params.data.CurrencyExchangeRate : null,
              CurrencyCode: this.props.navigation.state.params.data.CurrencyCode ? this.props.navigation.state.params.data.CurrencyCode : { Code: '' },
            });
            break;
          case 'AddNewCustomerInvoiceItem':
            this.props.navigation.navigate('AddNewCustomerInvoiceItem', {
              customerInvoiceID: this.props.navigation.state.params.data.customerInvoiceID,
              productID: item.ID,
              EntityType: EntityType.PRODUCT,
              CompanyKey: companyKey,
              goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
              refreshData: this.props.navigation.state.params.data.refreshData ? this.props.navigation.state.params.data.refreshData : () => { },
              CurrencyCodeID: this.props.navigation.state.params.data.CurrencyCodeID ? this.props.navigation.state.params.data.CurrencyCodeID : null,
              CurrencyExchangeRate: this.props.navigation.state.params.data.CurrencyExchangeRate ? this.props.navigation.state.params.data.CurrencyExchangeRate : null,
              CurrencyCode: this.props.navigation.state.params.data.CurrencyCode ? this.props.navigation.state.params.data.CurrencyCode : { Code: '' },
            });
            break;
        }
      }
      else {
        this.props.navigation.navigate('ProductDetails', {
          productID: item.ID,
          EntityType: EntityType.PRODUCT,
          CompanyKey: companyKey
        });
      }
    }
    else if (entityType === EntityType.CUSTOMER) {
      this.props.navigation.navigate('CustomerDetails', {
        customerID: item.ID,
        EntityType: EntityType.CUSTOMER,
        CompanyKey: companyKey,
      });
    }
    else if (entityType === EntityType.PHONEBOOK_SEARCH) {
      if (this.props.navigation.state.params.data.origine != EntityType.SUPPLIER) {
        this.props.navigation.navigate('AddNewCustomer', {
          data: { ...item },
          goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
          isEdit: false
        });
      }
      else {
        this.props.navigation.navigate('AddNewSupplier', {
          data: { ...item },
          goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
          isEdit: false
        });
      }
    }
    else if (entityType === EntityType.SUPPLIER) {
      this.props.navigation.navigate('SupplierDetails', {
        supplierID: item.ID,
        EntityType: EntityType.SUPPLIER,
        CompanyKey: companyKey,
      });
    }
    else if (entityType === EntityType.CUSTOMER_INVOICE) {
      this.props.navigation.navigate('CustomerInvoiceDetails', {
        customerInvoiceID: item.ID,
        EntityType: EntityType.CUSTOMER_INVOICE,
        CompanyKey: companyKey,
      });
    }
    else if (entityType === EntityType.CUSTOMER_QUOTE) {
      this.props.navigation.navigate('QuoteDetails', {
        goBack: this.props.navigation.goBack ? this.props.navigation.goBack : () => { },
        isEdit: false,
        quoteID: item.ID,
        EntityType: 'quote',
      });
    }
  }

  clearSearch() {
    this.setState({
      searchText: '',
      showSearchResult: false,
      selectedFilterIndex: null,
      filterList: this.state.filterListOriginal,
    });
    Keyboard.dismiss();
  }

  fetchNextPage(caller) {
    const defaultSelectedFilter = this.selectDefaultFilterOnDefaultSearch();
    const companyKey = this.props.company.selectedCompany.Key;
    this.state.service(this.state.searchText, companyKey, this.state.searchResults.length, this.state.pageSize, this.state.filterList.length === 0 ? null : this.state.filterList[defaultSelectedFilter === null ? this.state.selectedFilterIndex : defaultSelectedFilter].filter)
      .then((response) => {
        if (response.ok) {
          const data = response.data.constructor === Array ? response.data : response.data.Data.constructor === Array ? response.data.Data : response.data;
          this.setState({
            searchResults: [...this.state.searchResults, ...data],
            hasNextPage: (data.length === this.state.pageSize),
            isLoading: false,
          });
        }
      })
      .catch((error) => { });
  }

  handleSearchResultsFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SearchView.index.somethingWrong')) {
    this.setState({ isLoading: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  handleFilterChange(selectedFilterIndex) {
    selectedFilterIndex !== null ? this.search() : this.clearSearch();
  }

  handleFilterTap(index) {
    const filterList = this.state.filterListOriginal.slice();
    let selectedFilterIndex = this.state.selectedFilterIndex;
    if (selectedFilterIndex === index) {
      selectedFilterIndex = null;
    } else {
      filterList[index] = { ...filterList[index], isSelected: true };
      selectedFilterIndex = index;
    }
    this.setState({ selectedFilterIndex, filterList }, () => {
      this.handleFilterChange(this.state.selectedFilterIndex);
      if (this.state.selectedFilterIndex !== null) {
        Analytics.trackEvent(AnalyticalEventNames.SEARCH_FILTER, {
          FilterName: this.state.filterList[this.state.selectedFilterIndex].text,
          Entity: this.props.navigation.state.params.data.entityType,
        });
      }
    });
  }

  onSearchItemSelect(item) {
    this._onItemSelect(this.state.entityType, item, this.props.company.selectedCompany.Key);
  }

  onRecentItemSelect(item) {
    this.setState({ searchText: item }, () => {
      this.search();
    });
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  onKeyPress() {
    this.search();
  }

  selectDefaultFilterOnDefaultSearch() {
    if (this.state.filterListOriginal.length !== 0 && this.state.selectedFilterIndex == null) {
      const selectedFilterIndex = this.state.defaultSelectedFilterIndex;
      const filterList = this.state.filterListOriginal.slice();
      filterList[selectedFilterIndex] = { ...filterList[selectedFilterIndex], isSelected: true };
      this.setState({ selectedFilterIndex, filterList });
      return selectedFilterIndex;
    }
    return null;
  }

  search() {
    Keyboard.dismiss();
    const defaultSelectedFilter = this.selectDefaultFilterOnDefaultSearch();
    this.setState({ showSearchResult: true, isLoading: true, searchResults: [] });
    this.state.service(this.state.searchText, this.props.company.selectedCompany.Key, 0, this.state.pageSize, this.state.filterList.length === 0 ? null : this.state.filterList[defaultSelectedFilter === null ? this.state.selectedFilterIndex : defaultSelectedFilter].filter)
      .then((response) => {
        if (response.ok) {
          const data = response.data.constructor === Array ? response.data : response.data.Data.constructor === Array ? response.data.Data : response.data;
          this.setState({ isLoading: false, showSearchResult: true, searchResults: [...data], hasNextPage: (data.length === this.state.pageSize) });
          this.props.updateSearchKeywords(this.state.entityType, this.state.searchText);
          if (data.length <= 0) {
            this.addNewItem();
          }

        }
      })
      .catch((error) => {
        this.setState({ isLoading: false, showSearchResult: true, searchResults: [] });
        this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('SearchView.index.somethingWrong'));
      });
  }

  renderFilterItem(index, icon, text, size = 24, isSelected = false) {
    return (
      <View style={styles.filterItem} key={index}>
        <TouchableOpacity onPress={this.handleFilterTap.bind(this, index)}>
          <View style={isSelected ? styles.filterItemIconActive : styles.filterItemIcon}>
            <Icon name={icon} size={size} color={isSelected ? theme.TEXT_COLOR_INVERT : theme.SCREEN_COLOR_GREY} style={[styles.filterIcon, Platform.OS === 'ios' ? styles.iosIconAlignment : {}]} />
          </View>
        </TouchableOpacity>
        <Text style={styles.filterItemText} ellipsizeMode={'tail'} numberOfLines={2}>
          {text}
        </Text>
      </View>
    );
  }

  renderPlaceholder(withActivityIndicator = false) {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        {withActivityIndicator ?
          <ActivityIndicator animating={true} size={'large'} color={theme.PRIMARY_COLOR} />
          :
          <View style={styles.placeholderContainer}>
            <Icon name="ios-list-box-outline" size={35} color={theme.DISABLED_ITEM_COLOR} />
            <Text style={styles.placeholderText}>{i18n.t('SearchView.index.noResultsFound')}</Text>
          </View>
        }
        <View style={styles.palceHolderSpacer} />
      </View>
    );
  }

  renderPlaceholderForNoSearchKeywords() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <View style={styles.placeholderContainer}>
          <Icon name="ios-list-box-outline" size={35} color={theme.DISABLED_ITEM_COLOR} />
          <Text style={styles.placeholderText}>{i18n.t('SearchView.index.noSearchKeywordsFound')}</Text>
        </View>
        <View style={styles.palceHolderSpacer} />
      </View>
    );
  }

  renderFooter() {
    if (this.state.hasNextPage) {
      return (
        <View style={styles.footerLoaderBox}>
          <ActivityIndicator
            animating={true}
            color={theme.PRIMARY_COLOR}
            size="small"
          />
        </View>
      );
    }
    else {
      return (
        <ListPaddingComponent height={isIphoneX() ? 80 : 50} />
      );
    }
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
        <View style={styles.searchPanel}>
          <View style={styles.row}>
            <View style={Platform.OS === 'ios' ? styles.textInputContainerIos : styles.textInputContainerAndroid}>
              <Icon name="ios-search" size={20} color={theme.DISABLED_ITEM_COLOR} />
              <TextInput
                style={styles.textInput}
                placeholder={this.props.navigation.state.params.data.placeholder ? this.props.navigation.state.params.data.placeholder : i18n.t('SearchView.index.textInputPlaceholder')}
                underlineColorAndroid={'rgba(0,0,0,0)'}
                onChangeText={(text) => { this.setState({ searchText: text }); }}
                value={this.state.searchText}
                returnKeyType={'search'}
                returnKeyLabel={'search'}
                onSubmitEditing={this.onKeyPress}
                blurOnSubmit={true}
                onBlur={() => Analytics.trackEvent(AnalyticalEventNames.ENTER_SEARCH_TEXT)}
                autoCorrect={false}
              />
              <TouchableOpacity onPress={this.clearSearch}>
                <View style={styles.closeButton}>
                  <Icon name="ios-close" size={18} color={theme.TEXT_COLOR_INVERT} style={styles.closeIcon} />
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={this.search}>
              <Text style={styles.searchText}>{i18n.t('SearchView.index.search')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {this.state.filterListOriginal.length > 0 ?
          <View style={styles.filterPanel}>
            <View style={styles.column}>
              <Text style={styles.filterTitle}>{i18n.t('SearchView.index.filterYourSearch')}</Text>
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                <View style={styles.filterList}>
                  {this.state.filterList.map((item, index) => {
                    return this.renderFilterItem(index, item.icon, item.text, item.size, item.isSelected);
                  })
                  }
                </View>
              </ScrollView>
            </View>
          </View>
          : null}

        <View style={styles.resultsContainer}>
          <View style={styles.row}>
            <Text style={styles.resultTitle}>{!this.state.showSearchResult ? i18n.t('SearchView.index.yourRecentSearches') : i18n.t('SearchView.index.yourSearchResults')}</Text>

          </View>
        </View>
        {this.state.isLoading ? this.renderPlaceholder(true) : null}

        {this.state.showSearchResult ?
          this.state.searchResults.length !== 0 ?
            <FlatList
              keyExtractor={(item, index) => item.ID}
              data={this.state.searchResults}
              renderItem={props => this._getSearchListItem(this.state.entityType, props, this.onSearchItemSelect, this.props.company.selectedCompany.Key)}
              ListHeaderComponent={() => <ListPaddingComponent height={0} />}
              ListFooterComponent={this.renderFooter}
              onEndReached={this.onEndReached}
              onEndReachedThreshold={0.3}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            />
            : null
          :
          this._getRecentSearchKeywords(this.state.entityType).length !== 0 ?
            <FlatList
              keyExtractor={(item, index) => index}
              data={this._getRecentSearchKeywords(this.state.entityType)}
              renderItem={props => <RecentSearchListRow {...props} onSelect={this.onRecentItemSelect} />}
              ListHeaderComponent={() => <ListPaddingComponent height={0} />}
              ListFooterComponent={() => <ListPaddingComponent height={isIphoneX() ? 80 : 30} />}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            />
            : this.renderPlaceholderForNoSearchKeywords()
        }
        {!this.state.isLoading && this.state.searchResults.length === 0 && this.state.showSearchResult ? this.renderPlaceholder(false) : null}

        {this.state.showSearchResult ?
          <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref} additionalBottomHeight={isIphoneX() ? 20 : 0}>
            <GenericButton text={i18n.t('SearchView.index.clearSearch')} textStyle={styles.clearSearchText} buttonStyle={styles.clearSearchButton} onPress={this.clearSearch} />
          </FloatingBottomContainer>
          : null}

      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    recentData: state.recentData,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateSearchKeywords: (entityType, searchKeyword) => dispatch(updateSearchKeywords(entityType, searchKeyword)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchView);

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPanel: {
    padding: 15,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.PRIMARY_COLOR,
  },
  textInputContainerIos: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
    borderRadius: 8,
    marginRight: 10,
  },
  textInputContainerAndroid: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
    borderRadius: 8,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    marginHorizontal: 10,
  },
  closeButton: {
    width: 16,
    borderRadius: 18,
    height: 16,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  iosIconAlignment: {
    marginTop: 3,
  },
  closeIcon: {
    marginTop: Platform.OS === 'android' ? 0 : -1,
    marginLeft: Platform.OS === 'android' ? 0 : 1,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  filterPanel: {
    paddingHorizontal: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR,
  },
  filterList: {
    flexDirection: 'row',
    paddingVertical: 15,
  },
  filterItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8
  },
  filterItemIconActive: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 40,
    marginBottom: 5,
    backgroundColor: theme.PRIMARY_COLOR,
  },
  filterItemIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 40,
    marginBottom: 5,
    backgroundColor: theme.PRIMARY_BACKGROUND_COLOR,
    borderColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    borderWidth: 1,
  },
  filterItemText: {
    fontSize: 11,
    marginHorizontal: -5,
    textAlign: 'center',
    color: theme.DISABLED_ITEM_COLOR,
  },
  resultsContainer: {
    paddingTop: 0,
  },
  resultTitle: {
    padding: 15,
    paddingRight: 5,
    fontSize: 16,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  palceHolderSpacer: {
    height: 150,
  },
  clearSearchButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginHorizontal: 30,
  },
  clearSearchText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
