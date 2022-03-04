// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { NavigationActions, StackActions } from 'react-navigation';
import _ from 'lodash';
import Analytics from 'appcenter-analytics';

import { theme } from '../../styles';
import { createGuid } from '../../helpers/APIUtil';
import { EntityType } from '../../constants/EntityTypes';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import GenericButton from '../../components/GenericButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ViewWrapper from '../../components/ViewWrapper';
import CustomerService from '../../services/CustomerService';
import ProjectService from '../../services/ProjectService';
import CompanyService from '../../services/CompanyService';
import OrderService from '../../services/OrderService';
import SellerService from '../../services/SellerService';
import CurrencyService from '../../services/CurrencyService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { addNewAddressToList, clearAddressList, setAddressList } from '../../actions/addressListActions';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import TermsService from '../../services/TermsService';

class CreateOrder extends Component {

  static navigationOptions = (props) => {
    const { navigation } = props;
    return {
      title: navigation.state.params.isViewOnly ? i18n.t('OrderDetails.index.title')
        : (navigation.state.params.isEdit ? i18n.t('CreateOrder.index.editTitle') : i18n.t('CreateOrder.index.title')),
      headerRight: navigation.state.params.isViewOnly ? <HeaderTextButton /> :
      <HeaderTextButton
          position={'right'}
          isActionComplete={navigation.state.params.isActionComplete}
          onPress={navigation.state.params.handleCreation}
          text={navigation.state.params.isEdit
            ? i18n.t('CreateOrder.index.save')
            : i18n.t('CreateOrder.index.create')}
        />,
      headerLeft: <HeaderTextButton
        navigate={navigation.navigate}
        onPress={() => { Keyboard.dismiss(); navigation.state.params.clearAddressData(); navigation.goBack(); }}
        text={i18n.t('CreateOrder.index.cancel')}
        position="left"
        isActionComplete={navigation.state.params.isActionComplete}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      isDateTimePickerVisible: false,
      picker: '',
      initialDate: moment(),
      isUploading: false,
      moveAnimation: new Animated.Value(0),
      orderDetails: {
        CustomerID: '',
        CustomerNumber: '',
        Customer: '',
        CurrencyCodeID: '1',
        CurrencyCode: 'NOK',
        CurrencyExchangeRate: '',
        Items: [],
        Project: '',
        DepartmentID: '',
        Department: '',
        DefaultDimensions: null,
        DefaultDimensionsID: null,
        DefaultSellerID: '',
        DefaultSeller: '',
        YourReference: '',
        OurReference: this.props.user.activeUser.displayName,
        EmailAddress: '',
        OrderDate: moment(),
        DeliveryDate: moment().add(14, 'days'),
        DeliveryAddress: {
          City: '',
          PostalCode: '',
          AddressLine1: '',
          AddressLine2: '',
          AddressLine3: '',
          Country: '',
          CountryCode: null,
          CountryId: null,
          ID: null,
        },
        BillingAddress: {
          City: '',
          PostalCode: '',
          AddressLine1: '',
          AddressLine2: '',
          AddressLine3: '',
          Country: '',
          CountryCode: null,
          CountryId: null,
          ID: null,
        },
        PaymentTerms : null,
        PaymentTermsID : null,
        DeliveryTerms: null,
        DeliveryTermsID: null,
        DeliveryAddressArrayIndex: null,
        BillingAddressArrayIndex: null,
      },
      errors: {
        Customer: null,
        CurrencyCode: null,
        Project: null,
        Department: null,
        DefaultSeller: null,
        YourReference: null,
        OurReference: null,
        EmailAddress: null,
        OrderDate: null,
        DeliveryDate: null,
        DeliveryAddress: null,
        BillingAddress: null,
        PaymentTerms: null,
        DeliveryTerms: null
      }
    };

    this.orderID = 0;
    this.isActionComplete = false;
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.handleCreation = this.handleCreation.bind(this);
    this._showDatePicker = this._showDatePicker.bind(this);
    this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
    this._handleDatePicked = this._handleDatePicked.bind(this);
    this.onCustomerSelect = this.onCustomerSelect.bind(this);
    this.setCustomer = this.setCustomer.bind(this);
    this.onCurrencyCodeSelect = this.onCurrencyCodeSelect.bind(this);
    this.setCurrencyCode = this.setCurrencyCode.bind(this);
    this.clearChanges = this.clearChanges.bind(this);
    this.onDefaultSellerSelect = this.onDefaultSellerSelect.bind(this);
    this.setDefaultSeller = this.setDefaultSeller.bind(this);
    this.onProjectSelect = this.onProjectSelect.bind(this);
    this.onDepartmentSelect = this.onDepartmentSelect.bind(this);
    this.setProject = this.setProject.bind(this);
    this.setDepartment = this.setDepartment.bind(this);
    this.clearDefaultSeller = this.clearDefaultSeller.bind(this);
    this.clearProject = this.clearProject.bind(this);
    this.clearDepartment = this.clearDepartment.bind(this);
    this.onPressDeliveryAddress = this.onPressDeliveryAddress.bind(this);
    this.clearDeliveryAddress = this.clearDeliveryAddress.bind(this);
    this.setDeliveryAddress = this.setDeliveryAddress.bind(this);
    this.setBillinAddress = this.setBillinAddress.bind(this);
    this.onPressBillingAddress = this.onPressBillingAddress.bind(this);
    this.clearBillingAddress = this.clearBillingAddress.bind(this);
    this.onPaymentTermSelect = this.onPaymentTermSelect.bind(this);
    this.onDeliveryTermSelect = this.onDeliveryTermSelect.bind(this);
    this.setPaymentTerm = this.setPaymentTerm.bind(this);
    this.setDeliveryTerm = this.setDeliveryTerm.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams(
      {
        isActionComplete: this.isActionComplete,
        handleCreation: this.handleCreation,
        clearAddressData: this.props.clearAddressList
      }
    );
  }

