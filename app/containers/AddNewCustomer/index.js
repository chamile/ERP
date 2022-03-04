// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { NavigationActions, StackActions } from 'react-navigation';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Analytics from 'appcenter-analytics';
import _ from 'lodash';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import CustomerService from '../../services/CustomerService';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { createGuid } from '../../helpers/APIUtil';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { EntityType } from '../../constants/EntityTypes';
import { addNewAddressToList, clearAddressList, setAddressList, clearTempAddressList } from '../../actions/addressListActions';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

const WIDTH: number = Dimensions.get('window').width;

class AddNewCustomer extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.isEditMode ? i18n.t('AddNewCustomer.index.editCustomer') : i18n.t('AddNewCustomer.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={navigation.state.params.isEditMode ? i18n.t('AddNewCustomer.index.save') : i18n.t('AddNewCustomer.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.state.params.handleAddressList(); navigation.goBack(); }} text={i18n.t('AddNewProduct.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      customerDetails: {
        Name: '',
        Email: '',
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
        Phone: '',
        OrgNumber: '',
        Info: {
          Addresses: []
        },
        BillingAddressArrayIndex: null,
        DeliveryAddressArrayIndex: null,
      },
      moveAnimation: new Animated.Value(0),
      errors: {
        Name: '',
        Email: '',
        BillingAddress: '',
        DeliveryAddress: '',
        Phone: '',
        OrgNumber: ''
      },
      isUploading: false,
    };

    this.addNewCustomer = this.addNewCustomer.bind(this);
    this.setaddNewCustomerDetails = this.setaddNewCustomerDetails.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.setBillinAddress = this.setBillinAddress.bind(this);
    this.setDeliveryAddress = this.setDeliveryAddress.bind(this);
    this.onPressDeliveryAddress = this.onPressDeliveryAddress.bind(this);
    this.onPressBillingAddress = this.onPressBillingAddress.bind(this);
    this.clearAddressData = this.clearAddressData.bind(this);
    this.setEditCustomerDetails = this.setEditCustomerDetails.bind(this);
    this.editCustomer = this.editCustomer.bind(this);
    this.clearBillingAddress = this.clearBillingAddress.bind(this);
    this.clearDeliveryAddress = this.clearDeliveryAddress.bind(this);
    this.handleAddressList = this.handleAddressList.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams({ handleAction: this.handleAction, disableActionButton: false, clearAddressData: this.clearAddressData, handleAddressList: this.handleAddressList });
    this.props.navigation.state.params.isEditMode ? this.setEditCustomerDetails() : this.setaddNewCustomerDetails();
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.addressList.lastEditedTime != this.props.addressList.lastEditedTime)) {
      if (nextProps.addressList.lastEditedIndex == this.state.customerDetails.BillingAddressArrayIndex) {
        this.setBillinAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex);
      }
      if (nextProps.addressList.lastEditedIndex == this.state.customerDetails.DeliveryAddressArrayIndex) {
        setTimeout(() => { this.setDeliveryAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex); }, 500);
      }
    }
  }
  setaddNewCustomerDetails() {
    if (this.props.navigation.state.params.data) {
      const { data } = this.props.navigation.state.params;
      this.setState({
        customerDetails: {
          Name: data.Name ? data.Name : '',
          Phone: data.Phone ? data.Phone : '',
          OrgNumber: data.OrganizationNumber ? data.OrganizationNumber : '',
          BillingAddress: {
            City: data.City ? data.City : '',
            AddressLine1: data.Streetaddress ? data.Streetaddress : '',
            AddressLine2: '',
            AddressLine3: '',
            PostalCode: data.PostCode ? data.PostCode : '',
            Country: '',
            CountryCode: null,
          },
          DeliveryAddress: {
            City: data.City ? data.City : '',
            AddressLine1: data.Streetaddress ? data.Streetaddress : '',
            AddressLine2: '',
            AddressLine3: '',
            PostalCode: data.PostCode ? data.PostCode : '',
            Country: '',
            CountryCode: null,
          },
          Email: data.EmailAddress ? data.EmailAddress : '',
          BillingAddressArrayIndex: 0,
          DeliveryAddressArrayIndex: 0,
        }
      });

      this.props.addNewAddressToList({
        City: data.City ? data.City : '',
        Country: '',
        CountryCode: null,
        PostalCode: data.PostCode ? data.PostCode : '',
        AddressLine1: data.Streetaddress ? data.Streetaddress : '',
        AddressLine2: '',
        AddressLine3: '',
      });

    }

    //Setting search text which come from manual customer adding
    if ((this.props.navigation.state.params.searchedText != undefined) && (this.props.navigation.state.params.searchedText != '')) {
      this.setState({ customerDetails: { ...this.state.customerDetails, Name: this.props.navigation.state.params.searchedText } });
    }


  }

  setEditCustomerDetails() {
    if (this.props.navigation.state.params && this.props.navigation.state.params.data) {
      const { data } = this.props.navigation.state.params;
      this.setState({
        customerDetails: {
          Name: data.Info.Name ? data.Info.Name : '',
          Phone: data.Info.DefaultPhone && data.Info.DefaultPhone.Number ? data.Info.DefaultPhone.Number : '',
          OrgNumber: data.OrgNumber ? data.OrgNumber : '',
          BillingAddress: data.Info.InvoiceAddress ? {
            ...data.Info.InvoiceAddress,
          } : {
              City: '',
              PostalCode: '',
              AddressLine1: '',
              AddressLine2: '',
              AddressLine3: '',
              Country: '',
              CountryCode: null,
              ID: null,
              CountryId: null,
            },
          DeliveryAddress: data.Info.ShippingAddress ? {
            ...data.Info.ShippingAddress,
          } : {
              City: '',
              PostalCode: '',
              AddressLine1: '',
              AddressLine2: '',
              AddressLine3: '',
              Country: '',
              CountryCode: null,
              ID: null,
              CountryId: null,
            },
          Email: data.Info.DefaultEmail && data.Info.DefaultEmail.EmailAddress ? data.Info.DefaultEmail.EmailAddress : '',
          BillingAddressArrayIndex: data.Info.Addresses.length > 0 && data.Info.InvoiceAddress && data.Info.InvoiceAddress.ID ? data.Info.Addresses.findIndex(address => address.ID == data.Info.InvoiceAddress.ID) : null,
          DeliveryAddressArrayIndex: data.Info.Addresses.length > 0 && data.Info.ShippingAddress && data.Info.ShippingAddress.ID ? data.Info.Addresses.findIndex(address => address.ID == data.Info.ShippingAddress.ID) : null,
        }
      });
      data.Info.Addresses && data.Info.Addresses.length > 0 ? this.props.setAddressList(data.Info.Addresses) : null;
    }
  }

  isOrgNumberValid(orgNumber) {
    if (orgNumber.toString().length != 9) {
      return false;
    }
    const wheightNumbers = [3, 2, 7, 6, 5, 4, 3, 2];
    const orgNumbers = orgNumber.toString().split('');
    const controlDigit = orgNumbers[orgNumbers.length - 1];
    const result = wheightNumbers.map((n, i) => n * orgNumbers[i]).reduce((a, b) => a + b, 0);
    const rest = result % 11;
    const calulatedControlDigit = rest === 0 || rest === 1 ? 0 : 11 - rest;
    return +controlDigit === calulatedControlDigit;
  }

  isValid() {
    const errors = {};
    if (!this.state.customerDetails.Name) {
      errors.Name = i18n.t('AddNewCustomer.index.noName');
    }
    if (this.state.customerDetails.OrgNumber && !this.isOrgNumberValid(this.state.customerDetails.OrgNumber)) {
      errors.OrgNumber = i18n.t('AddNewCustomer.index.noOrgNumber');
    }
    if (this.state.customerDetails.Email.length > 0 && !this.isValidEmail(this.state.customerDetails.Email)) {
      errors.Email = i18n.t('AddNewCustomer.index.noEmail');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  isValidEmail(email) {
    return email.match(/\S+@\S+\.\S+/);
  }

  clearAddressData() {
    this.props.clearAddressList();
  }
  handleAddressList() {
    if (this.props.navigation.state.params.navigateFrom != null) {
      this.props.addressList.tempAddresess ? this.props.addressList.addresses = this.props.addressList.tempAddresess : null;
    }
    else {
      this.props.navigation.state.params.clearAddressData();
    }
  }

  handleAction() {
    Keyboard.dismiss();
    if (!this.state.isUploading && this.isValid()) {
      this.setState({ isUploading: true });
      if (this.props.navigation.state.params.navigateFrom != null) {
        this.addNewCustomer();
      }
      else {
        this.props.navigation.state.params.isEditMode ? this.editCustomer() : this.addNewCustomer();
      }
    } else {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
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

  async addNewCustomer(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const { customerDetails } = this.state;

    const getProcessedAddressList = () => {
      const arr = this.props.addressList.addresses.filter(address =>
        !((this.state.customerDetails.DeliveryAddress.AddressLine1 == address.AddressLine1 &&
          this.state.customerDetails.DeliveryAddress.AddressLine2 == address.AddressLine2 &&
          this.state.customerDetails.DeliveryAddress.AddressLine3 == address.AddressLine3 &&
          this.state.customerDetails.DeliveryAddress.City == address.City &&
          this.state.customerDetails.DeliveryAddress.PostalCode == address.PostalCode &&
          this.state.customerDetails.DeliveryAddress.Country == address.Country &&
          this.state.customerDetails.DeliveryAddress.CountryCode == address.CountryCode)
          ||
          (this.state.customerDetails.BillingAddress.AddressLine1 == address.AddressLine1 &&
            this.state.customerDetails.BillingAddress.AddressLine2 == address.AddressLine2 &&
            this.state.customerDetails.BillingAddress.AddressLine3 == address.AddressLine3 &&
            this.state.customerDetails.BillingAddress.City == address.City &&
            this.state.customerDetails.BillingAddress.PostalCode == address.PostalCode &&
            this.state.customerDetails.BillingAddress.Country == address.Country &&
            this.state.customerDetails.BillingAddress.CountryCode == address.CountryCode))
      );
      return arr.map((address) => { address._createguid = createGuid(); return address; });
    };

    const customer = {
      ID: 0,
      CustomerNumber: 0,
      OrgNumber: customerDetails.OrgNumber,
      Info: {
        Name: customerDetails.Name !== '' ? customerDetails.Name : null,
        ID: 0,
        DefaultEmail: customerDetails.Email !== '' ?
          {
            EmailAddress: customerDetails.Email,
            ID: 0,
            _createguid: createGuid(),
            _initValue: customerDetails.Email.charAt(0)
          } : null,
        DefaultPhone: customerDetails.Phone.toString() !== '' ?
          {
            ID: 0,
            Number: customerDetails.Phone.toString(),
            _createguid: createGuid(),
            _initValue: customerDetails.Phone.toString().charAt(0)
          } : null,
        InvoiceAddress: customerDetails.BillingAddress.AddressLine1 !== '' ?
          {
            ID: 0,
            AddressLine1: customerDetails.BillingAddress.AddressLine1,
            AddressLine2: customerDetails.BillingAddress.AddressLine2,
            AddressLine3: customerDetails.BillingAddress.AddressLine3,
            City: customerDetails.BillingAddress.City,
            PostalCode: customerDetails.BillingAddress.PostalCode,
            Country: customerDetails.BillingAddress.Country,
            CountryCode: customerDetails.BillingAddress.CountryCode,
            _createguid: createGuid(),
            _initValue: customerDetails.BillingAddress.AddressLine1.charAt(0)
          } : null,
        ShippingAddress: customerDetails.DeliveryAddress.AddressLine1 !== '' ?
          {
            ID: 0,
            AddressLine1: customerDetails.DeliveryAddress.AddressLine1,
            AddressLine2: customerDetails.DeliveryAddress.AddressLine2,
            AddressLine3: customerDetails.DeliveryAddress.AddressLine3,
            City: customerDetails.DeliveryAddress.City,
            PostalCode: customerDetails.DeliveryAddress.PostalCode,
            Country: customerDetails.DeliveryAddress.Country,
            CountryCode: customerDetails.DeliveryAddress.CountryCode,
            _createguid: createGuid(),
            _initValue: customerDetails.DeliveryAddress.AddressLine1.charAt(0)
          } : null,
        Addresses: getProcessedAddressList(),
      }
    };
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    try {
      const response = await CustomerService.createCustomer(customer, companyKey);
      if (response.ok) {
        this.props.updateCustomerList();
        if (this.props.navigation.state.params.navigateFrom == null) {
          this.props.resetToCustomerDetails({
            customerID: response.data.ID,
            EntityType: EntityType.CUSTOMER,
            CompanyKey: companyKey,
          });
          this.props.clearAddressList();
        }
        else {
          this.props.clearTempAddressList();
          customer.ID = response.data.ID
          customer.CustomerNumber = response.data.CustomerNumber
          this.props.navigation.state.params.customerSetter(customer, 'ADD_CUSTOMER');
          this.props.navigation.goBack();
        }
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Customer' });
      }
    } catch (error) {
      this.setState({ isUploading: false });
      if (error.status === 400) {
        this.handleCustomerErrors(error.problem, caller, i18n.t('AddNewCustomer.index.incorrectInfo'));
      } else {
        this.handleCustomerErrors(error.problem, caller, i18n.t('AddNewCustomer.index.addError'));
      }
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }
  }

  async editCustomer(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const customerID = this.props.navigation.state.params.customerID;
    const originalData = this.props.navigation.state.params.data;
    const { customerDetails } = this.state;
    const getProcessedAddressList = (InvoiceAddress, ShippingAddress) => {
      return this.props.addressList.addresses.filter(address => !((_.isEqual(address, InvoiceAddress) && !address.ID) || (_.isEqual(address, ShippingAddress) && !address.ID)))
        .map((address) => { !address.ID ? address._createguid = createGuid() : null; return address; });
    };
    const ShippingAddress = customerDetails.DeliveryAddressArrayIndex === null ? null :
      {
        ...customerDetails.DeliveryAddress,
      };
    const InvoiceAddress = customerDetails.BillingAddressArrayIndex === null ? null :
      {
        ...customerDetails.BillingAddress,
      };
    const customer = {
      ID: originalData.ID,
      CustomerNumber: originalData.CustomerNumber,
      OrgNumber: customerDetails.OrgNumber,
      Info: {
        Name: customerDetails.Name,
        ID: originalData.Info.ID,
        DefaultEmail: customerDetails.Email !== '' ? originalData.Info.DefaultEmail ?
          {
            EmailAddress: customerDetails.Email,
            ID: originalData.Info.DefaultEmailID,
          } : {
            EmailAddress: customerDetails.Email,
            ID: 0,
            _createguid: createGuid(),
          } : null,
        DefaultPhone: customerDetails.Phone.toString() !== '' ? originalData.Info.DefaultPhone ?
          {
            ID: originalData.Info.DefaultPhoneID,
            Number: customerDetails.Phone.toString(),
          } : {
            Number: customerDetails.Phone.toString(),
            ID: 0,
            _createguid: createGuid(),
          } : null,
        InvoiceAddress,
        InvoiceAddressID: customerDetails.BillingAddress.ID ? customerDetails.BillingAddress.ID : null,
        ShippingAddress,
        ShippingAddressID: customerDetails.DeliveryAddress.ID ? customerDetails.DeliveryAddress.ID : null,
        Addresses: getProcessedAddressList(InvoiceAddress, ShippingAddress),
      }
    };

    if (customerDetails.Email === '') {
      customer.Info.DefaultEmailID = null;
    }
    if (customerDetails.Phone.toString() === '') {
      customer.Info.DefaultPhoneID = null;
    }
    if (!customer.Info.ShippingAddressID && customer.Info.ShippingAddress && customer.Info.ShippingAddress.AddressLine1) {
      customer.Info.ShippingAddress._createguid = createGuid();
    }
    if (!customer.Info.InvoiceAddressID && customer.Info.InvoiceAddress && customer.Info.InvoiceAddress.AddressLine1) {
      customer.Info.InvoiceAddress._createguid = createGuid();
    }
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    try {
      const response = await CustomerService.editCustomerDetails(customerID, customer, companyKey);
      if (response.ok) {
        this.props.updateCustomerList();
        this.props.navigation.state.params && this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
        this.props.navigation.goBack();
        this.props.clearAddressList();
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Customer' });
      }
    } catch (error) {
      this.setState({ isUploading: false });
      this.handleCustomerErrors(error.problem, caller, i18n.t('AddNewCustomer.index.editError'));
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }
  }

  handleCustomerErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewCustomer.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
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

  onPressBillingAddress() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, BillingAddress: null } });
    if (this.props.addressList.addresses.length == 0) {
      this.props.navigation.navigate({
        key: 'AddNewAddress', routeName: 'AddNewAddress', params: {
          setAddress: this.setBillinAddress,
        }
      });
    }
    else {
      this.props.navigation.navigate({
        key: 'AddressList', routeName: 'AddressList', params: {
          data: {
            setAddress: this.setBillinAddress,
            clearAddress: this.clearBillingAddress,
            selectedAddressArrayIndex: this.state.customerDetails.BillingAddressArrayIndex,
          }
        }
      });
    }
  }

  onPressDeliveryAddress() {

    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, DeliveryAddress: null } });
    if (this.props.addressList.addresses.length == 0) {
      this.props.navigation.navigate({
        key: 'AddNewAddress', routeName: 'AddNewAddress', params: {
          setAddress: this.setDeliveryAddress,
        }
      });
    }
    else {
      this.props.navigation.navigate({
        key: 'AddressList', routeName: 'AddressList', params: {
          data: {
            setAddress: this.setDeliveryAddress,
            clearAddress: this.clearDeliveryAddress,
            selectedAddressArrayIndex: this.state.customerDetails.DeliveryAddressArrayIndex,
          }
        }
      });
    }
  }

  setBillinAddress(address, index) {
    this.setState({ customerDetails: { ...this.state.customerDetails, BillingAddress: { ...address }, BillingAddressArrayIndex: index } });
  }

  setDeliveryAddress(address, index) {
    this.setState({ customerDetails: { ...this.state.customerDetails, DeliveryAddress: { ...address }, DeliveryAddressArrayIndex: index } });
  }

  clearBillingAddress(address, index) {
    this.setState({
      customerDetails: {
        ...this.state.customerDetails,
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

  clearDeliveryAddress(address, index) {
    this.setState({
      customerDetails: {
        ...this.state.customerDetails,
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

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
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
            <Text>{`${this.props.navigation.state.params.isEditMode ? i18n.t('AddNewCustomer.index.saving') : i18n.t('AddNewCustomer.index.creating')} ...`}</Text>
          </View>
        </Animated.View>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.detailsContainer} >
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.name')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={true}
              value={this.state.customerDetails.Name ? this.state.customerDetails.Name : ''}
              onChangeText={Name => this.setState({ customerDetails: { ...this.state.customerDetails, Name }, errors: { ...this.state.errors, Name: '' } })}
              error={this.state.errors.Name}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.organization')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              value={this.state.customerDetails.OrgNumber ? this.state.customerDetails.OrgNumber : ''}
              onChangeText={OrgNumber => this.setState({ customerDetails: { ...this.state.customerDetails, OrgNumber }, errors: { ...this.state.errors, OrgNumber: '' } })}
              error={this.state.errors.OrgNumber}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.billingAddress')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.customerDetails.BillingAddress)}
              onPress={this.onPressBillingAddress}
              error={this.state.errors.BillingAddress}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.deliveryAddress')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.customerDetails.DeliveryAddress)}
              onPress={this.onPressDeliveryAddress}
              error={this.state.errors.DeliveryAddress}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.email')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'email-address'}
              value={this.state.customerDetails.Email ? this.state.customerDetails.Email : ''}
              onChangeText={Email => this.setState({ customerDetails: { ...this.state.customerDetails, Email }, errors: { ...this.state.errors, Email: '' } })}
              error={this.state.errors.Email}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewCustomer.index.phone')}
              placeHolder={i18n.t('AddNewCustomer.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'phone-pad'}
              error={this.state.errors.Phone}
              value={this.state.customerDetails.Phone ? this.state.customerDetails.Phone : ''}
              onChangeText={Phone => this.setState({ customerDetails: { ...this.state.customerDetails, Phone }, errors: { ...this.state.errors, Phone: '' } })}
              onFocus={this.scrollToBottom}
            />
          </View>
          <View style={styles.spacer} />
          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    addressList: state.addressList,
    tempAddresess: state.tempAddresess,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateCustomerList: () => dispatch({ type: 'UPDATE_CUSTOMERS_LAST_EDITED_TIMESTAMP' }),
    resetToCustomerDetails: customerData =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'CustomerList' }),
          NavigationActions.navigate({ routeName: 'CustomerDetails', params: { ...customerData } })
        ]
      })),
    addNewAddressToList: address => dispatch(addNewAddressToList(address)),
    clearAddressList: () => dispatch(clearAddressList()),
    setAddressList: list => dispatch(setAddressList(list)),
    clearTempAddressList: () => dispatch(clearTempAddressList()),

  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewCustomer);

const styles = StyleSheet.create({
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    paddingTop: 10,
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    height: 50,
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
  iphoneXSpace: {
    height: 50,
  }
});
