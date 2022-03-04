// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import DateTimePicker from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { NavigationActions, StackActions } from 'react-navigation';
import Analytics from 'appcenter-analytics';
import _ from 'lodash';

import { theme } from '../../styles';
import { EntityType } from '../../constants/EntityTypes';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import GenericButton from '../../components/GenericButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ViewWrapper from '../../components/ViewWrapper';
import CustomerService from '../../services/CustomerService';
import ProjectService from '../../services/ProjectService';
import CompanyService from '../../services/CompanyService';
import SellerService from '../../services/SellerService';
import CurrencyService from '../../services/CurrencyService';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import { addNewAddressToList, clearAddressList, setAddressList } from '../../actions/addressListActions';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import TermsService from '../../services/TermsService';
import { createGuid } from '../../helpers/APIUtil';

class AddNewCustomerInvoice extends Component {

  static navigationOptions = (props) => {
    const { navigation } = props;
    return {
      title: navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.invoiceDetails')
        : (navigation.state.params.isEdit ? i18n.t('AddNewCustomerInvoice.index.editTitle') : i18n.t('AddNewCustomerInvoice.index.title')),
      headerRight: navigation.state.params.isViewOnly ? <HeaderTextButton /> :
        <HeaderTextButton
          position={'right'}
          isActionComplete={navigation.state.params.isActionComplete}
          onPress={navigation.state.params.handleCreation}
          text={navigation.state.params.isEdit
            ? i18n.t('AddNewCustomerInvoice.index.save')
            : i18n.t('AddNewCustomerInvoice.index.create')}
        />,
      headerLeft: <HeaderTextButton
        navigate={navigation.navigate}
        onPress={() => { Keyboard.dismiss(); navigation.state.params.clearAddressData(); navigation.goBack(); }}
        text={i18n.t('AddNewCustomerInvoice.index.cancel')}
        position="left"
        isActionComplete={navigation.state.params.isActionComplete}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR },
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
      customerInvoiceDetails: {
        CustomerID: '',
        CustomerNumber: '',
        Customer: '',
        CurrencyCodeID: '1',
        CurrencyCode: 'NOK',
        CurrencyExchangeRate: '',
        Items: [],
        ProjectName: '',
        ProjectNumber: '',
        DepartmentName: '',
        DepartmentNumber: '',
        DefaultDimensions: null,
        DefaultDimensionsID: null,
        DefaultSellerID: '',
        DefaultSeller: '',
        YourReference: '',
        OurReference: this.props.user.activeUser.displayName,
        EmailAddress: '',
        InvoiceDate: moment(),
        PaymentDueDate: moment().add(14, 'days'),
        DeliveryDate: moment(),
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
      },
      errors: {
        Customer: null,
        CurrencyCode: null,
        Project: null,
        DefaultSeller: null,
        YourReference: null,
        OurReference: null,
        EmailAddress: null,
        InvoiceDate: null,
        PaymentDueDate: null,
        DeliveryDate: null,
        DeliveryAddress: null,
        BillingAddress: null,
        PaymentTerms: null,
        DeliveryTerms: null,
        Department: null,
      }
    };

    this.customerInvoiceID = 0;
    this.isActionComplete = false;
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.createCustomerInvoice = this.createCustomerInvoice.bind(this);
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