  componentDidMount() {
    if (this.props.navigation.state.params.isEdit || this.props.navigation.state.params.isViewOnly) {
      const obj = { AddressLine1: '', AddressLine2: '', AddressLine3: '', City: '', Country: '', CountryCode: '', CountryId: null, ID: null, PostalCode: '' };
      const { orderData } = this.props.navigation.state.params;
      const DeliveryAddress = {
        City: orderData.ShippingCity ? orderData.ShippingCity : '',
        PostalCode: orderData.ShippingPostalCode ? orderData.ShippingPostalCode : '',
        AddressLine1: orderData.ShippingAddressLine1 ? orderData.ShippingAddressLine1 : '',
        AddressLine2: orderData.ShippingAddressLine2 ? orderData.ShippingAddressLine2 : '',
        AddressLine3: orderData.ShippingAddressLine3 ? orderData.ShippingAddressLine3 : '',
        Country: orderData.ShippingCountry ? orderData.ShippingCountry : '',
        CountryCode: orderData.ShippingCountryCode ? orderData.ShippingCountryCode : '',
        CountryId: null,
        ID: null,
      };
      const BillingAddress = {
        City: orderData.InvoiceCity ? orderData.InvoiceCity : '',
        PostalCode: orderData.InvoicePostalCode ? orderData.InvoicePostalCode : '',
        AddressLine1: orderData.InvoiceAddressLine1 ? orderData.InvoiceAddressLine1 : '',
        AddressLine2: orderData.InvoiceAddressLine2 ? orderData.InvoiceAddressLine2 : '',
        AddressLine3: orderData.InvoiceAddressLine3 ? orderData.InvoiceAddressLine3 : '',
        Country: orderData.InvoiceCountry ? orderData.InvoiceCountry : '',
        CountryCode: orderData.InvoiceCountryCode ? orderData.InvoiceCountryCode : '',
        CountryId: null,
        ID: null,
      };
      this.setState({
        orderDetails: {
          CustomerID: orderData.CustomerID ? orderData.CustomerID : '',
          CustomerNumber: orderData.Customer && orderData.Customer.CustomerNumber ? orderData.Customer.CustomerNumber : '',
          Customer: orderData.CustomerName ? orderData.CustomerName : '',
          CurrencyCodeID: orderData.CurrencyCodeID ? orderData.CurrencyCodeID : '',
          CurrencyCode: orderData.CurrencyCode ? orderData.CurrencyCode.Code : '',
          CurrencyExchangeRate: orderData.CurrencyExchangeRate ? orderData.CurrencyExchangeRate : '',
          Items: orderData.Items ? orderData.Items : [],
          Project: orderData.DefaultDimensions && orderData.DefaultDimensions.Project ? orderData.DefaultDimensions.Project.Name : '',
          ProjectNumber: orderData.DefaultDimensions && orderData.DefaultDimensions.Project ? orderData.DefaultDimensions.Project.ProjectNumber : '',
          Department: orderData.DefaultDimensions && orderData.DefaultDimensions.Department ? orderData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: orderData.DefaultDimensions && orderData.DefaultDimensions.Department ? orderData.DefaultDimensions.Department.DepartmentNumber : '',
          DefaultDimensions: orderData.DefaultDimensions ? orderData.DefaultDimensions : null,
          DefaultDimensionsID: orderData.DefaultDimensionsID ? orderData.DefaultDimensionsID : null,
          DefaultSellerID: orderData.DefaultSellerID ? orderData.DefaultSellerID : '',
          DefaultSeller: orderData.DefaultSeller ? orderData.DefaultSeller.Name : '',
          YourReference: orderData.YourReference ? orderData.YourReference : '',
          OurReference: orderData.OurReference ? orderData.OurReference : '',
          EmailAddress: orderData.EmailAddress ? orderData.EmailAddress : '',
          OrderDate: orderData.OrderDate ? moment(orderData.OrderDate) : '',
          DeliveryDate: orderData.DeliveryDate != null ? moment(orderData.DeliveryDate) : moment().add(14, 'days'),
          DeliveryAddress: { ...DeliveryAddress },
          BillingAddress: { ...BillingAddress },
          BillingAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? 0 : null,
          DeliveryAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? !_.isEqualWith(DeliveryAddress, obj) ? _.isEqual(this.state.orderDetails.BillingAddress, this.state.orderDetails.DeliveryAddress) ? 0 : 1 : null : !_.isEqualWith(DeliveryAddress, obj) ? 0 : null, // set the index of seleceted address accroding to availability of billing and delivery address
          PaymentTerms: orderData.PaymentTerms ? orderData.PaymentTerms : null,
          PaymentTermsID: orderData.PaymentTerms ? orderData.PaymentTermsID : null,
          DeliveryTerms: orderData.DeliveryTerms ? orderData.DeliveryTerms : null,
          DeliveryTermsID: orderData.DeliveryTerms ? orderData.DeliveryTermsID : null,
        }
      }, () => {
        if (_.isEqual(this.state.orderDetails.BillingAddress, this.state.orderDetails.DeliveryAddress) && !_.isEqualWith(this.state.orderDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.orderDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.orderDetails.BillingAddress, obj) && !_.isEqualWith(this.state.orderDetails.DeliveryAddress, obj) && !_.isEqual(this.state.orderDetails.BillingAddress, this.state.orderDetails.DeliveryAddress)) {
          this.props.setAddressList([this.state.orderDetails.BillingAddress, this.state.orderDetails.DeliveryAddress]);
        }
        else if (!_.isEqualWith(this.state.orderDetails.BillingAddress, obj)) {
          this.props.setAddressList([this.state.orderDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.orderDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.orderDetails.DeliveryAddress]);
        }
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.addressList.lastEditedTime !== this.props.addressList.lastEditedTime)) {
      if (nextProps.addressList.lastEditedIndex === this.state.orderDetails.BillingAddressArrayIndex) {
        this.setBillinAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex);
      }
      if (nextProps.addressList.lastEditedIndex === this.state.orderDetails.DeliveryAddressArrayIndex) {
        setTimeout(() => { this.setDeliveryAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex); }, 500);
      }
    }
  }

  handleCreateOrderErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('CreateOrder.index.somethingWrong')) {
    this.setState({ isUploading: false });
    this.startAnimation(true);
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
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

  handleCreation() {
    Keyboard.dismiss();
    if (!this.state.isUploading && this.isValid()) {
      this.isActionComplete = true;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.startAnimation();
      this.setState({ isUploading: true });
      this.createOrder(this.handleCreation);
    } else {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    }
  }

  clearChanges() {
    if (this.props.navigation.state.params.isEdit) {
      const { orderData } = this.props.navigation.state.params;
      this.setState({
        orderDetails: {
          CustomerID: orderData.CustomerID ? orderData.CustomerID : '',
          CustomerNumber: orderData.Customer && orderData.Customer.CustomerNumber ? orderData.Customer.CustomerNumber : '',
          Customer: orderData.CustomerName ? orderData.CustomerName : '',
          CurrencyCodeID: orderData.CurrencyCodeID ? orderData.CurrencyCodeID : '',
          CurrencyCode: orderData.CurrencyCode ? orderData.CurrencyCode.Code : '',
          Department: orderData.DefaultDimensions && orderData.DefaultDimensions.Department ? orderData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: orderData.DefaultDimensions && orderData.DefaultDimensions.Department ? orderData.DefaultDimensions.Department.DepartmentNumber : '',
          Project: orderData.DefaultDimensions && orderData.DefaultDimensions.Project ? orderData.DefaultDimensions.Project.Name : '',
          ProjectNumber: orderData.DefaultDimensions && orderData.DefaultDimensions.Project ? orderData.DefaultDimensions.Project.ProjectNumber : '',
          DefaultDimensions: orderData.DefaultDimensions ? orderData.DefaultDimensions : null,
          DefaultDimensionsID: orderData.DefaultDimensionsID ? orderData.DefaultDimensionsID : null,
          DefaultSellerID: orderData.DefaultSellerID ? orderData.DefaultSellerID : '',
          DefaultSeller: orderData.DefaultSeller ? orderData.DefaultSeller.Name : '',
          YourReference: orderData.YourReference ? orderData.YourReference : '',
          OurReference: orderData.OurReference ? orderData.OurReference : '',
          EmailAddress: orderData.EmailAddress ? orderData.EmailAddress : '',
          OrderDate: orderData.OrderDate ? moment(orderData.OrderDate) : '',
          DeliveryDate: orderData.DeliveryDate ? moment(orderData.DeliveryDate) : '',

          DeliveryAddress: {
            City: orderData.ShippingCity ? orderData.ShippingCity : '',
            PostalCode: orderData.ShippingPostalCode ? orderData.ShippingPostalCode : '',
            AddressLine1: orderData.ShippingAddressLine1 ? orderData.ShippingAddressLine1 : '',
            AddressLine2: orderData.ShippingAddressLine2 ? orderData.ShippingAddressLine2 : '',
            AddressLine3: orderData.ShippingAddressLine3 ? orderData.ShippingAddressLine3 : '',
            Country: orderData.ShippingCountry ? orderData.ShippingCountry : '',
            CountryCode: orderData.ShippingCountryCode ? orderData.ShippingCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddress: {
            City: orderData.InvoiceCity ? orderData.InvoiceCity : '',
            PostalCode: orderData.InvoicePostalCode ? orderData.InvoicePostalCode : '',
            AddressLine1: orderData.InvoiceAddressLine1 ? orderData.InvoiceAddressLine1 : '',
            AddressLine2: orderData.InvoiceAddressLine2 ? orderData.InvoiceAddressLine2 : '',
            AddressLine3: orderData.InvoiceAddressLine3 ? orderData.InvoiceAddressLine3 : '',
            Country: orderData.InvoiceCountry ? orderData.InvoiceCountry : '',
            CountryCode: orderData.InvoiceCountryCode ? orderData.InvoiceCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddressArrayIndex: orderData.InvoiceAddressLine1 ? 0 : null,
          DeliveryAddressArrayIndex: orderData.ShippingAddressLine1 ? 0 : null,
          PaymentTerms: orderData.PaymentTerms ? orderData.PaymentTerms : null,
          PaymentTermsID: orderData.PaymentTerms ? orderData.PaymentTermsID : null,
          DeliveryTerms: orderData.DeliveryTerms ? orderData.DeliveryTerms : null,
          DeliveryTermsID: orderData.DeliveryTerms ? orderData.DeliveryTermsID : null,
        }
      });
    } else {
      this.setState({
        orderDetails: {
          CustomerID: '',
          CustomerNumber: '',
          Customer: '',
          CurrencyCodeID: '1',
          CurrencyCode: 'NOK',
          Project: '',
          ProjectNumber: '',
          Department: '',
          DepartmentNumber: '',
          DefaultDimensions: null,
          DefaultDimensionsID: null,
          DefaultSellerID: '',
          DefaultSeller: '',
          YourReference: '',
          OurReference: this.props.user.activeUser.displayName,
          EmailAddress: '',
          OrderDate: moment(),
          DeliveryAddress: {
            City: '',
            PostalCode: '',
            AddressLine1: '',
            AddressLine2: '',
            AddressLine3: '',
            Country: '',
            CountryCode: null,
            CountryId: null,
            ID: null,
          },
          BillingAddress: {
            City: '',
            PostalCode: '',
            AddressLine1: '',
            AddressLine2: '',
            AddressLine3: '',
            Country: '',
            CountryCode: null,
            CountryId: null,
            ID: null,
          },
          DeliveryAddressArrayIndex: null,
          BillingAddressArrayIndex: null,
          PaymentTermsID: null,
          PaymentTerms: null,
          DeliveryTerms: null,
          DeliveryTermsID: null,
        },
        errors: {
          Customer: null,
          CurrencyCode: null,
          Project: null,
          Department: null,
          DefaultSeller: null,
          YourReference: null,
          OurReference: null,
          EmailAddress: null,
          OrderDate: null,
          DeliveryAddress: null,
          BillingAddress: null,
        }
      });
    }
  }

  async createOrder(caller) {
    try {
      const orderDetails = this.state.orderDetails;
      let order = {};

      if (this.props.navigation.state.params.isEdit) {
        const previousData = this.props.navigation.state.params.orderData;
        order = {
          CurrencyCodeID: orderDetails.CurrencyCodeID,
          CurrencyExchangeRate: orderDetails.CurrencyExchangeRate,
          CustomerID: orderDetails.CustomerID,
          CustomerName: orderDetails.Customer,
          Items: orderDetails.Items,
          Sellers: previousData.Sellers ? previousData.Sellers : [],
          ID: previousData.ID,
          OrderDate: orderDetails.OrderDate ? orderDetails.OrderDate.format('YYYY-MM-DD') : null,
          DeliveryDate: orderDetails.DeliveryDate ? orderDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          InvoiceAddressLine1: orderDetails.BillingAddress.AddressLine1 ? orderDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: orderDetails.BillingAddress.AddressLine2 ? orderDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: orderDetails.BillingAddress.AddressLine3 ? orderDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: orderDetails.BillingAddress.City ? orderDetails.BillingAddress.City : null,
          InvoiceCountry: orderDetails.BillingAddress.Country ? orderDetails.BillingAddress.Country : null,
          InvoiceCountryCode: orderDetails.BillingAddress.CountryCode ? orderDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: orderDetails.BillingAddress.PostalCode ? orderDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: orderDetails.DeliveryAddress.AddressLine1 ? orderDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: orderDetails.DeliveryAddress.AddressLine2 ? orderDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: orderDetails.DeliveryAddress.AddressLine3 ? orderDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: orderDetails.DeliveryAddress.City ? orderDetails.DeliveryAddress.City : null,
          ShippingCountry: orderDetails.DeliveryAddress.Country ? orderDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: orderDetails.DeliveryAddress.CountryCode ? orderDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: orderDetails.DeliveryAddress.PostalCode ? orderDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: orderDetails.PaymentTermsID,
          PaymentTerms: orderDetails.PaymentTerms,
          DeliveryTermsID: orderDetails.DeliveryTermsID,
          DeliveryTerms: orderDetails.DeliveryTerms,
          YourReference: orderDetails.YourReference ?  orderDetails.YourReference : null,
          OurReference: orderDetails.OurReference ?  orderDetails.OurReference : null,
          EmailAddress: orderDetails.EmailAddress ?  orderDetails.EmailAddress : null,
        };
        orderDetails.DefaultSellerID ? order.DefaultSellerID = orderDetails.DefaultSellerID : null;
        orderDetails.DefaultDimensions ? order.DefaultDimensions = orderDetails.DefaultDimensions : null;

        await OrderService.editOrderDetails(this.props.company.selectedCompany.Key, previousData.ID, order);
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Customer Order' });
      } else {
        order = {
          CurrencyCodeID: orderDetails.CurrencyCodeID,
          CustomerID: orderDetails.CustomerID,
          CustomerName: orderDetails.Customer,
          OrderDate: orderDetails.OrderDate ? orderDetails.OrderDate.format('YYYY-MM-DD') : null,
          DeliveryDate: orderDetails.DeliveryDate ? orderDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          Sellers: [],
          InvoiceAddressLine1: orderDetails.BillingAddress.AddressLine1 ? orderDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: orderDetails.BillingAddress.AddressLine2 ? orderDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: orderDetails.BillingAddress.AddressLine3 ? orderDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: orderDetails.BillingAddress.City ? orderDetails.BillingAddress.City : null,
          InvoiceCountry: orderDetails.BillingAddress.Country ? orderDetails.BillingAddress.Country : null,
          InvoiceCountryCode: orderDetails.BillingAddress.CountryCode ? orderDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: orderDetails.BillingAddress.PostalCode ? orderDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: orderDetails.DeliveryAddress.AddressLine1 ? orderDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: orderDetails.DeliveryAddress.AddressLine2 ? orderDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: orderDetails.DeliveryAddress.AddressLine3 ? orderDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: orderDetails.DeliveryAddress.City ? orderDetails.DeliveryAddress.City : null,
          ShippingCountry: orderDetails.DeliveryAddress.Country ? orderDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: orderDetails.DeliveryAddress.CountryCode ? orderDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: orderDetails.DeliveryAddress.PostalCode ? orderDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: orderDetails.PaymentTermsID,
          PaymentTerms: orderDetails.PaymentTerms,
          DeliveryTermsID: orderDetails.DeliveryTermsID,
          DeliveryTerms: orderDetails.DeliveryTerms
        };
        orderDetails.YourReference ? order.YourReference = orderDetails.YourReference : null;
        orderDetails.OurReference ? order.OurReference = orderDetails.OurReference : null;
        orderDetails.EmailAddress ? order.EmailAddress = orderDetails.EmailAddress : null;
        orderDetails.DefaultSellerID ? order.DefaultSeller = { ID: orderDetails.DefaultSellerID } : null;
        orderDetails.DefaultSellerID ? order.DefaultSellerID = orderDetails.DefaultSellerID : null;
        orderDetails.DefaultDimensions ? order.DefaultDimensions = orderDetails.DefaultDimensions : null;

        const orderResponse = await OrderService.createOrder(this.props.company.selectedCompany.Key, order);
        this.orderID = orderResponse.data.ID;
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Customer Order' });
      }
      if (this.props.navigation.state.params.refreshData) {
        this.props.navigation.goBack();
        this.props.navigation.state.params.refreshData();
      } else {
        this.props.resetToOrderDetails({
          orderID: this.orderID,
          EntityType: 'customerorder',
          CompanyKey: this.props.company.selectedCompany.Key,
        });
      }
      this.props.clearAddressList();
      this.props.updateOrderList();
      this.startAnimation(true);
    } catch (error) {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.handleCreateOrderErrors(error.problem, caller, this.props.navigation.state.params.isEdit
        ? i18n.t('CreateOrder.index.saveOrderError')
        : i18n.t('CreateOrder.index.createOrderError'));
    }
  }

  isValidEmail(email) {
    return email.match(/\S+@\S+\.\S+/);
  }

  isValid() {
    const errors = {};
    if (!this.state.orderDetails.CustomerID || !this.state.orderDetails.Customer) {
      errors.Customer = i18n.t('CreateOrder.index.customerError');
    }
    if (!this.state.orderDetails.CurrencyCodeID || !this.state.orderDetails.CurrencyCode) {
      errors.CurrencyCode = i18n.t('CreateOrder.index.currencyError');
    }
    if (this.state.orderDetails.EmailAddress && !this.isValidEmail(this.state.orderDetails.EmailAddress)) {
      errors.EmailAddress = i18n.t('CreateOrder.index.emailError');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
  }

  _showDatePicker(picker) {
    this.setState({ isDateTimePickerVisible: true, picker, initialDate: this.state.orderDetails[picker] });
  }

  _handleDatePicked(date) {
    let _date;
    if (this.state.picker === 'OrderDate') {
      _date = { OrderDate: moment(date) };
      this.setState({ isDateTimePickerVisible: false, orderDetails: { ...this.state.orderDetails, ..._date } });
    } else if (this.state.picker === 'DeliveryDate') {
      if (date >= moment().startOf('day')) {
        _date = { DeliveryDate: moment(date) };
        this.setState({ isDateTimePickerVisible: false, orderDetails: { ...this.state.orderDetails, ..._date } });
      }
      else {
        Alert.alert(i18n.t('CreateOrder.index.alertHeader'), i18n.t('CreateOrder.index.deliveryDateMessage'));
      }
    }
  }

  _hideDateTimePicker() {
    this.setState({ isDateTimePickerVisible: false });
  }

  onCustomerSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Customer: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchCustomer'),
        searchCriteria: i18n.t('CreateOrder.index.searchCustomerId'),
        entityType: EntityType.CUSTOMER,
        setter: this.setCustomer,
        service: CustomerService.getCustomers.bind(null, this.props.company.selectedCompany.Key),
        filter: (customer, serachText) => this.filterCustomer(customer, serachText)

      },
      navigateFrom: 'CreateOrder'
    });
  }

  filterCustomer(customer, serachText) {
    if (customer.CustomerNumber.toString().indexOf(serachText) !== -1
      || customer.Info.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1) {
      return customer;
    } else {
      return null;
    }
  }

  setCustomer(customer, from = null) {
    const order = {
      CustomerID: customer.ID,
      CustomerNumber: customer.CustomerNumber,
      Customer: customer.Info.Name,
      EmailAddress: customer.Info.DefaultEmail && customer.Info.DefaultEmail.EmailAddress ? customer.Info.DefaultEmail.EmailAddress : '',
      BillingAddress: customer.Info.InvoiceAddress ? customer.Info.InvoiceAddress : '',
      DeliveryAddress: customer.Info.ShippingAddress ? customer.Info.ShippingAddress : '',
      PaymentTerms: customer.PaymentTerms ? customer.PaymentTerms : null,
      PaymentTermsID: customer.PaymentTerms ? customer.PaymentTerms.ID : null,
      DeliveryTerms: customer.DeliveryTerms ? customer.DeliveryTerms : null,
      DeliveryTermsID: customer.DeliveryTerms ? customer.DeliveryTerms.ID : null,
    };

    if (customer.DeliveryTerms && customer.DeliveryTerms.CreditDays) {
      order.DeliveryDate = moment(this.state.orderDetails.OrderDate).add(customer.DeliveryTerms.CreditDays, 'days');
    }

    if (from == null) {
      // set addressList and selected address index of the list when fetching addresses from customer details
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        order.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        order.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        order.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        order.DeliveryAddressArrayIndex = this.props.addressList.addresses.length + 1;
      }
      else if (customer.Info.InvoiceAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        order.BillingAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        order.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
    }
    else {
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        order.BillingAddressArrayIndex = this.props.addressList.addresses.length - 2;
        order.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        order.BillingAddressArrayIndex = this.props.addressList.addresses.length - 1;
        order.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress) {
        order.BillingAddressArrayIndex = 0;
        order.DeliveryAddressArrayIndex = null;
      }
      else if (customer.Info.ShippingAddress) {
        order.BillingAddressArrayIndex = null;
        order.DeliveryAddressArrayIndex = 0;
      }
    }
    this.setState({
      orderDetails: {
        ...this.state.orderDetails,
        ...order,
      },
    });
  }

  onPaymentTermSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, PaymentTerms: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchPaymentTerms'),
        searchCriteria: i18n.t('CreateOrder.index.searchPaymentTermName'),
        entityType: EntityType.PAYMENT_TERMS,
        setter: this.setPaymentTerm,
        service: TermsService.getPaymentTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (paymentTerm, serachText) => this.filterPaymentTerm(paymentTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'CreateOrder'
    });
  }

  filterPaymentTerm(paymentTerm, serachText) {
    if (paymentTerm.Name.toString().indexOf(serachText) !== -1) {
      return paymentTerm;
    } else {
      return null;
    }
  }

  setPaymentTerm(paymentTerm, from = null) {
    const PaymentTerms = {
      CreditDays: paymentTerm.CreditDays,
      Description: paymentTerm.Description,
      ID: paymentTerm.ID,
      Name: paymentTerm.Name,
      StatusCode: paymentTerm.StatusCode,
      TermsType: paymentTerm.TermsType
    };
    this.setState({
      orderDetails: {
        ...this.state.orderDetails,
        PaymentTerms: { ...PaymentTerms },
        PaymentTermsID: PaymentTerms.ID
      },
    });
  }

  onDeliveryTermSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DeliveryTerms: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchDeliveryTerms'),
        searchCriteria: i18n.t('CreateOrder.index.searchDeliveryTermName'),
        entityType: EntityType.DELIVERY_TERMS,
        setter: this.setDeliveryTerm,
        service: TermsService.getDeliveryTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (deliveryTerm, serachText) => this.filterDeliveryTerm(deliveryTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'CreateOrder'
    });
  }

  filterDeliveryTerm(deliveryTerm, serachText) {
    if (deliveryTerm.Name.toString().indexOf(serachText) !== -1) {
      return deliveryTerm;
    } else {
      return null;
    }
  }

  setDeliveryTerm(paymentTerm, from = null) {
    const DeliveryTerms = {
      CreditDays: paymentTerm.CreditDays,
      Description: paymentTerm.Description,
      ID: paymentTerm.ID,
      Name: paymentTerm.Name,
      StatusCode: paymentTerm.StatusCode,
      TermsType: paymentTerm.TermsType
    };
    this.setState({
      orderDetails: {
        ...this.state.orderDetails,
        DeliveryTerms: { ...DeliveryTerms },
        DeliveryTermsID: DeliveryTerms.ID,
        DeliveryDate: moment(this.state.orderDetails.OrderDate).add(paymentTerm.CreditDays, 'days')
      },
    });
  }

  onDefaultSellerSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DefaultSeller: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchSeller'),
        searchCriteria: i18n.t('CreateOrder.index.seller'),
        showInstantResults: true,
        entityType: EntityType.SELLER,
        setter: this.setDefaultSeller,
        service: SellerService.getSellers.bind(null, this.props.company.selectedCompany.Key),
        filter: (seller, serachText) => this.filterSeller(seller, serachText),
        selectedItem: {
          ID: this.state.orderDetails.DefaultSellerID,
          Display: this.state.orderDetails.DefaultSeller,
        },
        clearSelectedItem: this.clearDefaultSeller,
      }
    });
  }

  clearDefaultSeller() {
    this.setState({ orderDetails: { ...this.state.orderDetails, DefaultSellerID: null, DefaultSeller: null } });
  }

  filterSeller(seller, serachText) {
    if (seller.ID.toString().indexOf(serachText) !== -1
      || seller.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1) {
      return seller;
    } else {
      return null;
    }
  }

  setDefaultSeller(seller) {
    this.setState({ orderDetails: { ...this.state.orderDetails, DefaultSellerID: seller.ID, DefaultSeller: seller.Name } });
  }

  onProjectSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Project: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchProject'),
        searchCriteria: i18n.t('CreateOrder.index.project'),
        showInstantResults: true,
        entityType: EntityType.PROJECT,
        setter: this.setProject,
        service: ProjectService.getProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
        selectedItem: {
          ID: this.state.orderDetails.ProjectNumber,
          Display: this.state.orderDetails.Project,
        },
        clearSelectedItem: this.clearProject,
      }
    });
  }

  clearProject() {
    const temp = this.state.orderDetails.DefaultDimensions || {};
    this.setState({ orderDetails: { ...this.state.orderDetails, Project: null, ProjectNumber: null, DefaultDimensions: { ...temp, ProjectID: null } } });
  }

  filterProject(project, serachText) {
    if (project.ProjectNumber.toString().indexOf(serachText) !== -1
      || (project.Name && project.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return project;
    } else {
      return null;
    }
  }

  setProject(project) {
    const temp = this.state.orderDetails.DefaultDimensions || {};
    this.setState({ orderDetails: { ...this.state.orderDetails, Project: project.Name, ProjectNumber: project.ProjectNumber, DefaultDimensions: { ...temp, ProjectID: project.ID,  _createguid: createGuid() } } });
  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Department: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchDepartment'),
        searchCriteria: i18n.t('CreateOrder.index.searchDepartmentCriteria'),
        showInstantResults: true,
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
        selectedItem: {
          ID: this.state.orderDetails.DepartmentNumber,
          Display: this.state.orderDetails.Department,
        },
        clearSelectedItem: this.clearDepartment,
      }
    });
  }

  clearDepartment() {
    const temp = this.state.orderDetails.DefaultDimensions || {};
    this.setState({ orderDetails: { ...this.state.orderDetails, Department: null, DepartmentNumber: null, DefaultDimensions: { ...temp, DepartmentID: null } } });
  }

  filterDepartment(department, serachText) {
    if (department.DepartmentNumber.toString().indexOf(serachText) !== -1
      || (department.Name && department.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return department;
    } else {
      return null;
    }
  }

  setDepartment(department) {
    const temp = this.state.orderDetails.DefaultDimensions || {};
    this.setState({ orderDetails: { ...this.state.orderDetails, Department: department.Name, DepartmentNumber: department.DepartmentNumber, DefaultDimensions: { ...temp, DepartmentID: department.ID,  _createguid: createGuid() } } });
  }

  onCurrencyCodeSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, CurrencyCode: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('CreateOrder.index.searchCurrency'),
        searchCriteria: i18n.t('CreateOrder.index.currency'),
        entityType: EntityType.CURRENCY,
        setter: this.setCurrencyCode,
        service: CurrencyService.getCurrencies.bind(null, this.props.company.selectedCompany.Key),
        filter: (currency, serachText) => this.filterCurrency(currency, serachText)
      }
    });
  }

  filterCurrency(currency, serachText) {
    if (currency.ID.toString().indexOf(serachText) !== -1
      || (currency.Code && currency.Code.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return currency;
    } else {
      return null;
    }
  }

  setCurrencyCode(currency) {
    if (currency.ID !== this.state.orderDetails.CurrencyCodeID) {
      this.getUpdatedCurrencyExchangeRate(currency);
    }
    this.setState({ orderDetails: { ...this.state.orderDetails, CurrencyCodeID: currency.ID, CurrencyCode: currency.Code } });
  }

  round(value, decimals) {
    return Number(Math.round(Number.parseFloat(value + 'e' + decimals)) + 'e-' + decimals);
  }

  async getUpdatedCurrencyExchangeRate(selectedCurrency) {
    let companySettings = await CompanyService.getCompanyBaseCurrency(this.props.company.selectedCompany.Key, this.props.company.selectedCompany.Name);
    let exchangeRate = await CurrencyService.getCurrencyExchangeRates(
      this.props.company.selectedCompany.Key,
      selectedCurrency.ID,
      companySettings.data[0].BaseCurrencyCodeID,
      this.state.orderDetails.OrderDate.format('YYYY-MM-DD')
    );

    let orderItems = this.state.orderDetails.Items.map(item => {
      return {
        ...item,
        CurrencyCodeID: this.state.orderDetails.CurrencyCodeID,
        CurrencyExchangeRate: exchangeRate.data.ExchangeRate
      };
    });

    orderItems.forEach(item => {
      item.PriceExVatCurrency = this.round(item.PriceExVat / exchangeRate.data.ExchangeRate, 4);
      item.PriceIncVatCurrency = this.round(item.PriceIncVat / exchangeRate.data.ExchangeRate, 4);
      delete item.VatType;
      delete item.CurrencyCodeID;
      delete item.CurrencyCode;
      delete item.CurrencyExchangeRate;
    });

    this.setState({ orderDetails: { ...this.state.orderDetails, Items: orderItems, CurrencyExchangeRate: exchangeRate.data.ExchangeRate } });
  }

  onPressDeliveryAddress() {
    if (this.state.orderDetails.DeliveryAddress == null || this.state.orderDetails.DeliveryAddress == "") {
      this.state.orderDetails.DeliveryAddressArrayIndex = null;
    }
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DeliveryAddress: null } });
    if (this.props.addressList.addresses.length == 0) {
      this.props.navigation.navigate('AddNewAddress', {
        setAddress: this.setDeliveryAddress,
      });
    }
    else {
      this.props.navigation.navigate('AddressList', {
        data: {
          setAddress: this.setDeliveryAddress,
          clearAddress: this.clearDeliveryAddress,
          selectedAddressArrayIndex: this.state.orderDetails.DeliveryAddressArrayIndex,
        }
      });
    }
  }

  setDeliveryAddress(address, index) {
    this.setState({ orderDetails: { ...this.state.orderDetails, DeliveryAddress: { ...address }, DeliveryAddressArrayIndex: index } });
  }

  clearDeliveryAddress(address, index) {
    this.setState({
      orderDetails: {
        ...this.state.orderDetails,
        DeliveryAddress: {
          City: '',
          PostalCode: '',
          AddressLine1: '',
          AddressLine2: '',
          AddressLine3: '',
          Country: '',
          CountryCode: null,
          CountryId: null,
          ID: null,
        },
        DeliveryAddressArrayIndex: null
      }
    });
  }

  onPressBillingAddress() {
    if (this.state.orderDetails.BillingAddress == null || this.state.orderDetails.BillingAddress == "") {
      this.state.orderDetails.BillingAddressArrayIndex = null;
    }
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, BillingAddress: null } });
    if (this.props.addressList.addresses.length == 0) {
      this.props.navigation.navigate('AddNewAddress', {
        setAddress: this.setBillinAddress,
      });
    }
    else {
      this.props.navigation.navigate('AddressList', {
        data: {
          setAddress: this.setBillinAddress,
          clearAddress: this.clearBillingAddress,
          selectedAddressArrayIndex: this.state.orderDetails.BillingAddressArrayIndex,
        }
      });
    }
  }

  clearBillingAddress(address, index) {
    this.setState({
      orderDetails: {
        ...this.state.orderDetails,
        BillingAddress: {
          City: '',
          PostalCode: '',
          AddressLine1: '',
          AddressLine2: '',
          AddressLine3: '',
          Country: '',
          CountryCode: null,
          CountryId: null,
          ID: null,
        },
        BillingAddressArrayIndex: null
      }
    });
  }

  setBillinAddress(address, index) {
    this.setState({ orderDetails: { ...this.state.orderDetails, BillingAddress: { ...address }, BillingAddressArrayIndex: index } });
  }

  processAddress(address) {
    if (address.AddressLine1 && address.City && address.PostalCode && Number(address.AddressLine1.length + address.City.length + address.PostalCode.length) > 40) {
      return `${`${address.AddressLine1}, ${address.PostalCode} ${address.City}`.substring(0, 40)}...`;
    } else if (!address.AddressLine1 && !address.City && !address.PostalCode) {
      return null;
    }
    else {
      return `${address.AddressLine1 ? address.AddressLine1 : ''}, ${address.PostalCode ? address.PostalCode : ''} ${address.City ? address.City : ''}`;
    }
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} >
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
            <Text>{this.props.navigation.state.params.isEdit
              ? i18n.t('CreateOrder.index.savingOrder')
              : i18n.t('CreateOrder.index.creatingOrder')}</Text>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.customer')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.searchCustomer')}
              isKeyboardInput={false}
              onPress={this.onCustomerSelect}
              value={
                this.state.orderDetails.CustomerID
                  ? `${this.state.orderDetails.CustomerNumber} ${this.state.orderDetails.Customer}`
                  : ''
              }
              error={this.state.errors.Customer}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.orderDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('OrderDate')}
              value={this.state.orderDetails.OrderDate.format('DD/MM/YYYY')}
              error={this.state.errors.OrderDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.deliveryDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('DeliveryDate')}
              value={this.state.orderDetails.DeliveryDate.format('DD/MM/YYYY')}
              error={this.state.errors.DeliveryDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.currency')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={this.onCurrencyCodeSelect}
              value={this.state.orderDetails.CurrencyCode}
              error={this.state.errors.CurrencyCode}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.paymentTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.paymentTerms')}
              isKeyboardInput={false}
              onPress={this.onPaymentTermSelect}
              value={
                this.state.orderDetails.PaymentTermsID && this.state.orderDetails.PaymentTerms && this.state.orderDetails.PaymentTerms.Name
                  ? `${this.state.orderDetails.PaymentTerms.Name}`
                  : ''
              }
              error={this.state.errors.PaymentTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.deliveryTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.deliveryTerms')}
              isKeyboardInput={false}
              onPress={this.onDeliveryTermSelect}
              value={
                this.state.orderDetails.DeliveryTermsID && this.state.orderDetails.DeliveryTerms && this.state.orderDetails.DeliveryTerms.Name
                  ? `${this.state.orderDetails.DeliveryTerms.Name}`
                  : ''
              }
              error={this.state.errors.DeliveryTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.theirReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              onChangeText={text => this.setState({ orderDetails: { ...this.state.orderDetails, YourReference: text }, errors: { ...this.state.errors, YourReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.orderDetails.YourReference}
              error={this.state.errors.YourReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.ourReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              onChangeText={text => this.setState({ orderDetails: { ...this.state.orderDetails, OurReference: text }, errors: { ...this.state.errors, OurReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.orderDetails.OurReference}
              error={this.state.errors.OurReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.email')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : ''}
              onChangeText={text => this.setState({ orderDetails: { ...this.state.orderDetails, EmailAddress: text }, errors: { ...this.state.errors, EmailAddress: null } })}
              isKeyboardInput={true}
              keyboardType={'email-address'}
              onFocus={this.scrollToBottom}
              value={this.state.orderDetails.EmailAddress}
              error={this.state.errors.EmailAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.billingAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.billingAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.orderDetails.BillingAddress)}
              onPress={this.onPressBillingAddress}
              error={this.state.errors.BillingAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.deliveryAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.deliveryAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.orderDetails.DeliveryAddress)}
              onPress={this.onPressDeliveryAddress}
              error={this.state.errors.DeliveryAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.project')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.searchProject')}
              isKeyboardInput={false}
              onPress={this.onProjectSelect}
              value={this.state.orderDetails.Project}
              error={this.state.errors.Project}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.department')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.searchDepartment')}
              isKeyboardInput={false}
              onPress={this.onDepartmentSelect}
              value={this.state.orderDetails.Department}
              error={this.state.errors.Department}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('CreateOrder.index.mainSelling')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('CreateOrder.index.notSpecified') : i18n.t('CreateOrder.index.searchSeller')}
              isKeyboardInput={false}
              onPress={this.onDefaultSellerSelect}
              value={this.state.orderDetails.DefaultSeller}
              error={this.state.errors.DefaultSeller}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.buttonContainer} >
              {this.props.navigation.state.params.isViewOnly ? null :
              <GenericButton
                  text={i18n.t('CreateOrder.index.clearChanges')}
                  textStyle={styles.clearButtonText}
                  buttonStyle={styles.clearButton}
                  onPress={this.clearChanges}
                />}
            </View>
          </View>

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>

        <DateTimePicker
          mode={'date'}
          date={this.state.initialDate.toDate()}
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this._handleDatePicked}
          onCancel={this._hideDateTimePicker}
        />
      </ViewWrapper>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    addressList: state.addressList,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetToOrderDetails: (orderParams) =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'OrderList' }),
          NavigationActions.navigate({ routeName: 'OrderDetails', params: { ...orderParams } })
        ]
      })),
    updateOrderList: () => dispatch({ type: 'UPDATE_ORDERS_LAST_EDITED_TIMESTAMP' }),
    addNewAddressToList: address => dispatch(addNewAddressToList(address)),
    clearAddressList: () => dispatch(clearAddressList()),
    setAddressList: list => dispatch(setAddressList(list)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateOrder);

const styles = StyleSheet.create({
  inputTitleStyle: {
    color: theme.PRIMARY_TEXT_COLOR,
    width: 90,
    fontSize: 16,
    fontWeight: 'normal',
  },
  activityIndicator: { height: 80 },
  inputPlaceholderStyle: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  clearButton: {
    height: 30,
    flex: 1,
    width: 170,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
    marginRight: 15,
  },
  clearButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  },
  invoiceImage: {
    height: 400,
  },
  infoRow: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowTitleContainer: {
    width: 90,
  },
  infoRowControlContainer: {
    flex: 1,
  },
  infoRowContainer: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  infoContainer: {
    justifyContent: 'space-around',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  infoRowTitle: {
    color: theme.PRIMARY_TEXT_COLOR,
    width: 90,
    fontWeight: '600',
  },
  infoRowText: {
    color: theme.SECONDARY_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextActive: {
    color: theme.PRIMARY_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextInput: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 14,
    marginLeft: -2,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  spacer: {
    height: 15,
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
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  iphoneXSpace: {
    height: 20,
  },
});
