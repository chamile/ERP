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
import QuoteService from '../../services/QuoteService';
import SellerService from '../../services/SellerService';
import CurrencyService from '../../services/CurrencyService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { addNewAddressToList, clearAddressList, setAddressList } from '../../actions/addressListActions';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import TermsService from '../../services/TermsService';

class AddNewQuote extends Component {

  static navigationOptions = (props) => {
    const { navigation } = props;
    return {
      title: navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.title')
        : (navigation.state.params.isEdit ? i18n.t('AddNewQuote.index.editTitle') : i18n.t('AddNewQuote.index.title')),
      headerRight: navigation.state.params.isViewOnly ? <HeaderTextButton /> :
        <HeaderTextButton
          position={'right'}
          isActionComplete={navigation.state.params.isActionComplete}
          onPress={navigation.state.params.handleCreation}
          text={navigation.state.params.isEdit
            ? i18n.t('AddNewQuote.index.save')
            : i18n.t('AddNewQuote.index.create')}
        />,
      headerLeft: <HeaderTextButton
        navigate={navigation.navigate}
        onPress={() => { Keyboard.dismiss(); navigation.state.params.clearAddressData(); navigation.goBack(); }}
        text={i18n.t('AddNewQuote.index.cancel')}
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
      quoteDetails: {
        CustomerID: '',
        CustomerNumber: '',
        Customer: '',
        CurrencyCodeID: '1',
        CurrencyCode: 'NOK',
        CurrencyExchangeRate: '',
        Items: [],
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
        QuoteDate: moment(),
        ValidUntilDate: moment().add(28, 'days'),
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
        QuoteDate: null,
        ValidUntilDate: null,
        DeliveryDate: null,
        DeliveryAddress: null,
        BillingAddress: null,
        PaymentTerms: null,
        DeliveryTerms: null,
        Department: null,
      }
    };

    this.quoteID = 0;
    this.isActionComplete = false;
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.createQuote = this.createQuote.bind(this);
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
      const { quoteData } = this.props.navigation.state.params;
      const DeliveryAddress = {
        City: quoteData.ShippingCity ? quoteData.ShippingCity : '',
        PostalCode: quoteData.ShippingPostalCode ? quoteData.ShippingPostalCode : '',
        AddressLine1: quoteData.ShippingAddressLine1 ? quoteData.ShippingAddressLine1 : '',
        AddressLine2: quoteData.ShippingAddressLine2 ? quoteData.ShippingAddressLine2 : '',
        AddressLine3: quoteData.ShippingAddressLine3 ? quoteData.ShippingAddressLine3 : '',
        Country: quoteData.ShippingCountry ? quoteData.ShippingCountry : '',
        CountryCode: quoteData.ShippingCountryCode ? quoteData.ShippingCountryCode : '',
        CountryId: null,
        ID: null,
      };
      const BillingAddress = {
        City: quoteData.InvoiceCity ? quoteData.InvoiceCity : '',
        PostalCode: quoteData.InvoicePostalCode ? quoteData.InvoicePostalCode : '',
        AddressLine1: quoteData.InvoiceAddressLine1 ? quoteData.InvoiceAddressLine1 : '',
        AddressLine2: quoteData.InvoiceAddressLine2 ? quoteData.InvoiceAddressLine2 : '',
        AddressLine3: quoteData.InvoiceAddressLine3 ? quoteData.InvoiceAddressLine3 : '',
        Country: quoteData.InvoiceCountry ? quoteData.InvoiceCountry : '',
        CountryCode: quoteData.InvoiceCountryCode ? quoteData.InvoiceCountryCode : '',
        CountryId: null,
        ID: null,
      };
      this.setState({
        quoteDetails: {
          CustomerID: quoteData.CustomerID ? quoteData.CustomerID : '',
          CustomerNumber: quoteData.Customer && quoteData.Customer.CustomerNumber ? quoteData.Customer.CustomerNumber : '',
          Customer: quoteData.CustomerName ? quoteData.CustomerName : '',
          CurrencyCodeID: quoteData.CurrencyCodeID ? quoteData.CurrencyCodeID : '',
          CurrencyCode: quoteData.CurrencyCode ? quoteData.CurrencyCode.Code : '',
          CurrencyExchangeRate: quoteData.CurrencyExchangeRate ? quoteData.CurrencyExchangeRate : '',
          Items: quoteData.Items ? quoteData.Items : [],
          Project: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Project ? quoteData.DefaultDimensions.Project.Name : '',
          ProjectNumber: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Project ? quoteData.DefaultDimensions.Project.ProjectNumber : '',
          Department: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Department ? quoteData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Department ? quoteData.DefaultDimensions.Department.DepartmentNumber : '',
          DefaultDimensions: quoteData.DefaultDimensions ? quoteData.DefaultDimensions : null,
          DefaultDimensionsID: quoteData.DefaultDimensionsID ? quoteData.DefaultDimensionsID : null,
          DefaultSellerID: quoteData.DefaultSellerID ? quoteData.DefaultSellerID : '',
          DefaultSeller: quoteData.DefaultSeller ? quoteData.DefaultSeller.Name : '',
          YourReference: quoteData.YourReference ? quoteData.YourReference : '',
          OurReference: quoteData.OurReference ? quoteData.OurReference : '',
          EmailAddress: quoteData.EmailAddress ? quoteData.EmailAddress : '',
          QuoteDate: quoteData.QuoteDate ? moment(quoteData.QuoteDate) : '',
          ValidUntilDate: quoteData.ValidUntilDate != null ? moment(quoteData.ValidUntilDate) : moment().add(28, 'days'),
          DeliveryDate: quoteData.DeliveryDate != null ? moment(quoteData.DeliveryDate) : '',
          DeliveryAddress: { ...DeliveryAddress },
          BillingAddress: { ...BillingAddress },
          BillingAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? 0 : null,
          DeliveryAddressArrayIndex: !_.isEqualWith(BillingAddress, obj) ? !_.isEqualWith(DeliveryAddress, obj) ? _.isEqual(this.state.quoteDetails.BillingAddress, this.state.quoteDetails.DeliveryAddress) ? 0 : 1 : null : !_.isEqualWith(DeliveryAddress, obj) ? 0 : null, // set the index of seleceted address accroding to availability of billing and delivery address
          PaymentTerms: quoteData.PaymentTerms ? quoteData.PaymentTerms : null,
          PaymentTermsID: quoteData.PaymentTerms ? quoteData.PaymentTermsID : null,
          DeliveryTerms: quoteData.DeliveryTerms ? quoteData.DeliveryTerms : null,
          DeliveryTermsID: quoteData.DeliveryTerms ? quoteData.DeliveryTermsID : null,
        }
      }, () => {
        if (_.isEqual(this.state.quoteDetails.BillingAddress, this.state.quoteDetails.DeliveryAddress) && !_.isEqualWith(this.state.quoteDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.quoteDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.quoteDetails.BillingAddress, obj) && !_.isEqualWith(this.state.quoteDetails.DeliveryAddress, obj) && !_.isEqual(this.state.quoteDetails.BillingAddress, this.state.quoteDetails.DeliveryAddress)) {
          this.props.setAddressList([this.state.quoteDetails.BillingAddress, this.state.quoteDetails.DeliveryAddress]);
        }
        else if (!_.isEqualWith(this.state.quoteDetails.BillingAddress, obj)) {
          this.props.setAddressList([this.state.quoteDetails.BillingAddress]);
        }
        else if (!_.isEqualWith(this.state.quoteDetails.DeliveryAddress, obj)) {
          this.props.setAddressList([this.state.quoteDetails.DeliveryAddress]);
        }
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.addressList.lastEditedTime !== this.props.addressList.lastEditedTime)) {
      if (nextProps.addressList.lastEditedIndex === this.state.quoteDetails.BillingAddressArrayIndex) {
        this.setBillinAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex);
      }
      if (nextProps.addressList.lastEditedIndex === this.state.quoteDetails.DeliveryAddressArrayIndex) {
        setTimeout(() => { this.setDeliveryAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex); }, 500);
      }
    }
  }

  handleCreateQuoteErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewQuote.index.somethingWrong')) {
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
      this.createQuote(this.handleCreation);
    } else {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    }
  }

  clearChanges() {
    if (this.props.navigation.state.params.isEdit) {
      const { quoteData } = this.props.navigation.state.params;
      this.setState({
        quoteDetails: {
          CustomerID: quoteData.CustomerID ? quoteData.CustomerID : '',
          CustomerNumber: quoteData.Customer && quoteData.Customer.CustomerNumber ? quoteData.Customer.CustomerNumber : '',
          Customer: quoteData.CustomerName ? quoteData.CustomerName : '',
          CurrencyCodeID: quoteData.CurrencyCodeID ? quoteData.CurrencyCodeID : '',
          CurrencyCode: quoteData.CurrencyCode ? quoteData.CurrencyCode.Code : '',
          Project: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Project ? quoteData.DefaultDimensions.Project.Name : '',
          ProjectNumber: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Project ? quoteData.DefaultDimensions.Project.ProjectNumber : '',
          Department: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Department ? quoteData.DefaultDimensions.Department.Name : '',
          DepartmentNumber: quoteData.DefaultDimensions && quoteData.DefaultDimensions.Department ? quoteData.DefaultDimensions.Department.DepartmentNumber : '',
          DefaultDimensions: quoteData.DefaultDimensions ? quoteData.DefaultDimensions : null,
          DefaultDimensionsID: quoteData.DefaultDimensionsID ? quoteData.DefaultDimensionsID : null,
          DefaultSellerID: quoteData.DefaultSellerID ? quoteData.DefaultSellerID : '',
          DefaultSeller: quoteData.DefaultSeller ? quoteData.DefaultSeller.Name : '',
          YourReference: quoteData.YourReference ? quoteData.YourReference : '',
          OurReference: quoteData.OurReference ? quoteData.OurReference : '',
          EmailAddress: quoteData.EmailAddress ? quoteData.EmailAddress : '',
          QuoteDate: quoteData.QuoteDate ? moment(quoteData.QuoteDate) : '',
          ValidUntilDate: quoteData.ValidUntilDate ? moment(quoteData.ValidUntilDate) : '',
          DeliveryDate: quoteData.DeliveryDate ? moment(quoteData.DeliveryDate) : '',
          DeliveryAddress: {
            City: quoteData.ShippingCity ? quoteData.ShippingCity : '',
            PostalCode: quoteData.ShippingPostalCode ? quoteData.ShippingPostalCode : '',
            AddressLine1: quoteData.ShippingAddressLine1 ? quoteData.ShippingAddressLine1 : '',
            AddressLine2: quoteData.ShippingAddressLine2 ? quoteData.ShippingAddressLine2 : '',
            AddressLine3: quoteData.ShippingAddressLine3 ? quoteData.ShippingAddressLine3 : '',
            Country: quoteData.ShippingCountry ? quoteData.ShippingCountry : '',
            CountryCode: quoteData.ShippingCountryCode ? quoteData.ShippingCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddress: {
            City: quoteData.InvoiceCity ? quoteData.InvoiceCity : '',
            PostalCode: quoteData.InvoicePostalCode ? quoteData.InvoicePostalCode : '',
            AddressLine1: quoteData.InvoiceAddressLine1 ? quoteData.InvoiceAddressLine1 : '',
            AddressLine2: quoteData.InvoiceAddressLine2 ? quoteData.InvoiceAddressLine2 : '',
            AddressLine3: quoteData.InvoiceAddressLine3 ? quoteData.InvoiceAddressLine3 : '',
            Country: quoteData.InvoiceCountry ? quoteData.InvoiceCountry : '',
            CountryCode: quoteData.InvoiceCountryCode ? quoteData.InvoiceCountryCode : '',
            CountryId: null,
            ID: null,
          },
          BillingAddressArrayIndex: quoteData.InvoiceAddressLine1 ? 0 : null,
          DeliveryAddressArrayIndex: quoteData.ShippingAddressLine1 ? 0 : null,
          PaymentTerms: quoteData.PaymentTerms ? quoteData.PaymentTerms : null,
          PaymentTermsID: quoteData.PaymentTerms ? quoteData.PaymentTermsID : null,
          DeliveryTerms: quoteData.DeliveryTerms ? quoteData.DeliveryTerms : null,
          DeliveryTermsID: quoteData.DeliveryTerms ? quoteData.DeliveryTermsID : null,
        }
      });
    } else {
      this.setState({
        quoteDetails: {
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
          QuoteDate: moment(),
          ValidUntilDate: moment(),
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
          QuoteDate: null,
          ValidUntilDate: null,
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

  async createQuote(caller) {
    try {
      const quoteDetails = this.state.quoteDetails;
      let quote = {};

      if (this.props.navigation.state.params.isEdit) {
        const previousData = this.props.navigation.state.params.quoteData;
        quote = {
          CurrencyCodeID: quoteDetails.CurrencyCodeID,
          CurrencyExchangeRate: quoteDetails.CurrencyExchangeRate,
          CustomerID: quoteDetails.CustomerID,
          CustomerName: quoteDetails.Customer,
          Items: quoteDetails.Items,
          Sellers: previousData.Sellers ? previousData.Sellers : [],
          ID: previousData.ID,
          QuoteDate: quoteDetails.QuoteDate ? quoteDetails.QuoteDate.format('YYYY-MM-DD') : null,
          ValidUntilDate: quoteDetails.ValidUntilDate ? quoteDetails.ValidUntilDate.format('YYYY-MM-DD') : null,
          DeliveryDate: quoteDetails.DeliveryDate ? quoteDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          InvoiceAddressLine1: quoteDetails.BillingAddress.AddressLine1 ? quoteDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: quoteDetails.BillingAddress.AddressLine2 ? quoteDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: quoteDetails.BillingAddress.AddressLine3 ? quoteDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: quoteDetails.BillingAddress.City ? quoteDetails.BillingAddress.City : null,
          InvoiceCountry: quoteDetails.BillingAddress.Country ? quoteDetails.BillingAddress.Country : null,
          InvoiceCountryCode: quoteDetails.BillingAddress.CountryCode ? quoteDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: quoteDetails.BillingAddress.PostalCode ? quoteDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: quoteDetails.DeliveryAddress.AddressLine1 ? quoteDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: quoteDetails.DeliveryAddress.AddressLine2 ? quoteDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: quoteDetails.DeliveryAddress.AddressLine3 ? quoteDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: quoteDetails.DeliveryAddress.City ? quoteDetails.DeliveryAddress.City : null,
          ShippingCountry: quoteDetails.DeliveryAddress.Country ? quoteDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: quoteDetails.DeliveryAddress.CountryCode ? quoteDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: quoteDetails.DeliveryAddress.PostalCode ? quoteDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: quoteDetails.PaymentTermsID,
          PaymentTerms: quoteDetails.PaymentTerms,
          DeliveryTermsID: quoteDetails.DeliveryTermsID,
          DeliveryTerms: quoteDetails.DeliveryTerms,
          YourReference: quoteDetails.YourReference ? quoteDetails.YourReference : null,
          OurReference: quoteDetails.OurReference ? quoteDetails.OurReference : null,
          EmailAddress: quoteDetails.EmailAddress ? quoteDetails.EmailAddress : null,
        };
        quoteDetails.DefaultSellerID ? quote.DefaultSellerID = quoteDetails.DefaultSellerID : null;
        quoteDetails.DefaultDimensions ? quote.DefaultDimensions = quoteDetails.DefaultDimensions : null;
        quoteDetails.DefaultDimensionsID ? quote.DefaultDimensionsID = quoteDetails.DefaultDimensionsID : null;

        await QuoteService.editQuoteDetails(this.props.company.selectedCompany.Key, previousData.ID, quote);
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Customer Quote' });
      } else {
        quote = {
          CurrencyCodeID: quoteDetails.CurrencyCodeID,
          CustomerID: quoteDetails.CustomerID,
          CustomerName: quoteDetails.Customer,
          QuoteDate: quoteDetails.QuoteDate ? quoteDetails.QuoteDate.format('YYYY-MM-DD') : null,
          ValidUntilDate: quoteDetails.ValidUntilDate ? quoteDetails.ValidUntilDate.format('YYYY-MM-DD') : null,
          DeliveryDate: quoteDetails.DeliveryDate ? quoteDetails.DeliveryDate.format('YYYY-MM-DD') : null,
          Sellers: [],
          InvoiceAddressLine1: quoteDetails.BillingAddress.AddressLine1 ? quoteDetails.BillingAddress.AddressLine1 : null,
          InvoiceAddressLine2: quoteDetails.BillingAddress.AddressLine2 ? quoteDetails.BillingAddress.AddressLine2 : null,
          InvoiceAddressLine3: quoteDetails.BillingAddress.AddressLine3 ? quoteDetails.BillingAddress.AddressLine3 : null,
          InvoiceCity: quoteDetails.BillingAddress.City ? quoteDetails.BillingAddress.City : null,
          InvoiceCountry: quoteDetails.BillingAddress.Country ? quoteDetails.BillingAddress.Country : null,
          InvoiceCountryCode: quoteDetails.BillingAddress.CountryCode ? quoteDetails.BillingAddress.CountryCode : null,
          InvoicePostalCode: quoteDetails.BillingAddress.PostalCode ? quoteDetails.BillingAddress.PostalCode : null,
          ShippingAddressLine1: quoteDetails.DeliveryAddress.AddressLine1 ? quoteDetails.DeliveryAddress.AddressLine1 : null,
          ShippingAddressLine2: quoteDetails.DeliveryAddress.AddressLine2 ? quoteDetails.DeliveryAddress.AddressLine2 : null,
          ShippingAddressLine3: quoteDetails.DeliveryAddress.AddressLine3 ? quoteDetails.DeliveryAddress.AddressLine3 : null,
          ShippingCity: quoteDetails.DeliveryAddress.City ? quoteDetails.DeliveryAddress.City : null,
          ShippingCountry: quoteDetails.DeliveryAddress.Country ? quoteDetails.DeliveryAddress.Country : null,
          ShippingCountryCode: quoteDetails.DeliveryAddress.CountryCode ? quoteDetails.DeliveryAddress.CountryCode : null,
          ShippingPostalCode: quoteDetails.DeliveryAddress.PostalCode ? quoteDetails.DeliveryAddress.PostalCode : null,
          PaymentTermsID: quoteDetails.PaymentTermsID,
          PaymentTerms: quoteDetails.PaymentTerms,
          DeliveryTermsID: quoteDetails.DeliveryTermsID,
          DeliveryTerms: quoteDetails.DeliveryTerms
        };
        quoteDetails.YourReference ? quote.YourReference = quoteDetails.YourReference : null;
        quoteDetails.OurReference ? quote.OurReference = quoteDetails.OurReference : null;
        quoteDetails.EmailAddress ? quote.EmailAddress = quoteDetails.EmailAddress : null;
        quoteDetails.DefaultSellerID ? quote.DefaultSeller = { ID: quoteDetails.DefaultSellerID } : null;
        quoteDetails.DefaultSellerID ? quote.DefaultSellerID = quoteDetails.DefaultSellerID : null;
        quoteDetails.DefaultDimensions ? quote.DefaultDimensions = quoteDetails.DefaultDimensions : null;
        quoteDetails.DefaultDimensionsID ? quote.DefaultDimensionsID = quoteDetails.DefaultDimensionsID : null;

        const quoteResponse = await QuoteService.createQuote(this.props.company.selectedCompany.Key, quote);
        this.quoteID = quoteResponse.data.ID;
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Customer Quote' });
      }
      if (this.props.navigation.state.params.refreshData) {
        this.props.navigation.goBack();
        this.props.navigation.state.params.refreshData();
      } else {
        this.props.resetToQuoteDetails({
          quoteID: this.quoteID,
          EntityType: 'customerquote',
          CompanyKey: this.props.company.selectedCompany.Key,
        });
      }
      this.props.clearAddressList();
      this.props.updateQuoteList();
      this.startAnimation(true);
    } catch (error) {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.handleCreateQuoteErrors(error.problem, caller, this.props.navigation.state.params.isEdit
        ? i18n.t('AddNewQuote.index.saveQuoteError')
        : i18n.t('AddNewQuote.index.createQuoteError'));
    }
  }

  isValidEmail(email) {
    return email.match(/\S+@\S+\.\S+/);
  }

  isValid() {
    const errors = {};
    if (!this.state.quoteDetails.CustomerID || !this.state.quoteDetails.Customer) {
      errors.Customer = i18n.t('AddNewQuote.index.customerError');
    }
    if (!this.state.quoteDetails.CurrencyCodeID || !this.state.quoteDetails.CurrencyCode) {
      errors.CurrencyCode = i18n.t('AddNewQuote.index.currencyError');
    }
    if (this.state.quoteDetails.EmailAddress && !this.isValidEmail(this.state.quoteDetails.EmailAddress)) {
      errors.EmailAddress = i18n.t('AddNewQuote.index.emailError');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
  }

  _showDatePicker(picker) {
    this.setState({ isDateTimePickerVisible: true, picker, initialDate: this.state.quoteDetails[picker] || moment() });
  }

  _handleDatePicked(date) {
    let _date;
    if (this.state.picker === 'QuoteDate') {
      _date = { QuoteDate: moment(date) };
      this.setState({ isDateTimePickerVisible: false, quoteDetails: { ...this.state.quoteDetails, ..._date } });
    }
    else if (this.state.picker === 'ValidUntilDate') {
      if (date >= moment().startOf('day')) {
        _date = { ValidUntilDate: moment(date) };
        this.setState({ isDateTimePickerVisible: false, quoteDetails: { ...this.state.quoteDetails, ..._date } });
      }
    }
    else if (this.state.picker === 'DeliveryDate') {
      _date = { DeliveryDate: moment(date) };
      this.setState({ isDateTimePickerVisible: false, quoteDetails: { ...this.state.quoteDetails, ..._date } });
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
        title: i18n.t('AddNewQuote.index.searchCustomer'),
        searchCriteria: i18n.t('AddNewQuote.index.searchCustomerId'),
        entityType: EntityType.CUSTOMER,
        setter: this.setCustomer,
        service: CustomerService.getCustomers.bind(null, this.props.company.selectedCompany.Key),
        filter: (customer, serachText) => this.filterCustomer(customer, serachText)
      },
      navigateFrom: 'AddNewQuote'
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
    let quote = {
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
      quote.DeliveryDate = moment(this.state.quoteDetails.QuoteDate).add(customer.DeliveryTerms.CreditDays, 'days');
    }

    if (from == null) {
      // set addressList and selected address index of the list when fetching addresses from customer details
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        quote.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        quote.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        quote.BillingAddressArrayIndex = this.props.addressList.addresses.length;
        quote.DeliveryAddressArrayIndex = this.props.addressList.addresses.length + 1;
      }
      else if (customer.Info.InvoiceAddress) {
        this.props.addNewAddressToList(customer.Info.InvoiceAddress);
        quote.BillingAddressArrayIndex = this.props.addressList.addresses.length;
      }
      else if (customer.Info.ShippingAddress) {
        this.props.addNewAddressToList(customer.Info.ShippingAddress);
        quote.DeliveryAddressArrayIndex = this.props.addressList.addresses.length;
      }
    }
    else {
      if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress && _.isEqual(customer.Info.InvoiceAddress, customer.Info.ShippingAddress)) {
        quote.BillingAddressArrayIndex = this.props.addressList.addresses.length - 2;
        quote.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress && customer.Info.ShippingAddress) {
        quote.BillingAddressArrayIndex = this.props.addressList.addresses.length - 2;
        quote.DeliveryAddressArrayIndex = this.props.addressList.addresses.length - 1;
      }
      else if (customer.Info.InvoiceAddress) {
        quote.BillingAddressArrayIndex = 0;
        quote.DeliveryAddressArrayIndex = null;
      }
      else if (customer.Info.ShippingAddress) {
        quote.DeliveryAddressArrayIndex = null;
        quote.DeliveryAddressArrayIndex = 0;
      }
    }

    this.setState({
      quoteDetails: {
        ...this.state.quoteDetails,
        ...quote,
      },
    });
  }

  onPaymentTermSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, PaymentTerms: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewQuote.index.searchPaymentTerms'),
        searchCriteria: i18n.t('AddNewQuote.index.searchPaymentTermName'),
        entityType: EntityType.PAYMENT_TERMS,
        setter: this.setPaymentTerm,
        service: TermsService.getPaymentTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (paymentTerm, serachText) => this.filterPaymentTerm(paymentTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'AddNewQuote'
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
      quoteDetails: {
        ...this.state.quoteDetails,
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
        title: i18n.t('AddNewQuote.index.searchDeliveryTerms'),
        searchCriteria: i18n.t('AddNewQuote.index.searchDeliveryTermName'),
        entityType: EntityType.DELIVERY_TERMS,
        setter: this.setDeliveryTerm,
        service: TermsService.getDeliveryTerms.bind(null, this.props.company.selectedCompany.Key),
        filter: (deliveryTerm, serachText) => this.filterDeliveryTerm(deliveryTerm, serachText),
        showInstantResults: true,
      },
      navigateFrom: 'AddNewQuote'
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
      quoteDetails: {
        ...this.state.quoteDetails,
        DeliveryTerms: { ...DeliveryTerms },
        DeliveryTermsID: DeliveryTerms.ID,
        DeliveryDate: moment(this.state.quoteDetails.QuoteDate).add(paymentTerm.CreditDays, 'days')
      },
    });
  }

  onDefaultSellerSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DefaultSeller: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewQuote.index.searchSeller'),
        searchCriteria: i18n.t('AddNewQuote.index.seller'),
        showInstantResults: true,
        entityType: EntityType.SELLER,
        setter: this.setDefaultSeller,
        service: SellerService.getSellers.bind(null, this.props.company.selectedCompany.Key),
        filter: (seller, serachText) => this.filterSeller(seller, serachText),
        selectedItem: {
          ID: this.state.quoteDetails.DefaultSellerID,
          Display: this.state.quoteDetails.DefaultSeller,
        },
        clearSelectedItem: this.clearDefaultSeller,
      }
    });
  }

  clearDefaultSeller() {
    this.setState({ quoteDetails: { ...this.state.quoteDetails, DefaultSellerID: null, DefaultSeller: null } });
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
    this.setState({ quoteDetails: { ...this.state.quoteDetails, DefaultSellerID: seller.ID, DefaultSeller: seller.Name } });
  }

  onProjectSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Project: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewQuote.index.searchProject'),
        searchCriteria: i18n.t('AddNewQuote.index.project'),
        showInstantResults: true,
        entityType: EntityType.PROJECT,
        setter: this.setProject,
        service: ProjectService.getProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
        selectedItem: {
          ID: this.state.quoteDetails.ProjectNumber,
          Display: this.state.quoteDetails.Project,
        },
        clearSelectedItem: this.clearProject,
      }
    });
  }

  clearProject() {
    const temp = this.state.quoteDetails.DefaultDimensions || {};
    this.setState({ quoteDetails: { ...this.state.quoteDetails, Project: null, ProjectNumber: null, DefaultDimensions: { ...temp, ProjectID: null } } });
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
    const temp = this.state.quoteDetails.DefaultDimensions || {};
    this.setState({ quoteDetails: { ...this.state.quoteDetails, ProjectID: project.ID, Project: project.Name, ProjectNumber: project.ProjectNumber, DefaultDimensions: { ...temp, ProjectID: project.ID, _createguid: createGuid() } } });
  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Department: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewQuote.index.searchDepartment'),
        searchCriteria: i18n.t('AddNewQuote.index.searchDepartmentCriteria'),
        showInstantResults: true,
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
        selectedItem: {
          ID: this.state.quoteDetails.DepartmentNumber,
          Display: this.state.quoteDetails.Department,
        },
        clearSelectedItem: this.clearDepartment,
      }
    });
  }

  clearDepartment() {
    const temp = this.state.quoteDetails.DefaultDimensions || {};
    this.setState({ quoteDetails: { ...this.state.quoteDetails, Department: null, DepartmentNumber: null, DefaultDimensions: { ...temp, DepartmentID: null } } });
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
    const temp = this.state.quoteDetails.DefaultDimensions || {};
    this.setState({ quoteDetails: { ...this.state.quoteDetails, Department: department.Name, DepartmentNumber: department.DepartmentNumber, DefaultDimensions: { ...temp, DepartmentID: department.ID, _createguid: createGuid() } } });
  }

  onCurrencyCodeSelect() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, CurrencyCode: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewQuote.index.searchCurrency'),
        searchCriteria: i18n.t('AddNewQuote.index.currency'),
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
    if (currency.ID !== this.state.quoteDetails.CurrencyCodeID) {
      this.getUpdatedCurrencyExchangeRate(currency);
    }
    this.setState({ quoteDetails: { ...this.state.quoteDetails, CurrencyCodeID: currency.ID, CurrencyCode: currency.Code } });
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
      this.state.quoteDetails.QuoteDate.format('YYYY-MM-DD')
    );

    let quoteItems = this.state.quoteDetails.Items.map(item => {
      return {
        ...item,
        CurrencyCodeID: this.state.quoteDetails.CurrencyCodeID,
        CurrencyExchangeRate: exchangeRate.data.ExchangeRate
      };
    });

    quoteItems.forEach(item => {
      item.PriceExVatCurrency = this.round(item.PriceExVat / exchangeRate.data.ExchangeRate, 4);
      item.PriceIncVatCurrency = this.round(item.PriceIncVat / exchangeRate.data.ExchangeRate, 4);
      delete item.VatType;
      delete item.CurrencyCodeID;
      delete item.CurrencyCode;
      delete item.CurrencyExchangeRate;
    });

    this.setState({ quoteDetails: { ...this.state.quoteDetails, Items: quoteItems, CurrencyExchangeRate: exchangeRate.data.ExchangeRate } });
  }

  onPressDeliveryAddress() {
    if (this.state.quoteDetails.DeliveryAddress == null || this.state.quoteDetails.DeliveryAddress == "") {
      this.state.quoteDetails.DeliveryAddressArrayIndex = null;
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
          selectedAddressArrayIndex: this.state.quoteDetails.DeliveryAddressArrayIndex,
        }
      });
    }
  }

  setDeliveryAddress(address, index) {
    this.setState({ quoteDetails: { ...this.state.quoteDetails, DeliveryAddress: { ...address }, DeliveryAddressArrayIndex: index } });
  }

  clearDeliveryAddress(address, index) {
    this.setState({
      quoteDetails: {
        ...this.state.quoteDetails,
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
    if (this.state.quoteDetails.BillingAddress == null || this.state.quoteDetails.BillingAddress == "") {
      this.state.quoteDetails.BillingAddressArrayIndex = null;
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
          selectedAddressArrayIndex: this.state.quoteDetails.BillingAddressArrayIndex,
        }
      });
    }
  }

  clearBillingAddress(address, index) {
    this.setState({
      quoteDetails: {
        ...this.state.quoteDetails,
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
    this.setState({ quoteDetails: { ...this.state.quoteDetails, BillingAddress: { ...address }, BillingAddressArrayIndex: index } });
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
              ? i18n.t('AddNewQuote.index.savingQuote')
              : i18n.t('AddNewQuote.index.creatingQuote')}</Text>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.customer')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.searchCustomer')}
              isKeyboardInput={false}
              onPress={this.onCustomerSelect}
              value={
                this.state.quoteDetails.CustomerID
                  ? `${this.state.quoteDetails.CustomerNumber} ${this.state.quoteDetails.Customer}`
                  : ''
              }
              error={this.state.errors.Customer}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.quoteDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('QuoteDate')}
              value={this.state.quoteDetails.QuoteDate.format('DD/MM/YYYY')}
              error={this.state.errors.QuoteDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.quoteValidityDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('ValidUntilDate')}
              value={this.state.quoteDetails.ValidUntilDate.format('DD/MM/YYYY')}
              error={this.state.errors.ValidUntilDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.deliveryDate')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={() => this._showDatePicker('DeliveryDate')}
              value={this.state.quoteDetails.DeliveryDate ? this.state.quoteDetails.DeliveryDate.format('DD/MM/YYYY') : ''}
              error={this.state.errors.DeliveryDate}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.currency')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              isKeyboardInput={false}
              onPress={this.onCurrencyCodeSelect}
              value={this.state.quoteDetails.CurrencyCode}
              error={this.state.errors.CurrencyCode}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.paymentTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.paymentTerms')}
              isKeyboardInput={false}
              onPress={this.onPaymentTermSelect}
              value={
                this.state.quoteDetails.PaymentTermsID && this.state.quoteDetails.PaymentTerms && this.state.quoteDetails.PaymentTerms.Name
                  ? `${this.state.quoteDetails.PaymentTerms.Name}`
                  : ''
              }
              error={this.state.errors.PaymentTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.deliveryTerms')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.deliveryTerms')}
              isKeyboardInput={false}
              onPress={this.onDeliveryTermSelect}
              value={
                this.state.quoteDetails.DeliveryTermsID && this.state.quoteDetails.DeliveryTerms && this.state.quoteDetails.DeliveryTerms.Name
                  ? `${this.state.quoteDetails.DeliveryTerms.Name}`
                  : ''
              }
              error={this.state.errors.DeliveryTerms}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.theirReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              onChangeText={text => this.setState({ quoteDetails: { ...this.state.quoteDetails, YourReference: text }, errors: { ...this.state.errors, YourReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.quoteDetails.YourReference}
              error={this.state.errors.YourReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.ourReference')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              onChangeText={text => this.setState({ quoteDetails: { ...this.state.quoteDetails, OurReference: text }, errors: { ...this.state.errors, OurReference: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.quoteDetails.OurReference}
              error={this.state.errors.OurReference}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.email')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : ''}
              onChangeText={text => this.setState({ quoteDetails: { ...this.state.quoteDetails, EmailAddress: text }, errors: { ...this.state.errors, EmailAddress: null } })}
              isKeyboardInput={true}
              keyboardType={'email-address'}
              onFocus={this.scrollToBottom}
              value={this.state.quoteDetails.EmailAddress}
              error={this.state.errors.EmailAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.billingAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.billingAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.quoteDetails.BillingAddress)}
              onPress={this.onPressBillingAddress}
              error={this.state.errors.BillingAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.deliveryAddress')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.deliveryAddress')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.quoteDetails.DeliveryAddress)}
              onPress={this.onPressDeliveryAddress}
              error={this.state.errors.DeliveryAddress}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.project')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.searchProject')}
              isKeyboardInput={false}
              onPress={this.onProjectSelect}
              value={this.state.quoteDetails.Project}
              error={this.state.errors.Project}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.department')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.searchDepartment')}
              isKeyboardInput={false}
              onPress={this.onDepartmentSelect}
              value={this.state.quoteDetails.Department}
              error={this.state.errors.Department}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuote.index.mainSelling')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewQuote.index.notSpecified') : i18n.t('AddNewQuote.index.searchSeller')}
              isKeyboardInput={false}
              onPress={this.onDefaultSellerSelect}
              value={this.state.quoteDetails.DefaultSeller}
              error={this.state.errors.DefaultSeller}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.buttonContainer} >
              {this.props.navigation.state.params.isViewOnly ? null :
                <GenericButton
                  text={i18n.t('AddNewQuote.index.clearChanges')}
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
    resetToQuoteDetails: (quoteParams) =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'QuoteList' }),
          NavigationActions.navigate({ routeName: 'QuoteDetails', params: { ...quoteParams } })
        ]
      })),
    updateQuoteList: () => dispatch({ type: 'UPDATE_QUOTES_LAST_EDITED_TIMESTAMP' }),
    addNewAddressToList: address => dispatch(addNewAddressToList(address)),
    clearAddressList: () => dispatch(clearAddressList()),
    setAddressList: list => dispatch(setAddressList(list)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewQuote);

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