  componentDidMount() {
    const { customerInvoiceData } = this.props.navigation.state.params;
    if (this.props.navigation.state.params.isEdit || this.props.navigation.state.params.isViewOnly) {
      const obj = { AddressLine1: '', AddressLine2: '', AddressLine3: '', City: '', Country: '', CountryCode: '', CountryId: null, ID: null, PostalCode: '' };
      const DeliveryAddress = {
        City: customerInvoiceData.ShippingCity ? customerInvoiceData.ShippingCity : '',
        PostalCode: customerInvoiceData.ShippingPostalCode ? customerInvoiceData.ShippingPostalCode : '',
        AddressLine1: customerInvoiceData.ShippingAddressLine1 ? customerInvoiceData.ShippingAddressLine1 : '',
        AddressLine2: customerInvoiceData.ShippingAddressLine2 ? customerInvoiceData.ShippingAddressLine2 : '',
        AddressLine3: customerInvoiceData.ShippingAddressLine3 ? customerInvoiceData.ShippingAddressLine3 : '',
        Country: customerInvoiceData.ShippingCountry ? customerInvoiceData.ShippingCountry : '',
        CountryCode: customerInvoiceData.ShippingCountryCode ? customerInvoiceData.ShippingCountryCode : '',
        CountryId: null,
        ID: null,
      };
      const BillingAddress = {
        City: customerInvoiceData.InvoiceCity ? customerInvoiceData.InvoiceCity : '',
        PostalCode: customerInvoiceData.InvoicePostalCode ? customerInvoiceData.InvoicePostalCode : '',
        AddressLine1: customerInvoiceData.InvoiceAddressLine1 ? customerInvoiceData.InvoiceAddressLine1 : '',
        AddressLine2: customerInvoiceData.InvoiceAddressLine2 ? customerInvoiceData.InvoiceAddressLine2 : '',
        AddressLine3: customerInvoiceData.InvoiceAddressLine3 ? customerInvoiceData.InvoiceAddressLine3 : '',
        Country: customerInvoiceData.InvoiceCountry ? customerInvoiceData.InvoiceCountry : '',
        CountryCode: customerInvoiceData.InvoiceCountryCode ? customerInvoiceData.InvoiceCountryCode : '',
        CountryId: null,
        ID: null,
      };
      this.setState({
        customerInvoiceDetails: {
          CustomerID: customerInvoiceData.CustomerID ? customerInvoiceData.CustomerID : '',
          CustomerNumber: customerInvoiceData.Customer && customerInvoiceData.Customer.CustomerNumber ? customerInvoiceData.Customer.CustomerNumber : '',
          Customer: customerInvoiceData.CustomerName ? customerInvoiceData.CustomerName : '',
          CurrencyCodeID: customerInvoiceData.CurrencyCodeID ? customerInvoiceData.CurrencyCodeID : '',
          CurrencyCode: customerInvoiceData.CurrencyCode ? customerInvoiceData.CurrencyCode.Code : '',
          CurrencyExchangeRate: customerInvoiceData.CurrencyExchangeRate ? customerInvoiceData.CurrencyExchangeRate : '',
          Items: customerInvoiceData.Items ? customerInvoiceData.Items : [],
          ProjectName: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Project ? customerInvoiceData.DefaultDimensions.Project.Name : '',
          ProjectNumber: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Project ? customerInvoiceData.DefaultDimensions.Project.ProjectNumber : '',
          DepartmentName: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Department ? customerInvoiceData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Department ? customerInvoiceData.DefaultDimensions.Department.DepartmentNumber : '',
          DefaultDimensions: customerInvoiceData.DefaultDimensions ? customerInvoiceData.DefaultDimensions : null,
          DefaultSellerID: customerInvoiceData.DefaultSellerID ? customerInvoiceData.DefaultSellerID : '',
          DefaultSeller: customerInvoiceData.DefaultSeller ? customerInvoiceData.DefaultSeller.Name : '',
          YourReference: customerInvoiceData.YourReference ? customerInvoiceData.YourReference : '',
          OurReference: customerInvoiceData.OurReference ? customerInvoiceData.OurReference : '',
          EmailAddress: customerInvoiceData.EmailAddress ? customerInvoiceData.EmailAddress : '',
          InvoiceDate: customerInvoiceData.InvoiceDate ? moment(customerInvoiceData.InvoiceDate) : '',
          PaymentDueDate: customerInvoiceData.PaymentDueDate ? moment(customerInvoiceData.PaymentDueDate) : '',
          DeliveryDate: customerInvoiceData.DeliveryDate ? moment(customerInvoiceData.DeliveryDate) : '',
          DeliveryAddress: { ...DeliveryAddress },
          BillingAddress: { ...BillingAddress },
          BillingAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? 0 : null,
          DeliveryAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? !_.isEqualWith(DeliveryAddress, obj) ? _.isEqual(this.state.customerInvoiceDetails.BillingAddress, this.state.customerInvoiceDetails.DeliveryAddress) ? 0 : 1 : null : !_.isEqualWith(DeliveryAddress, obj) ? 0 : null, // set the index of seleceted address accroding to availability of billing and delivery address
          PaymentTerms: customerInvoiceData.PaymentTerms ? customerInvoiceData.PaymentTerms : null,
          PaymentTermsID: customerInvoiceData.PaymentTerms ? customerInvoiceData.PaymentTermsID : null,
          DeliveryTerms: customerInvoiceData.DeliveryTerms ? customerInvoiceData.DeliveryTerms : null,
          DeliveryTermsID: customerInvoiceData.DeliveryTerms ? customerInvoiceData.DeliveryTermsID : null,
        }
      }, () => {
        if (_.isEqual(this.state.customerInvoiceDetails.BillingAddress, this.state.customerInvoiceDetails.DeliveryAddress) && !_.isEqualWith(this.state.customerInvoiceDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.customerInvoiceDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.customerInvoiceDetails.BillingAddress, obj) && !_.isEqualWith(this.state.customerInvoiceDetails.DeliveryAddress, obj) && !_.isEqual(this.state.customerInvoiceDetails.BillingAddress, this.state.customerInvoiceDetails.DeliveryAddress)) {
          this.props.setAddressList([this.state.customerInvoiceDetails.BillingAddress, this.state.customerInvoiceDetails.DeliveryAddress]);
        }
        else if (!_.isEqualWith(this.state.customerInvoiceDetails.BillingAddress, obj)) {
          this.props.setAddressList([this.state.customerInvoiceDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.customerInvoiceDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.customerInvoiceDetails.DeliveryAddress]);
        }
      });
    }
    this.props.navigation.setParams(
      {
        isActionComplete: this.isActionComplete,
        handleCreation: this.handleCreation,
        clearAddressData: this.props.clearAddressList
      }
    );
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.addressList.lastEditedTime !== this.props.addressList.lastEditedTime)) {
      if (nextProps.addressList.lastEditedIndex === this.state.customerInvoiceDetails.BillingAddressArrayIndex) {
        this.setBillinAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex);
      }
      if (nextProps.addressList.lastEditedIndex === this.state.customerInvoiceDetails.DeliveryAddressArrayIndex) {
        setTimeout(() => { this.setDeliveryAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex); }, 500);
      }
    }
  }

  onPressDeliveryAddress() {
    if (this.state.customerInvoiceDetails.DeliveryAddress == null || this.state.customerInvoiceDetails.DeliveryAddress == "") {
      this.state.customerInvoiceDetails.DeliveryAddressArrayIndex = null;
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
          selectedAddressArrayIndex: this.state.customerInvoiceDetails.DeliveryAddressArrayIndex,
        }
      });
    }
  }


  clearDeliveryAddress(address, index) {
    this.setState({
      customerInvoiceDetails: {
        ...this.state.customerInvoiceDetails,
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

  setDeliveryAddress(address, index) {
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, DeliveryAddress: { ...address }, DeliveryAddressArrayIndex: index } });
  }

  setBillinAddress(address, index) {
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, BillingAddress: { ...address }, BillingAddressArrayIndex: index } });
  }

  onPressBillingAddress() {
    if (this.state.customerInvoiceDetails.BillingAddress == null || this.state.customerInvoiceDetails.BillingAddress == "") {
      this.state.customerInvoiceDetails.BillingAddressArrayIndex = null;
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
          selectedAddressArrayIndex: this.state.customerInvoiceDetails.BillingAddressArrayIndex,
        }
      });
    }
  }

  clearBillingAddress(address, index) {
    this.setState({
      customerInvoiceDetails: {
        ...this.state.customerInvoiceDetails,
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

  handleCustomerInvoiceErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewCustomerInvoice.index.somethingWrong')) {
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
      this.createCustomerInvoice(this.handleCreation);
    } else {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.scrollToBottom();
    }
  }

  clearChanges() {
    if (this.props.navigation.state.params.isEdit) {
      const { customerInvoiceData } = this.props.navigation.state.params;
      this.setState({
        customerInvoiceDetails: {
          CustomerID: customerInvoiceData.CustomerID ? customerInvoiceData.CustomerID : '',
          CustomerNumber: customerInvoiceData.Customer && customerInvoiceData.Customer.CustomerNumber ? customerInvoiceData.Customer.CustomerNumber : '',
          Customer: customerInvoiceData.CustomerName ? customerInvoiceData.CustomerName : '',
          CurrencyCodeID: customerInvoiceData.CurrencyCodeID ? customerInvoiceData.CurrencyCodeID : '',
          CurrencyCode: customerInvoiceData.CurrencyCode ? customerInvoiceData.CurrencyCode.Code : '',
          ProjectName: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Project ? customerInvoiceData.DefaultDimensions.Project.Name : '',
          ProjectNumber: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Project ? customerInvoiceData.DefaultDimensions.Project.ProjectNumber : '',
          DepartmentName: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Department ? customerInvoiceData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: customerInvoiceData.DefaultDimensions && customerInvoiceData.DefaultDimensions.Department ? customerInvoiceData.DefaultDimensions.Department.DepartmentNumber : '',
          DefaultDimensions: customerInvoiceData.DefaultDimensions ? customerInvoiceData.DefaultDimensions : null,
          DefaultSellerID: customerInvoiceData.DefaultSellerID ? customerInvoiceData.DefaultSellerID : '',
          DefaultSeller: customerInvoiceData.DefaultSeller ? customerInvoiceData.DefaultSeller.Name : '',
          YourReference: customerInvoiceData.YourReference ? customerInvoiceData.YourReference : '',
          OurReference: customerInvoiceData.OurReference ? customerInvoiceData.OurReference : '',
          EmailAddress: customerInvoiceData.EmailAddress ? customerInvoiceData.EmailAddress : '',
          InvoiceDate: customerInvoiceData.InvoiceDate ? moment(customerInvoiceData.InvoiceDate) : '',
          PaymentDueDate: customerInvoiceData.PaymentDueDate ? moment(customerInvoiceData.PaymentDueDate) : '',
          DeliveryDate: customerInvoiceData.DeliveryDate ? moment(customerInvoiceData.DeliveryDate) : '',
          DeliveryAddress: {
            City: customerInvoiceData.ShippingCity ? customerInvoiceData.ShippingCity : '',
            PostalCode: customerInvoiceData.ShippingPostalCode ? customerInvoiceData.ShippingPostalCode : '',
            AddressLine1: customerInvoiceData.ShippingAddressLine1 ? customerInvoiceData.ShippingAddressLine1 : '',
            AddressLine2: customerInvoiceData.ShippingAddressLine2 ? customerInvoiceData.ShippingAddressLine2 : '',
            AddressLine3: customerInvoiceData.ShippingAddressLine3 ? customerInvoiceData.ShippingAddressLine3 : '',
            Country: customerInvoiceData.ShippingCountry ? customerInvoiceData.ShippingCountry : '',
            CountryCode: customerInvoiceData.ShippingCountryCode ? customerInvoiceData.ShippingCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddress: {
            City: customerInvoiceData.InvoiceCity ? customerInvoiceData.InvoiceCity : '',
            PostalCode: customerInvoiceData.InvoicePostalCode ? customerInvoiceData.InvoicePostalCode : '',
            AddressLine1: customerInvoiceData.InvoiceAddressLine1 ? customerInvoiceData.InvoiceAddressLine1 : '',
            AddressLine2: customerInvoiceData.InvoiceAddressLine2 ? customerInvoiceData.InvoiceAddressLine2 : '',
            AddressLine3: customerInvoiceData.InvoiceAddressLine3 ? customerInvoiceData.InvoiceAddressLine3 : '',
            Country: customerInvoiceData.InvoiceCountry ? customerInvoiceData.InvoiceCountry : '',
            CountryCode: customerInvoiceData.InvoiceCountryCode ? customerInvoiceData.InvoiceCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddressArrayIndex: customerInvoiceData.InvoiceAddressLine1 ? 0 : null,
          DeliveryAddressArrayIndex: customerInvoiceData.ShippingAddressLine1 ? 0 : null,
          PaymentTerms: customerInvoiceData.PaymentTerms ? customerInvoiceData.PaymentTerms : null,
          PaymentTermsID: customerInvoiceData.PaymentTerms ? customerInvoiceData.PaymentTermsID : null,
          DeliveryTerms: customerInvoiceData.DeliveryTerms ? customerInvoiceData.DeliveryTerms : null,
          DeliveryTermsID: customerInvoiceData.DeliveryTerms ? customerInvoiceData.DeliveryTermsID : null,
        }
      });
    } else {
      this.setState({
        customerInvoiceDetails: {
          CustomerID: '',
          CustomerNumber: '',
          Customer: '',
          CurrencyCodeID: '1',
          CurrencyCode: 'NOK',
          ProjectName: '',
          ProjectNumber: '',
          DepartmentName: '',
          DepartmentNumber: '',
          DefaultDimensions: null,
          DefaultDimensionsID: null,
          DefaultSellerID: '',
          DefaultSeller: '',
          YourReference: '',
          OurReference: this.props.user.activeUser.displayName,
          EmailAddress: '',
          InvoiceDate: moment(),
          PaymentDueDate: moment().add(14, 'days'),
          DeliveryDate: moment(),
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
        },
        errors: {
          Customer: null,
          CurrencyCode: null,
          Project: null,
          DefaultSeller: null,
          YourReference: null,
          OurReference: null,
          EmailAddress: null,
          InvoiceDate: null,
          PaymentDueDate: null,
          DeliveryDate: null,
          DeliveryAddress: null,
          BillingAddress: null,
          PaymentTerms: null,
          DeliveryTerms: null,
          Department: null,
        }
      });
    }
  }

  async createCustomerInvoice(caller) {
    try {
      const customerInvoiceDetails = this.state.customerInvoiceDetails;
      let invoice = {};

      if (this.props.navigation.state.params.isEdit) {
        const previousData = this.props.navigation.state.params.customerInvoiceData;
        invoice = {
          CurrencyCodeID: customerInvoiceDetails.CurrencyCodeID,
          CurrencyExchangeRate: customerInvoiceDetails.CurrencyExchangeRate,
          CustomerID: customerInvoiceDetails.CustomerID,
          CustomerName: customerInvoiceDetails.Customer,
          Items: customerInvoiceDetails.Items,
          Sellers: previousData.Sellers ? previousData.Sellers : [],
          ID: previousData.ID,
          InvoiceDate: customerInvoiceDetails.InvoiceDate ? customerInvoiceDetails.InvoiceDate.format('YYYY-MM-DD') : null,
          PaymentDueDate: customerInvoiceDetails.PaymentDueDate ? customerInvoiceDetails.PaymentDueDate.format('YYYY-MM-DD') : null,
          DeliveryDate: customerInvoiceDetails.DeliveryDate ? customerInvoiceDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          InvoiceAddressLine1: customerInvoiceDetails.BillingAddress.AddressLine1 ? customerInvoiceDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: customerInvoiceDetails.BillingAddress.AddressLine2 ? customerInvoiceDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: customerInvoiceDetails.BillingAddress.AddressLine3 ? customerInvoiceDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: customerInvoiceDetails.BillingAddress.City ? customerInvoiceDetails.BillingAddress.City : null,
          InvoiceCountry: customerInvoiceDetails.BillingAddress.Country ? customerInvoiceDetails.BillingAddress.Country : null,
          InvoiceCountryCode: customerInvoiceDetails.BillingAddress.CountryCode ? customerInvoiceDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: customerInvoiceDetails.BillingAddress.PostalCode ? customerInvoiceDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: customerInvoiceDetails.DeliveryAddress.AddressLine1 ? customerInvoiceDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: customerInvoiceDetails.DeliveryAddress.AddressLine2 ? customerInvoiceDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: customerInvoiceDetails.DeliveryAddress.AddressLine3 ? customerInvoiceDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: customerInvoiceDetails.DeliveryAddress.City ? customerInvoiceDetails.DeliveryAddress.City : null,
          ShippingCountry: customerInvoiceDetails.DeliveryAddress.Country ? customerInvoiceDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: customerInvoiceDetails.DeliveryAddress.CountryCode ? customerInvoiceDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: customerInvoiceDetails.DeliveryAddress.PostalCode ? customerInvoiceDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: customerInvoiceDetails.PaymentTermsID,
          PaymentTerms: customerInvoiceDetails.PaymentTerms,
          DeliveryTermsID: customerInvoiceDetails.DeliveryTermsID,
          DeliveryTerms: customerInvoiceDetails.DeliveryTerms,
          YourReference: customerInvoiceDetails.YourReference ? customerInvoiceDetails.YourReference : null,
          OurReference: customerInvoiceDetails.OurReference ? customerInvoiceDetails.OurReference : null,
          EmailAddress: customerInvoiceDetails.EmailAddress ? customerInvoiceDetails.EmailAddress : null,
        };
        customerInvoiceDetails.DefaultSellerID ? invoice.DefaultSellerID = customerInvoiceDetails.DefaultSellerID : null;
        customerInvoiceDetails.DefaultDimensions ? invoice.DefaultDimensions = customerInvoiceDetails.DefaultDimensions : null;

        await CustomerInvoiceService.editCustomerInvoiceDetails(this.props.company.selectedCompany.Key, previousData.ID, invoice);
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Customer invoice' });
      } else {
        invoice = {
          CurrencyCodeID: customerInvoiceDetails.CurrencyCodeID,
          CustomerID: customerInvoiceDetails.CustomerID,
          CustomerName: customerInvoiceDetails.Customer,
          InvoiceDate: customerInvoiceDetails.InvoiceDate ? customerInvoiceDetails.InvoiceDate.format('YYYY-MM-DD') : null,
          PaymentDueDate: customerInvoiceDetails.PaymentDueDate ? customerInvoiceDetails.PaymentDueDate.format('YYYY-MM-DD') : null,
          DeliveryDate: customerInvoiceDetails.DeliveryDate ? customerInvoiceDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          Sellers: [],
          StatusCode: 10001, // setting status code as 10001 to save the customer invoice as a draft
          InvoiceAddressLine1: customerInvoiceDetails.BillingAddress.AddressLine1 ? customerInvoiceDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: customerInvoiceDetails.BillingAddress.AddressLine2 ? customerInvoiceDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: customerInvoiceDetails.BillingAddress.AddressLine3 ? customerInvoiceDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: customerInvoiceDetails.BillingAddress.City ? customerInvoiceDetails.BillingAddress.City : null,
          InvoiceCountry: customerInvoiceDetails.BillingAddress.Country ? customerInvoiceDetails.BillingAddress.Country : null,
          InvoiceCountryCode: customerInvoiceDetails.BillingAddress.CountryCode ? customerInvoiceDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: customerInvoiceDetails.BillingAddress.PostalCode ? customerInvoiceDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: customerInvoiceDetails.DeliveryAddress.AddressLine1 ? customerInvoiceDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: customerInvoiceDetails.DeliveryAddress.AddressLine2 ? customerInvoiceDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: customerInvoiceDetails.DeliveryAddress.AddressLine3 ? customerInvoiceDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: customerInvoiceDetails.DeliveryAddress.City ? customerInvoiceDetails.DeliveryAddress.City : null,
          ShippingCountry: customerInvoiceDetails.DeliveryAddress.Country ? customerInvoiceDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: customerInvoiceDetails.DeliveryAddress.CountryCode ? customerInvoiceDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: customerInvoiceDetails.DeliveryAddress.PostalCode ? customerInvoiceDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: customerInvoiceDetails.PaymentTermsID,
          PaymentTerms: customerInvoiceDetails.PaymentTerms,
          DeliveryTermsID: customerInvoiceDetails.DeliveryTermsID,
          DeliveryTerms: customerInvoiceDetails.DeliveryTerms
        };
        customerInvoiceDetails.YourReference ? invoice.YourReference = customerInvoiceDetails.YourReference : null;
        customerInvoiceDetails.OurReference ? invoice.OurReference = customerInvoiceDetails.OurReference : null;
        customerInvoiceDetails.EmailAddress ? invoice.EmailAddress = customerInvoiceDetails.EmailAddress : null;
        customerInvoiceDetails.DefaultSellerID ? invoice.DefaultSeller = { ID: customerInvoiceDetails.DefaultSellerID } : null;
        customerInvoiceDetails.DefaultSellerID ? invoice.DefaultSellerID = customerInvoiceDetails.DefaultSellerID : null;
        customerInvoiceDetails.DefaultDimensions ? invoice.DefaultDimensions = customerInvoiceDetails.DefaultDimensions : null;

        const orderResponse = await CustomerInvoiceService.createCustomerInvoice(this.props.company.selectedCompany.Key, invoice);
        this.customerInvoiceID = orderResponse.data.ID;
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Customer invoice' });
      }
      if (this.props.navigation.state.params.refreshData) {
        this.props.navigation.goBack();
        this.props.navigation.state.params.refreshData();
      } else {
        this.props.resetToCustomerInvoiceDetails({
          customerInvoiceID: this.customerInvoiceID,
          EntityType: 'customerinvoice',
          CompanyKey: this.props.company.selectedCompany.Key,
        });
      }
      this.props.updateCustomerInvoiceList();
      this.startAnimation(true);
    } catch (error) {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.handleCustomerInvoiceErrors(error.problem, caller, this.props.navigation.state.params.isEdit
        ? i18n.t('AddNewCustomerInvoice.index.saveInvoiceError')
        : i18n.t('AddNewCustomerInvoice.index.createInvoiceError'));
    }
  }

  isValidEmail(email) {
    return email.match(/\S+@\S+\.\S+/);
  }

  isValid() {
    const errors = {};
    if (!this.state.customerInvoiceDetails.CustomerID || !this.state.customerInvoiceDetails.Customer) {
      errors.Customer = i18n.t('AddNewCustomerInvoice.index.customerError');
    }
    if (!this.state.customerInvoiceDetails.CurrencyCodeID || !this.state.customerInvoiceDetails.CurrencyCode) {
      errors.CurrencyCode = i18n.t('AddNewCustomerInvoice.index.currencyError');
    }
    if (this.state.customerInvoiceDetails.EmailAddress && !this.isValidEmail(this.state.customerInvoiceDetails.EmailAddress)) {
      errors.EmailAddress = i18n.t('AddNewCustomerInvoice.index.emailError');
    }
    if (!this.state.customerInvoiceDetails.InvoiceDate) {
      errors.InvoiceDate = i18n.t('AddNewCustomerInvoice.index.invoiceDateError');
    }
    if (!this.state.customerInvoiceDetails.PaymentDueDate) {
      errors.PaymentDueDate = i18n.t('AddNewCustomerInvoice.index.paymentDateError');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
  }

  _showDatePicker(picker) {
    Keyboard.dismiss();
    this.setState({ isDateTimePickerVisible: true, picker, initialDate: this.state.customerInvoiceDetails[picker] ? this.state.customerInvoiceDetails[picker] : moment(), errors: { ...this.state.errors, ...{ PaymentDueDate: null, InvoiceDate: null } } });
  }

  _handleDatePicked(date) {
    let _date;
    if (this.state.picker === 'InvoiceDate') {
      _date = { InvoiceDate: moment(date) };
    }
    else if (this.state.picker === 'PaymentDueDate') {
      _date = { PaymentDueDate: moment(date) };
    }
    else if (this.state.picker === 'DeliveryDate') {
      _date = { DeliveryDate: moment(date) };
    }
    this.setState({ isDateTimePickerVisible: false, customerInvoiceDetails: { ...this.state.customerInvoiceDetails, ..._date } });
  }

  _hideDateTimePicker() {
    this.setState({ isDateTimePickerVisible: false });
  }

  onCustomerSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Customer: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchCustomer'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.searchCustomerId'),
        entityType: EntityType.CUSTOMER,
        setter: this.setCustomer,
        service: CustomerService.getCustomers.bind(null, this.props.company.selectedCompany.Key),
        filter: (customer, serachText) => this.filterCustomer(customer, serachText)
      }
      , navigateFrom: 'CustomerInvoiceList'
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
    let invoice = {
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

    if (customer.PaymentTerms && customer.PaymentTerms.CreditDays) {
      invoice.PaymentDueDate = moment(this.state.customerInvoiceDetails.InvoiceDate).add(customer.PaymentTerms.CreditDays, 'days');
    }

    if (customer.DeliveryTerms && customer.DeliveryTerms.CreditDays) {
      invoice.DeliveryDate = moment(this.state.customerInvoiceDetails.InvoiceDate).add(customer.DeliveryTerms.CreditDays, 'days');
    }

    if (from == null) {
      // set addressList and selected address index of the list when fetching addresses from customer details
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        invoice.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        invoice.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        invoice.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        invoice.DeliveryAddressArrayIndex = this.props.addressList.addresses.length + 1;
      }
      else if (customer.Info.InvoiceAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        invoice.BillingAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        invoice.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
    }
    else {
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        invoice.BillingAddressArrayIndex = this.props.addressList.addresses.length - 2;
        invoice.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        invoice.BillingAddressArrayIndex = this.props.addressList.addresses.length - 2;
        invoice.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress) {
        invoice.BillingAddressArrayIndex = 0;
        invoice.DeliveryAddressArrayIndex = null;
      }
      else if (customer.Info.ShippingAddress) {
        invoice.BillingAddressArrayIndex = null;
        invoice.DeliveryAddressArrayIndex = 0;
      }
    }

    this.setState({
      customerInvoiceDetails: {
        ...this.state.customerInvoiceDetails,
        ...invoice,
      },
    });
  }

  onPaymentTermSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, PaymentTerms: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchPaymentTerms'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.searchPaymentTermName'),
        entityType: EntityType.PAYMENT_TERMS,
        setter: this.setPaymentTerm,
        service: TermsService.getPaymentTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (paymentTerm, serachText) => this.filterPaymentTerm(paymentTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'AddNewCustomerInvoice'
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
      customerInvoiceDetails: {
        ...this.state.customerInvoiceDetails,
        PaymentTerms: { ...PaymentTerms },
        PaymentTermsID: PaymentTerms.ID,
        PaymentDueDate: moment(this.state.customerInvoiceDetails.InvoiceDate).add(paymentTerm.CreditDays, 'days')
      },
    });
  }

  onDeliveryTermSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DeliveryTerms: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchDeliveryTerms'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.searchDeliveryTermName'),
        entityType: EntityType.DELIVERY_TERMS,
        setter: this.setDeliveryTerm,
        service: TermsService.getDeliveryTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (deliveryTerm, serachText) => this.filterDeliveryTerm(deliveryTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'AddNewCustomerInvoice'
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
      customerInvoiceDetails: {
        ...this.state.customerInvoiceDetails,
        DeliveryTerms: { ...DeliveryTerms },
        DeliveryTermsID: DeliveryTerms.ID,
        DeliveryDate: moment(this.state.customerInvoiceDetails.InvoiceDate).add(paymentTerm.CreditDays, 'days')
      },
    });
  }

  onDefaultSellerSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DefaultSeller: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchSeller'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.seller'),
        showInstantResults: true,
        entityType: EntityType.SELLER,
        setter: this.setDefaultSeller,
        service: SellerService.getSellers.bind(null, this.props.company.selectedCompany.Key),
        filter: (seller, serachText) => this.filterSeller(seller, serachText),
        selectedItem: {
          ID: this.state.customerInvoiceDetails.DefaultSellerID,
          Display: this.state.customerInvoiceDetails.DefaultSeller,
        },
        clearSelectedItem: this.clearDefaultSeller,
      }
    });
  }

  clearDefaultSeller() {
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, DefaultSellerID: null, DefaultSeller: null } });
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
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, DefaultSellerID: seller.ID, DefaultSeller: seller.Name } });
  }

  onProjectSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Project: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchProject'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.project'),
        showInstantResults: true,
        entityType: EntityType.PROJECT,
        setter: this.setProject,
        service: ProjectService.getProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
        selectedItem: {
          ID: this.state.customerInvoiceDetails.ProjectNumber,
          Display: this.state.customerInvoiceDetails.ProjectName,
        },
        clearSelectedItem: this.clearProject,
      }
    });
  }

  clearProject() {
    const temp = this.state.customerInvoiceDetails.DefaultDimensions || {};
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, ProjectNumber: '', ProjectName: '', DefaultDimensions: { ...temp, ProjectID: null } } });
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
    const temp = this.state.customerInvoiceDetails.DefaultDimensions || {};
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, ProjectNumber: project.ProjectNumber, ProjectName: project.Name, DefaultDimensions:  { ...temp, ProjectID: project.ID, _createguid: createGuid() } } });
  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Department: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchDepartment'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.searchDepartmentCriteria'),
        showInstantResults: true,
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
        selectedItem: {
          ID: this.state.customerInvoiceDetails.DepartmentNumber,
          Display: this.state.customerInvoiceDetails.DepartmentName,
        },
        clearSelectedItem: this.clearDepartment,
      }
    });
  }

  clearDepartment() {
    const temp = this.state.customerInvoiceDetails.DefaultDimensions || {};
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, DepartmentNumber: '', DepartmentName: '', DefaultDimensions: { ...temp, DepartmentID: null } } });
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
    const temp = this.state.customerInvoiceDetails.DefaultDimensions || {};
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, DepartmentNumber: department.DepartmentNumber, DepartmentName: department.Name, DefaultDimensions:  { ...temp, DepartmentID: department.ID, _createguid: createGuid() } } });
  }

  onCurrencyCodeSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, CurrencyCode: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewCustomerInvoice.index.searchCurrency'),
        searchCriteria: i18n.t('AddNewCustomerInvoice.index.currency'),
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
    if (currency.ID !== this.state.customerInvoiceDetails.CurrencyCodeID) {
      this.getUpdatedCurrencyExchangeRate(currency);
    }
    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, CurrencyCodeID: currency.ID, CurrencyCode: currency.Code } });
  }

  round(value, decimals) {
    return Number(`${Math.round(Number.parseFloat(`${value}e${decimals}`))}e-${decimals}`);
  }

  async getUpdatedCurrencyExchangeRate(selectedCurrency) {
    const companySettings = await CompanyService.getCompanyBaseCurrency(this.props.company.selectedCompany.Key, this.props.company.selectedCompany.Name);
    const exchangeRate = await CurrencyService.getCurrencyExchangeRates(
      this.props.company.selectedCompany.Key,
      selectedCurrency.ID,
      companySettings.data[0].BaseCurrencyCodeID,
      this.state.customerInvoiceDetails.InvoiceDate.format('YYYY-MM-DD')
    );

    const customerInvoiceItems = this.state.customerInvoiceDetails.Items.map((item) => {
      return {
        ...item,
        CurrencyCodeID: this.state.customerInvoiceDetails.CurrencyCodeID,
        CurrencyExchangeRate: exchangeRate.data.ExchangeRate
      };
    });

    customerInvoiceItems.forEach((item) => {
      item.PriceExVatCurrency = this.round(item.PriceExVat / exchangeRate.data.ExchangeRate, 4);
      item.PriceIncVatCurrency = this.round(item.PriceIncVat / exchangeRate.data.ExchangeRate, 4);
      delete item.VatType;
      delete item.CurrencyCodeID;
      delete item.CurrencyCode;
      delete item.CurrencyExchangeRate;
    });

    this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, Items: customerInvoiceItems, CurrencyExchangeRate: exchangeRate.data.ExchangeRate } });
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
              ? i18n.t('AddNewCustomerInvoice.index.savingInvoice')
              : i18n.t('AddNewCustomerInvoice.index.creatingInvoice')}</Text>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.customer')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.searchCustomer')}
              isKeyboardInput={false}
              onPress={this.onCustomerSelect}
              value={
                this.state.customerInvoiceDetails.CustomerID
                  ? `${this.state.customerInvoiceDetails.CustomerNumber} ${this.state.customerInvoiceDetails.Customer}`
                  : ''
              }
              error={this.state.errors.Customer}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.invoiceDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.invoiceDate')}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('InvoiceDate')}
              value={this.state.customerInvoiceDetails.InvoiceDate.format('DD/MM/YYYY')}
              error={this.state.errors.InvoiceDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.dueDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.dueDate')}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('PaymentDueDate')}
              value={this.state.customerInvoiceDetails.PaymentDueDate ? this.state.customerInvoiceDetails.PaymentDueDate.format('DD/MM/YYYY') : ''}
              error={this.state.errors.PaymentDueDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.deliveryDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.deliveryDate')}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('DeliveryDate')}
              value={this.state.customerInvoiceDetails.DeliveryDate ? this.state.customerInvoiceDetails.DeliveryDate.format('DD/MM/YYYY') : ''}
              error={this.state.errors.DeliveryDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.currency')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={this.onCurrencyCodeSelect}
              value={this.state.customerInvoiceDetails.CurrencyCode}
              error={this.state.errors.CurrencyCode}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.paymentTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.paymentTerms')}
              isKeyboardInput={false}
              onPress={this.onPaymentTermSelect}
              value={
                this.state.customerInvoiceDetails.PaymentTermsID && this.state.customerInvoiceDetails.PaymentTerms && this.state.customerInvoiceDetails.PaymentTerms.Name
                  ? `${this.state.customerInvoiceDetails.PaymentTerms.Name}`
                  : ''
              }
              error={this.state.errors.PaymentTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.deliveryTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.deliveryTerms')}
              isKeyboardInput={false}
              onPress={this.onDeliveryTermSelect}
              value={
                this.state.customerInvoiceDetails.DeliveryTermsID && this.state.customerInvoiceDetails.DeliveryTerms && this.state.customerInvoiceDetails.DeliveryTerms.Name
                  ? `${this.state.customerInvoiceDetails.DeliveryTerms.Name}`
                  : ''
              }
              error={this.state.errors.DeliveryTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.theirReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : ''}
              onChangeText={text => this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, YourReference: text }, errors: { ...this.state.errors, YourReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.customerInvoiceDetails.YourReference}
              error={this.state.errors.YourReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.ourReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : ''}
              onChangeText={text => this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, OurReference: text }, errors: { ...this.state.errors, OurReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.customerInvoiceDetails.OurReference}
              error={this.state.errors.OurReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.email')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : ''}
              onChangeText={text => this.setState({ customerInvoiceDetails: { ...this.state.customerInvoiceDetails, EmailAddress: text }, errors: { ...this.state.errors, EmailAddress: null } })}
              isKeyboardInput={true}
              keyboardType={'email-address'}
              onFocus={this.scrollToBottom}
              value={this.state.customerInvoiceDetails.EmailAddress}
              error={this.state.errors.EmailAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.billingAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.billingAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.customerInvoiceDetails.BillingAddress)}
              onPress={this.onPressBillingAddress}
              error={this.state.errors.BillingAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.deliveryAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.deliveryAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.customerInvoiceDetails.DeliveryAddress)}
              onPress={this.onPressDeliveryAddress}
              error={this.state.errors.DeliveryAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.project')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.searchProject')}
              isKeyboardInput={false}
              onPress={this.onProjectSelect}
              value={this.state.customerInvoiceDetails.ProjectName}
              error={this.state.errors.Project}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.department')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.searchDepartment')}
              isKeyboardInput={false}
              onPress={this.onDepartmentSelect}
              value={this.state.customerInvoiceDetails.DepartmentName}
              error={this.state.errors.Department}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomerInvoice.index.mainSelling')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewCustomerInvoice.index.notSpecified') : i18n.t('AddNewCustomerInvoice.index.searchSeller')}
              isKeyboardInput={false}
              onPress={this.onDefaultSellerSelect}
              value={this.state.customerInvoiceDetails.DefaultSeller}
              error={this.state.errors.DefaultSeller}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.buttonContainer} >
              {this.props.navigation.state.params.isEdit ?
                <GenericButton
                  text={i18n.t('AddNewCustomerInvoice.index.clearChanges')}
                  textStyle={styles.clearButtonText}
                  buttonStyle={styles.clearButton}
                  onPress={this.clearChanges}
                /> : null}
            </View>
          </View>

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
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
    resetToCustomerInvoiceDetails: invoiceParams =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'CustomerInvoiceList' }),
          NavigationActions.navigate({ routeName: 'CustomerInvoiceDetails', params: { ...invoiceParams } })
        ]
      })),
    updateCustomerInvoiceList: () => dispatch({ type: 'UPDATE_CUSTOMER_INVOICE_LIST_LAST_EDITED_TIMESTAMP' }),
    addNewAddressToList: address => dispatch(addNewAddressToList(address)),
    clearAddressList: () => dispatch(clearAddressList()),
    setAddressList: list => dispatch(setAddressList(list)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewCustomerInvoice);

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
  }
});
