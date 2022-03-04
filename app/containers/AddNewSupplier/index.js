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
import { NavigationActions,StackActions } from 'react-navigation';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Analytics from 'appcenter-analytics';
import _ from 'lodash';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import SupplierService from '../../services/SupplierService';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { createGuid } from '../../helpers/APIUtil';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { EntityType } from '../../constants/EntityTypes';
import { addNewAddressToList, clearAddressList, setAddressList } from '../../actions/addressListActions';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { udpadeRecentlyAddedBankAccounts } from '../../actions/recentDataActions';

const WIDTH: number = Dimensions.get('window').width;

class AddNewSupplier extends Component {
  static navigationOptions = ({ navigation }) => {

    return {
      title: navigation.state.params.isEditMode ? i18n.t('AddNewSupplier.index.editSupplier') : i18n.t('AddNewSupplier.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={navigation.state.params.isEditMode ? i18n.t('AddNewSupplier.index.save') : i18n.t('AddNewSupplier.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { navigation.state.params.udpadeRecentlyAddedBankAccounts([]); Keyboard.dismiss(); navigation.state.params.clearAddressData(); navigation.goBack(); }} text={i18n.t('AddNewSupplier.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      selectedDeafultAccount: {},
      EditedBankAccounts: [],
      EditedDefaultBankAccount: null,
      supplierDataFRomServer: {},
      supplierDetails: {
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
          Addresses: [],
          BankAccounts: [],
          DefaultBankAccount: {}
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
        OrgNumber: '',
        BankAccount: ''
      },
      isUploading: false,
      defalutAccountRemoved: false,
      onlyRemoved: false,
    };

    this.addNewSupplier = this.addNewSupplier.bind(this);
    this.setaddNewSupplierDetails = this.setaddNewSupplierDetails.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.setBillinAddress = this.setBillinAddress.bind(this);
    this.setDeliveryAddress = this.setDeliveryAddress.bind(this);
    this.onPressDeliveryAddress = this.onPressDeliveryAddress.bind(this);
    this.onPressBillingAddress = this.onPressBillingAddress.bind(this);
    this.clearAddressData = this.clearAddressData.bind(this);
    this.setEditSupplierDetails = this.setEditSupplierDetails.bind(this);
    this.editsupplier = this.editsupplier.bind(this);
    this.clearBillingAddress = this.clearBillingAddress.bind(this);
    this.clearDeliveryAddress = this.clearDeliveryAddress.bind(this);
    this.onPressBankAccount = this.onPressBankAccount.bind(this);
    this.setSupplierBankAccount = this.setSupplierBankAccount.bind(this);
    this.formatAccountsForAccountEdit = this.formatAccountsForAccountEdit.bind(this);

  }

  isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }
  componentWillMount() {
    this.props.navigation.setParams({ handleAction: this.handleAction, disableActionButton: false, clearAddressData: this.clearAddressData, udpadeRecentlyAddedBankAccounts: this.props.udpadeRecentlyAddedBankAccounts });
    this.props.navigation.state.params.isEditMode ? this.setEditSupplierDetails() : this.setaddNewSupplierDetails();
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.addressList.lastEditedTime != this.props.addressList.lastEditedTime)) {
      if (nextProps.addressList.lastEditedIndex == this.state.supplierDetails.BillingAddressArrayIndex) {
        this.setBillinAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex);
      }
      if (nextProps.addressList.lastEditedIndex == this.state.supplierDetails.DeliveryAddressArrayIndex) {
        setTimeout(() => { this.setDeliveryAddress(nextProps.addressList.addresses[nextProps.addressList.lastEditedIndex], nextProps.addressList.lastEditedIndex); }, 500);
      }
    }
  }
  setaddNewSupplierDetails() {
    if (this.props.navigation.state.params.data) {
      const { data } = this.props.navigation.state.params;
      this.setState({
        supplierDetails: {
          Name: data.Name ? data.Name : '',
          Phone: data.Phone ? data.Phone : '',
          OrgNumber: data.OrganizationNumber ? data.OrganizationNumber : '',
          BillingAddress: {
            City: data.OcrData ? data.BillingCity : data.City ? data.City : '',
            AddressLine1: data.OcrData ? data.BillingAddress : data.Streetaddress ? data.Streetaddress : '',
            AddressLine2: '',
            AddressLine3: '',
            PostalCode: data.OcrData ? data.BillingPostCode : data.PostCode ? data.PostCode : '',
            Country: '',
            CountryCode: null,
          },
          DeliveryAddress: {
            City: data.OcrData ? data.DeliveryCity : data.City ? data.City : '',
            AddressLine1: data.OcrData ? data.DeliveryAddress : data.Streetaddress ? data.Streetaddress : '',
            AddressLine2: '',
            AddressLine3: '',
            PostalCode: data.OcrData ? data.DeliveryZipNumber : data.PostCode ? data.PostCode : '',
            Country: '',
            CountryCode: null,
          },
          Email: data.EmailAddress ? data.EmailAddress : '',
          BillingAddressArrayIndex: 0,
          DeliveryAddressArrayIndex: 0,
          Info: {
            BankAccounts: data.SupplierBankAccount ? [data.SupplierBankAccount] : [],
            DefaultBankAccount: data.SupplierBankAccount ? data.SupplierBankAccount : {}
          }
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
  }

  setEditSupplierDetails() {
    if (this.props.navigation.state.params && this.props.navigation.state.params.data) {
      const { data } = this.props.navigation.state.params;
      this.state.supplierDataFRomServer = this.props.navigation.state.params.data;

      this.setState({
        supplierDetails: {
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
          BillingAddressArrayIndex: data.Info.Addresses && data.Info.Addresses.length > 0 && data.Info.InvoiceAddress && data.Info.InvoiceAddress.ID ? data.Info.Addresses.findIndex(address => address.ID == data.Info.InvoiceAddress.ID) : null,
          DeliveryAddressArrayIndex: data.Info.Addresses && data.Info.Addresses.length > 0 && data.Info.ShippingAddress && data.Info.ShippingAddress.ID ? data.Info.Addresses.findIndex(address => address.ID == data.Info.ShippingAddress.ID) : null,
          Info: {
            BankAccounts: data.Info.BankAccounts,
            DefaultBankAccount: data.Info.DefaultBankAccount

          }
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
    if (!this.state.supplierDetails.Name) {
      errors.Name = i18n.t('AddNewSupplier.index.noName');
    }
    if (!this.state.supplierDetails.OrgNumber && !this.isOrgNumberValid(this.state.supplierDetails.OrgNumber)) {
      errors.OrgNumber = i18n.t('AddNewSupplier.index.noOrgNumber');
    }
    if (this.state.supplierDetails.Email.length > 0 && !this.isValidEmail(this.state.supplierDetails.Email)) {
      errors.Email = i18n.t('AddNewSupplier.index.noEmail');
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

  handleAction() {
    Keyboard.dismiss();
    if (!this.state.isUploading && this.isValid()) {
      this.setState({ isUploading: true });
      if (this.props.navigation.state.params.navigateFrom != null) {
        this.addNewSupplier();
      }
      else {
        this.props.navigation.state.params.isEditMode ? this.editsupplier() : this.addNewSupplier();
      }
    } else {
      this.scrollToBottom();
    }

    this.props.udpadeRecentlyAddedBankAccounts([]);
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

  //ID removed from object since first time creation it does not need that but it received 
  removeIDfromBankAccounts(supplierDetails) {
    //let bankAccounts = supplierDetails.Info.BankAccounts;
    supplierDetails.Info.BankAccounts.forEach(function (account) {
      delete account['ID'];
      delete account['isChecked'];
    });
    // supplierDetails.Info.BankAccounts = bankAccounts;
    return supplierDetails;

  }

  getDefaultBankAcc(supplierDetails) {

    if (!this.isEmpty(this.state.selectedDeafultAccount)) {

      return this.state.selectedDeafultAccount;

    }
    else {

      if (supplierDetails.Info.BankAccounts && supplierDetails.Info.BankAccounts.length >= 1) {

        return supplierDetails.Info.BankAccounts[0]
      }


    }
  }

  getBankAccounts(supplierDetails) {

    if (supplierDetails.Info.BankAccounts && supplierDetails.Info.BankAccounts.length == 1) {
      return [];

    }
    else if (supplierDetails.Info.BankAccounts && supplierDetails.Info.BankAccounts.length >= 1) {

      let selectedObject = this.state.selectedDeafultAccount;
      delete selectedObject['isChecked']
      delete selectedObject['ID']

      if (!this.isEmpty(this.state.selectedDeafultAccount)) {
        return supplierDetails.Info.BankAccounts.filter(item => (item.AccountNumber !== selectedObject.AccountNumber) && (item.IBAN !== selectedObject.IBAN));
      }
      else {
        return supplierDetails.Info.BankAccounts.filter(item => item !== supplierDetails.Info.BankAccounts[0]);
      }

    }


    //   (supplierDetails.Info.BankAccounts && supplierDetails.Info.BankAccounts.length > 1) ? ((this.state.selectedDeafultAccount != {}) ? supplierDetails.Info.BankAccounts.filter(item => item !== this.state.selectedDeafultAccount) : supplierDetails.Info.BankAccounts) : supplierDetails.Info.BankAccounts


    // }
  }

  async addNewSupplier(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    const supplierDetails = this.removeIDfromBankAccounts(this.state.supplierDetails);

    const getProcessedAddressList = () => {
      const arr = this.props.addressList.addresses.filter(address =>
        !((this.state.supplierDetails.DeliveryAddress.AddressLine1 == address.AddressLine1 &&
          this.state.supplierDetails.DeliveryAddress.AddressLine2 == address.AddressLine2 &&
          this.state.supplierDetails.DeliveryAddress.AddressLine3 == address.AddressLine3 &&
          this.state.supplierDetails.DeliveryAddress.City == address.City &&
          this.state.supplierDetails.DeliveryAddress.PostalCode == address.PostalCode &&
          this.state.supplierDetails.DeliveryAddress.Country == address.Country &&
          this.state.supplierDetails.DeliveryAddress.CountryCode == address.CountryCode)
          ||
          (this.state.supplierDetails.BillingAddress.AddressLine1 == address.AddressLine1 &&
            this.state.supplierDetails.BillingAddress.AddressLine2 == address.AddressLine2 &&
            this.state.supplierDetails.BillingAddress.AddressLine3 == address.AddressLine3 &&
            this.state.supplierDetails.BillingAddress.City == address.City &&
            this.state.supplierDetails.BillingAddress.PostalCode == address.PostalCode &&
            this.state.supplierDetails.BillingAddress.Country == address.Country &&
            this.state.supplierDetails.BillingAddress.CountryCode == address.CountryCode))
      );
      return arr.map((address) => { address._createguid = createGuid(); return address; });
    };

    const supplier = {
      ID: 0,
      supplierNumber: 0,
      OrgNumber: supplierDetails.OrgNumber,
      Info: {
        Name: supplierDetails.Name !== '' ? supplierDetails.Name : null,
        ID: 0,
        DefaultEmail: supplierDetails.Email !== '' ?
          {
            EmailAddress: supplierDetails.Email,
            ID: 0,
            _createguid: createGuid(),
            _initValue: supplierDetails.Email.charAt(0)
          } : null,
        DefaultPhone: supplierDetails.Phone.toString() !== '' ?
          {
            ID: 0,
            Number: supplierDetails.Phone.toString(),
            _createguid: createGuid(),
            _initValue: supplierDetails.Phone.toString().charAt(0)
          } : null,
        InvoiceAddress: supplierDetails.BillingAddress.AddressLine1 !== '' ?
          {
            ID: 0,
            AddressLine1: supplierDetails.BillingAddress.AddressLine1,
            AddressLine2: supplierDetails.BillingAddress.AddressLine2,
            AddressLine3: supplierDetails.BillingAddress.AddressLine3,
            City: supplierDetails.BillingAddress.City,
            PostalCode: supplierDetails.BillingAddress.PostalCode,
            Country: supplierDetails.BillingAddress.Country,
            CountryCode: supplierDetails.BillingAddress.CountryCode,
            _createguid: createGuid(),
            _initValue: supplierDetails.BillingAddress.AddressLine1.charAt(0)
          } : null,
        ShippingAddress: supplierDetails.DeliveryAddress.AddressLine1 !== '' ?
          {
            ID: 0,
            AddressLine1: supplierDetails.DeliveryAddress.AddressLine1,
            AddressLine2: supplierDetails.DeliveryAddress.AddressLine2,
            AddressLine3: supplierDetails.DeliveryAddress.AddressLine3,
            City: supplierDetails.DeliveryAddress.City,
            PostalCode: supplierDetails.DeliveryAddress.PostalCode,
            Country: supplierDetails.DeliveryAddress.Country,
            CountryCode: supplierDetails.DeliveryAddress.CountryCode,
            _createguid: createGuid(),
            _initValue: supplierDetails.DeliveryAddress.AddressLine1.charAt(0)
          } : null,
        Addresses: getProcessedAddressList(),
        DefaultBankAccount: this.getDefaultBankAcc(supplierDetails),
        BankAccounts: this.getBankAccounts(supplierDetails)
      }
    };
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    try {
      const response = await SupplierService.createSupplier(supplier, companyKey);
      if (response.ok) {

        this.props.updateSupplierList();
        if (this.props.navigation.state.params.navigateFrom == null) {
          this.props.resetToSupplierDetails({
            supplierID: response.data.ID,
            EntityType: EntityType.SUPPLIER,
            CompanyKey: companyKey,
          });
          this.props.clearAddressList();
        }
        else {
          
          this.props.navigation.state.params.supplierSetter(response.data);
          this.props.navigation.goBack();
        }
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'supplier' });
      }
    } catch (error) {
      this.setState({ isUploading: false });
      if (error.status === 400) {
        this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.incorrectInfo'));
      } else {
        this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.addError'));
      }
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }
  }

  async formatAccountsForAccountEdit() {
    let supplierPreviousBankAccounts = this.state.supplierDataFRomServer.Info.BankAccounts.filter(item => item.Deleted == false) // supplier original bank acounts
    let existingDefaultAccount = this.state.supplierDataFRomServer.Info.DefaultBankAccount;//supploer original default account

    let supplierNewBanks = this.state.supplierDetails.Info.BankAccounts; //Supplier new acounts which send from bank account lookup, those were the selected account array

    let allModefiledAccounts = [];

    let removedAccounts = [];
    let newlyAddedAccounts = [];
    let defAccRemoved = false;
    let isOnlyRemoved = false;
    let defaultAccRemoved = false;
    newlyAddedAccounts = this.createNewlyAddedAccounts(supplierPreviousBankAccounts, supplierNewBanks); //Filter the newly created acounts
    removedAccounts = this.createRemovedAccounts(supplierPreviousBankAccounts, supplierNewBanks); //Filter the reomved accounts from original accounts
    let defaultBankAccountObject = this.state.selectedDeafultAccount //This the the user selcted default bank accoutn if user not selected it will take the 0 th account of the aary

    //Loop via removed account set deleted true for all the other accout which is not default accout, default account will be set deleted false
    removedAccounts.forEach(function (rmAcccount) {

      if ((rmAcccount.AccountNumber != existingDefaultAccount.AccountNumber) && (existingDefaultAccount.BankID != rmAcccount.BankID)) {
        rmAcccount.Deleted = true;
      }
      if ((rmAcccount.AccountNumber == existingDefaultAccount.AccountNumber) && (existingDefaultAccount.BankID == rmAcccount.BankID)) {
        rmAcccount.Deleted = false;
        defaultAccRemoved = true
      }

    });

    allModefiledAccounts = newlyAddedAccounts.concat(removedAccounts); //joining both newly added account and removed accounts ,default account will be set null
    this.setState({ EditedBankAccounts: [...allModefiledAccounts], EditedDefaultBankAccount: null, defalutAccountRemoved: defaultAccRemoved });

    //1.delete account and add new account wil be done one call of put
    //2.setting up default accout will be done separalt after all accout chnages completed (addings and removals)
    //3.if new default accout to be set, it has to be done.
    //* first add thew new accout to the BankAccounts.
    //* then set the new one s account Id to the DefaultBankAccountId
    //* finally deleted the old default bank account.

  }

  async formatAccountsForAccountEdit2() {
    this.setState({ go: true });
    let supplierPreviousBankAccounts = this.state.supplierDataFRomServer.Info.BankAccounts.filter(item => item.Deleted == false)
    let existingDefaultAccount = this.state.supplierDataFRomServer.Info.DefaultBankAccount;//object

    let supplierNewBanks = this.state.supplierDetails.Info.BankAccounts;

    if (supplierPreviousBankAccounts && supplierPreviousBankAccounts.length == 0) {//existing supplier with no bank accounts
      if (supplierNewBanks && supplierNewBanks.length == 1) { // one account added
        const addedAccont = {
          _createguid: createGuid(),
          AccountNumber: supplierNewBanks[0].AccountNumber,
          IBAN: supplierNewBanks[0].IBAN,
          BankAccountType: "supplier",
          BankID: supplierNewBanks[0].BankID,

        }

        this.setState({ EditedDefaultBankAccount: addedAccont });

      }
      else {//more than one account added
        let newAccounts = [];
        supplierNewBanks.forEach(function (account) {
          const addedAccont = {
            _createguid: createGuid(),
            AccountNumber: account.AccountNumber,
            IBAN: account.IBAN,
            BankAccountType: "supplier",
            BankID: account.BankID,

          }
          newAccounts.push(addedAccont);
        });

        const filteredItems = newAccounts.filter(item => item !== newAccounts[0])
        this.state.EditedBankAccounts = filteredItems;
        this.setState({ EditedDefaultBankAccount: { ...newAccounts[0] } });

      }

    }
    else {//existing supplier already have accounts added

      let removedAccounts = [];
      let newlyAddedAccounts = [];
      let defAccRemoved = false;
      let isOnlyRemoved = false;
      newlyAddedAccounts = this.createNewlyAddedAccounts(supplierPreviousBankAccounts, supplierNewBanks);
      removedAccounts = this.createRemovedAccounts(supplierPreviousBankAccounts, supplierNewBanks);
      let defaultBankAccountObject = this.createDefaultBankAccount(existingDefaultAccount, newlyAddedAccounts, removedAccounts, supplierPreviousBankAccounts) //if returned {} - account not chnaged

      //no new removed existing
      if (newlyAddedAccounts.length == 0 && removedAccounts.length > 0) {


        if (!this.isEmpty(defaultBankAccountObject)) {//default Account removed

          //changing deleted default accoutn deleted = false
          supplierPreviousBankAccounts.forEach(function (removedAccount) {
            if ((existingDefaultAccount.AccountNumber == removedAccount.AccountNumber) && (existingDefaultAccount.BankID == removedAccount.BankID)) {
              removedAccount.Deleted = false

            }
          });

          let acc = [];
          let tempRemAcc = [];
          removedAccounts.forEach(function (rmAcccount) {
            supplierPreviousBankAccounts.forEach(function (acccount) {
              if ((rmAcccount.AccountNumber == acccount.AccountNumber) && (existingDefaultAccount.AccountNumber != rmAcccount.AccountNumber)) {
                acccount.Deleted = true;
              }

            });
          });


          tempDefaultBankAcc = null;
          tempNewAcc = supplierPreviousBankAccounts;
          defAccRemoved = true;
          isOnlyRemoved = true;
        }
        else {
          tempDefaultBankAcc = null;
          tempNewAcc = removedAccounts;
          defAccRemoved = false;
          isOnlyRemoved = false;

        }

        this.setState({ EditedBankAccounts: [...tempNewAcc], EditedDefaultBankAccount: tempDefaultBankAcc, defalutAccountRemoved: defAccRemoved, onlyRemoved: isOnlyRemoved });

      }
      else if (newlyAddedAccounts.length > 0 && removedAccounts.length == 0) {
        this.setState({ EditedBankAccounts: [...newlyAddedAccounts], EditedDefaultBankAccount: null });
      }
      else if (newlyAddedAccounts.length >= 0 && removedAccounts.length > 0)//Only remove accounts
      {
        let tempDefaultBankAcc = {};
        let tempNewAcc = [];

        //check  if default account removed
        //const removeDefaultBankAccountFromRemovedAccounts = removedAccounts.filter(item => (item.AccountNumber !== existingDefaultAccount.AccountNumber) && (item.BankID !== existingDefaultAccount.BankID))

        if (!this.isEmpty(defaultBankAccountObject)) {//default Account removed
          if (this.state.supplierDetails.Info.BankAccounts.length == 1) {
            tempDefaultBankAcc = null
          }
          else {
            tempDefaultBankAcc = null//defaultBankAccountObject;

          }
          defAccRemoved = true;
        }
        else {
          tempDefaultBankAcc = existingDefaultAccount;

        }

        let arryNew = []
        if (existingDefaultAccount != null) {
          //changing deleted default accoutn deleted = false
          removedAccounts.forEach(function (removedAccount) {
            if ((existingDefaultAccount.AccountNumber == removedAccount.AccountNumber) && (existingDefaultAccount.BankID == removedAccount.BankID)) {
              removedAccount.Deleted = false

            }
          });
        }

        if (removedAccounts.length > 0) {
          tempNewAcc = newlyAddedAccounts.length > 0 ? newlyAddedAccounts.concat(removedAccounts) : removedAccounts;
        }
        else {
          tempNewAcc = newlyAddedAccounts.length > 0 ? newlyAddedAccounts : [];

        }

        this.setState({ EditedBankAccounts: [...tempNewAcc], EditedDefaultBankAccount: tempDefaultBankAcc, defalutAccountRemoved: defAccRemoved });
      }
    }
  }

  getNextBankAccountAsDefault(removedAccounts, supplierPreviousBankAccounts) {
    let accountArray = [];
    let itsNotRemoved = true;
    let tempArray = [];
    tempArray = supplierPreviousBankAccounts;

    let tempPreviousAcc = [];
    let tempRemovedAcc = [];

    supplierPreviousBankAccounts.forEach(function (account) {
      tempPreviousAcc.push(account.AccountNumber)
    });

    removedAccounts.forEach(function (rmAccount) {
      tempRemovedAcc.push(rmAccount.AccountNumber)
    });

    tempPreviousAcc.forEach(function (rmAccount) {

      if (!tempRemovedAcc.includes(rmAccount)) {
        supplierPreviousBankAccounts.forEach(function (account) {
          if (rmAccount == account.AccountNumber) {
            accountArray.push(account);
          }
        });
      }

    });



    return accountArray;
  }

  createDefaultBankAccount(existingDefaultAccount, newlyAddedAccounts, removedAccounts, supplierPreviousBankAccounts) {
    if (existingDefaultAccount != null) //not null
    {
      if (removedAccounts && removedAccounts.length > 0) {
        let isRemoved = false;

        removedAccounts.forEach(function (removedAccount) {
          if ((existingDefaultAccount.AccountNumber == removedAccount.AccountNumber) && (existingDefaultAccount.BankID == removedAccount.BankID)) {
            isRemoved = true;
          }

        });

        let remainingAcc = this.getNextBankAccountAsDefault(removedAccounts, supplierPreviousBankAccounts);

        if (isRemoved) {
          const newDefaultAccount = {
            AccountNumber: (newlyAddedAccounts && newlyAddedAccounts.length == 0) ? remainingAcc[0].AccountNumber : newlyAddedAccounts[0].AccountNumber,
            IBAN: (newlyAddedAccounts && newlyAddedAccounts.length == 0) ? remainingAcc[0].IBAN : newlyAddedAccounts[0].IBAN,
            BankAccountType: "supplier",
            BankID: (newlyAddedAccounts && newlyAddedAccounts.length == 0) ? remainingAcc[0].BankID : newlyAddedAccounts[0].BankID,
            ID: (newlyAddedAccounts && newlyAddedAccounts.length == 0) ? remainingAcc[0].ID : newlyAddedAccounts[0].ID,

          }

          return newDefaultAccount;
        }
        else {
          return {};
        }

      }
      else {
        return {};
      }
    }
    else {//no defauot account - null
      return {};
    }

  }
  createRemovedAccounts(supplierPreviousBankAccounts, supplierNewBanks) {

    let removedAccounts = [];
    if (supplierNewBanks && supplierNewBanks.length >= 0) {
      supplierPreviousBankAccounts.forEach(function (oldAccount) {
        let isRemovedAccount = true;
        supplierNewBanks.forEach(function (newAccount) {
          if ((oldAccount.AccountNumber == newAccount.AccountNumber) && (oldAccount.BankID == newAccount.BankID)) {
            isRemovedAccount = false;
          }
        })
        if (isRemovedAccount) {
          const removedAccont = {
            AccountNumber: oldAccount.AccountNumber,
            IBAN: oldAccount.IBAN,
            BankAccountType: "supplier",
            BankID: oldAccount.BankID,
            ID: oldAccount.ID,
            Deleted: true

          }
          removedAccounts.push(removedAccont);

        }
      });

    }

    return removedAccounts;
  }

  createNewlyAddedAccounts(supplierPreviousBankAccounts, supplierNewBanks) {

    let newAccounts = [];
    if (supplierNewBanks && supplierNewBanks.length >= 0) {
      supplierNewBanks.forEach(function (newAccount) {
        let isNewAccount = true;
        supplierPreviousBankAccounts.forEach(function (account) {
          if ((account.AccountNumber == newAccount.AccountNumber) && (account.BankID == newAccount.BankID)) {
            isNewAccount = false;
          }
        })
        if (isNewAccount) {
          const addedAccont = {
            _createguid: createGuid(),
            AccountNumber: newAccount.AccountNumber,
            IBAN: newAccount.IBAN,
            BankAccountType: "supplier",
            BankID: newAccount.BankID,

          }
          newAccounts.push(addedAccont);

        }
      });

    }

    return newAccounts;
  }


  //This will detect the default account to be removed and format that object
  async setObject(responce, existingDefaultAccount) {
    let removedAccounts = [];
    responce.Info.BankAccounts.forEach(function (account) {
      if ((account.AccountNumber == existingDefaultAccount.AccountNumber) && (account.BankID == existingDefaultAccount.BankID)) {
        const removedAccont = {
          AccountNumber: account.AccountNumber,
          IBAN: account.IBAN,
          BankAccountType: "supplier",
          BankID: account.BankID,
          ID: account.ID,
          Deleted: true

        }
        removedAccounts.push(removedAccont);


      }
    });

    responce.Info.BankAccounts = removedAccounts;

    return responce;
  }

  async getBankAccountId(responce, selectedDeafultAccount) {
    let defaltbAcc;
    responce.Info.BankAccounts.forEach(element => {
      if ((element.AccountNumber == selectedDeafultAccount.AccountNumber) && (element.BankID == selectedDeafultAccount.BankID)) {
        defaltbAcc = element.ID;
      }
    });

    return defaltbAcc;
  }

  async getNewlyAddedAccId(selectedDeafultAccount, responce) {

    let newResponce = responce;
    if (this.state.selectedDeafultAccount.ID == undefined) {
      responce.Info.BankAccounts.forEach(element => {

        if ((element.AccountNumber == selectedDeafultAccount.AccountNumber) && (element.BankID == selectedDeafultAccount.BankID)) {
          newResponce.Info.DefaultBankAccountID = element.ID;

        }

      });
      return newResponce;
    }
    else {
      newResponce.Info.DefaultBankAccountID = this.state.selectedDeafultAccount.ID;
      return newResponce;
    }
  }
  //this will set the new default account
  async setNewDefaultAccount2(caller, supplierID, responce, companyKey, onlyRemoved) {


    if (onlyRemoved && this.isEmpty(this.state.selectedDeafultAccount)) //only defaur - no default set
      responce.Info.DefaultBankAccountID = responce.Info.BankAccounts[0].ID
    else if (!onlyRemoved && this.isEmpty(this.state.selectedDeafultAccount))
      responce.Info.DefaultBankAccountID = responce.Info.BankAccounts[0].ID
    else if (!onlyRemoved && !this.isEmpty(this.state.selectedDeafultAccount))
      responce.Info.DefaultBankAccountID = await this.getBankAccountId(responce, this.state.selectedDeafultAccount);
    else if (onlyRemoved && !this.isEmpty(this.state.selectedDeafultAccount)) //only default - default hs set
      responce.Info.DefaultBankAccountID = responce.Info.BankAccounts[0].ID

    try {
      const response = await SupplierService.editSupplierDetails(supplierID, responce, companyKey);
      if (response.ok) {
        return response.data;
      }
    } catch (error) {
      return null;
    }
  }





  async setNewDefaultAccount(caller, supplierID, responce, companyKey, onlyRemoved) {

    //getting newly added account account ID to set as the default account.
    const responceNew = await this.getNewlyAddedAccId(this.state.selectedDeafultAccount, responce);

    try {
      const response = await SupplierService.editSupplierDetails(supplierID, responceNew, companyKey);
      if (response.ok) {
        return response.data;
      }
    } catch (error) {
      return null;
    }
  }

  //This will removed the old default account - delete
  //This method will do the removal of existing default account and setting up new default accout total process.
  async removeDefaultAccount(caller, supplierID, responce, companyKey, onlyRemoved) {

    const responceNew = await this.setNewDefaultAccount(caller, supplierID, responce, companyKey, onlyRemoved);
    let arrayNew = [];
    let existingDefaultAccount = this.state.supplierDataFRomServer.Info.DefaultBankAccount;//object
    let resp = await this.setObject(responceNew, existingDefaultAccount);

    try {
      //The removal of previous default account
      const response = await SupplierService.editSupplierDetails(supplierID, resp, companyKey);
      if (response.ok) {
        await this.setUserSelctedDefaultAccount(caller, supplierID, response, companyKey)
        this.props.updateSupplierList();
        this.props.navigation.state.params && this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
        this.props.navigation.goBack();
        this.props.clearAddressList();


      }
    } catch (error) {
      this.setState({ isUploading: false });
      this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.editError'));
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }

  }

  async removeDefaultAccount2(caller, supplierID, responce, companyKey, onlyRemoved) {

    let setDefaultresponce = await this.setNewDefaultAccount(caller, supplierID, responce, companyKey, onlyRemoved);

    let arrayNew = [];
    let existingDefaultAccount = this.state.supplierDataFRomServer.Info.DefaultBankAccount;//object
    let resp = await this.setObject(setDefaultresponce, existingDefaultAccount);

    try {
      //The removal of previous default account
      const response = await SupplierService.editSupplierDetails(supplierID, resp, companyKey);
      if (response.ok) {
        await this.setUserSelctedDefaultAccount(caller, supplierID, response, companyKey)
        this.props.updateSupplierList();
        this.props.navigation.state.params && this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
        this.props.navigation.goBack();
        this.props.clearAddressList();


      }
    } catch (error) {
      this.setState({ isUploading: false });
      this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.editError'));
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }

  }


  async getSupplierDetails(supplierID, companyKey) {
    return responce = SupplierService.getSupplierDetails(supplierID, companyKey);

  }

  async setUserSelctedDefaultAccount(caller, supplierID, responce, companyKey) {
    if (!this.isEmpty(this.state.selectedDeafultAccount)) {
      const responce = await this.getSupplierDetails(supplierID, companyKey);

      responce.data.Info.BankAccounts.forEach(element => {
        if ((this.state.selectedDeafultAccount.AccountNumber == element.AccountNumber) && (this.state.selectedDeafultAccount.BankID == element.BankID)) {
          responce.data.Info.DefaultBankAccountID = element.ID;
          responce.data.Info.DefaultBankAccount = null
          //responce.data.Info.DefaultBankAccount = this.state.selectedDeafultAccount
        }

      });

      try {

        const response = await SupplierService.editSupplierDetails(supplierID, responce.data, companyKey);
        if (response.ok) {

        }
      } catch (error) {
        this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.editError'));

      }

    }

  }





  async editsupplier(caller, removedDefaultAccountObj = null) {
    await this.formatAccountsForAccountEdit.bind(this)();
    const companyKey = this.props.company.selectedCompany.Key;
    const supplierID = this.props.navigation.state.params.supplierID;
    const originalData = this.props.navigation.state.params.data;
    const { supplierDetails } = this.state;

    const getProcessedAddressList = (InvoiceAddress, ShippingAddress) => {
      return this.props.addressList.addresses.filter(address => !((_.isEqual(address, InvoiceAddress) && !address.ID) || (_.isEqual(address, ShippingAddress) && !address.ID)))
        .map((address) => { !address.ID ? address._createguid = createGuid() : null; return address; });
    };
    const ShippingAddress = supplierDetails.DeliveryAddressArrayIndex === null ? null :
      {
        ...supplierDetails.DeliveryAddress,
      };
    const InvoiceAddress = supplierDetails.BillingAddressArrayIndex === null ? null :
      {
        ...supplierDetails.BillingAddress,
      };
    const supplier = {
      ID: originalData.ID,
      supplierNumber: originalData.supplierNumber,
      OrgNumber: supplierDetails.OrgNumber,
      Info: {
        Name: supplierDetails.Name,
        ID: originalData.Info.ID,
        DefaultEmail: supplierDetails.Email !== '' ? originalData.Info.DefaultEmail ?
          {
            EmailAddress: supplierDetails.Email,
            ID: originalData.Info.DefaultEmailID,
          } : {
            EmailAddress: supplierDetails.Email,
            ID: 0,
            _createguid: createGuid(),
          } : null,
        DefaultPhone: supplierDetails.Phone.toString() !== '' ? originalData.Info.DefaultPhone ?
          {
            ID: originalData.Info.DefaultPhoneID,
            Number: supplierDetails.Phone.toString(),
          } : {
            Number: supplierDetails.Phone.toString(),
            ID: 0,
            _createguid: createGuid(),
          } : null,
        InvoiceAddress,
        InvoiceAddressID: supplierDetails.BillingAddress.ID ? supplierDetails.BillingAddress.ID : null,
        ShippingAddress,
        ShippingAddressID: supplierDetails.DeliveryAddress.ID ? supplierDetails.DeliveryAddress.ID : null,
        Addresses: getProcessedAddressList(InvoiceAddress, ShippingAddress),
        DefaultBankAccount: this.state.EditedDefaultBankAccount,
        BankAccounts: this.state.EditedBankAccounts

      }
    };

    // if (this.state.defalutAccountRemoved && this.state.EditedDefaultBankAccount != null) {//DEfault account swap
    //   supplier.Info.DefaultBankAccountID = this.state.EditedDefaultBankAccount.ID

    // }
    if (supplierDetails.Email === '') {
      supplier.Info.DefaultEmailID = null;
    }
    if (supplierDetails.Phone.toString() === '') {
      supplier.Info.DefaultPhoneID = null;
    }
    if (!supplier.Info.ShippingAddressID && supplier.Info.ShippingAddress && supplier.Info.ShippingAddress.AddressLine1) {
      supplier.Info.ShippingAddress._createguid = createGuid();
    }
    if (!supplier.Info.InvoiceAddressID && supplier.Info.InvoiceAddress && supplier.Info.InvoiceAddress.AddressLine1) {
      supplier.Info.InvoiceAddress._createguid = createGuid();
    }
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    try {
      const response = await SupplierService.editSupplierDetails(supplierID, supplier, companyKey);
      if (response.ok) {
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'supplier' });
        if (this.state.defalutAccountRemoved) {
          this.removeDefaultAccount(caller, supplierID, response.data, companyKey, this.state.onlyRemoved);
        }
        else {
          await this.setUserSelctedDefaultAccount(caller, supplierID, response, companyKey);
          this.props.updateSupplierList();
          this.props.navigation.state.params && this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
          this.props.navigation.goBack();
          this.props.clearAddressList();
        }
      }
    } catch (error) {
      this.setState({ isUploading: false });
      this.handlesupplierErrors(error.problem, caller, i18n.t('AddNewSupplier.index.editError'));
      this.startAnimation(true);
      this.props.navigation.setParams({ disableActionButton: false });
    }
  }

  handlesupplierErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewSupplier.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }
  processBankAccount(bankAccount) {
    return bankAccount ? bankAccount.AccountNumber : ''
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
            selectedAddressArrayIndex: this.state.supplierDetails.BillingAddressArrayIndex,
          }
        }
      });
    }
  }

  //   key: 'AddNewAddress', routeName: 'AddNewAddress', params: {

  onPressBankAccount() {

    Keyboard.dismiss();
    this.props.navigation.navigate({
      key: 'BankAccountLookup', routeName: 'BankAccountLookup', params: {
        navigation: this.props.navigation, data: {
          title: i18n.t('BankAccountLookup.index.searchSupplierBankAccount'),
          entityType: EntityType.SUPPLIER_BANK_ACCOUNT,
          placeholder: i18n.t('BankAccountLookup.index.searchBankAccountPlaceholder'),
          bankAccountSetter: this.setSupplierBankAccount,
          isEditMode: this.props.navigation.state.params.isEditMode ? this.props.navigation.state.params.isEditMode : false,
          existingBankAccounts: this.formatBankAccounts(this.state.supplierDetails.Info.BankAccounts),
          existingDefaultAcc: this.state.supplierDetails.Info.DefaultBankAccount
        }
      }
    });

  }

  processAccountsBeforeSend() {
    let defaultBA = this.state.supplierDetails.Info.DefaultBankAccount;
    let allBA = this.state.supplierDetails.Info.BankAccounts;
    let formattedBAarray = [];
    if (allBA.length <= 0 && this.isEmpty(defaultBA)) {
      return [];
    }
    else if (allBA.length <= 0 && !this.isEmpty(defaultBA)) {
      formattedBAarray.push(defaultBA);
      return formattedBAarray;
    }
    else if (allBA.length >= 1) {
      let accountObj = false;
      let formattedBAarray = allBA;
      allBA.forEach(function (element) {
        if (element.AccountNumber == defaultBA.AccountNumber)
          accountObj = true;
      });
      return !accountObj ? formattedBAarray.push(account) : formattedBAarray;
    }

  }

  formatBankAccounts(bankAccountsArray) {

    let formattedBAarray = [];
    bankAccountsArray.forEach(function (element) {

      const account = {
        AccountNumber: element.AccountNumber,
        BankAccountType: 'supplier',
        IBAN: element.IBAN,
        BankID: element.Bank == null ? null : element.Bank.ID,
        Bank: element.Bank == null ? null : { Name: element.Bank == null ? '' : element.Bank.Name },
        ID: element.ID ? element.ID : undefined

      }
      formattedBAarray.push(account);

    });

    return formattedBAarray;
  }

  removeAccount(account) {

    for (var i = 0; i < this.state.selectedBankAccounts.length; i++) {
      var obj = this.state.selectedBankAccounts[i];

      if (obj.AccountNumber == account.AccountNumber) {
        this.state.selectedBankAccounts.splice(i, 1);
        this.state.selectedCustomeBankAccounts.splice(i, 1);
        this.setState({
          selectedBankAccounts: [...this.state.selectedBankAccounts],
          selectedCustomeBankAccounts: [...this.state.selectedCustomeBankAccounts],
        })
      }

    }
  }

  setSupplierBankAccount(bankAccount, selectedDeafultAccount, userSearchedUEexistingAccounts) {
    if (bankAccount.length > 0) {
      this.setState({ supplierDetails: { ...this.state.supplierDetails, Info: { BankAccounts: bankAccount, DefaultBankAccount: selectedDeafultAccount } }, selectedDeafultAccount: selectedDeafultAccount }
      );
    }
    else {
      this.setState({ supplierDetails: { ...this.state.supplierDetails, Info: { BankAccounts: [] } } }
      );
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
            selectedAddressArrayIndex: this.state.supplierDetails.DeliveryAddressArrayIndex,
          }
        }
      });
    }
  }

  setBillinAddress(address, index) {
    this.setState({ supplierDetails: { ...this.state.supplierDetails, BillingAddress: { ...address }, BillingAddressArrayIndex: index } });
  }

  setDeliveryAddress(address, index) {
    this.setState({ supplierDetails: { ...this.state.supplierDetails, DeliveryAddress: { ...address }, DeliveryAddressArrayIndex: index } });
  }

  clearBillingAddress(address, index) {
    this.setState({
      supplierDetails: {
        ...this.state.supplierDetails,
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
      supplierDetails: {
        ...this.state.supplierDetails,
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
            <Text>{`${this.props.navigation.state.params.isEditMode ? i18n.t('AddNewSupplier.index.saving') : i18n.t('AddNewSupplier.index.creating')} ...`}</Text>
          </View>
        </Animated.View>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.detailsContainer} >
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.name')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={true}
              value={this.state.supplierDetails.Name ? this.state.supplierDetails.Name : ''}
              onChangeText={Name => this.setState({ supplierDetails: { ...this.state.supplierDetails, Name }, errors: { ...this.state.errors, Name: '' } })}
              error={this.state.errors.Name}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.organization')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              value={this.state.supplierDetails.OrgNumber ? this.state.supplierDetails.OrgNumber : ''}
              onChangeText={OrgNumber => this.setState({ supplierDetails: { ...this.state.supplierDetails, OrgNumber }, errors: { ...this.state.errors, OrgNumber: '' } })}
              error={this.state.errors.OrgNumber}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.billingAddress')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.supplierDetails.BillingAddress)}
              onPress={this.onPressBillingAddress}
              error={this.state.errors.BillingAddress}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.deliveryAddress')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={false}
              value={this.processAddress(this.state.supplierDetails.DeliveryAddress)}
              onPress={this.onPressDeliveryAddress}
              error={this.state.errors.DeliveryAddress}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.bankAccount')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={false}
              value={this.state.supplierDetails.Info.BankAccounts.length != 0 ? (!this.isEmpty(this.state.supplierDetails.Info.DefaultBankAccount) ? `${this.state.supplierDetails.Info.DefaultBankAccount.AccountNumber} - (${this.state.supplierDetails.Info.BankAccounts.length})` : `(${this.state.supplierDetails.Info.BankAccounts.length})`) : ''}
              onPress={this.onPressBankAccount}
              error={this.state.errors.BankAccount}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.email')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'email-address'}
              value={this.state.supplierDetails.Email ? this.state.supplierDetails.Email : ''}
              onChangeText={Email => this.setState({ supplierDetails: { ...this.state.supplierDetails, Email }, errors: { ...this.state.errors, Email: '' } })}
              error={this.state.errors.Email}
              onFocus={this.scrollToBottom}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewSupplier.index.phone')}
              placeHolder={i18n.t('AddNewSupplier.index.notSpecified')}
              isKeyboardInput={true}
              keyboardType={'phone-pad'}
              error={this.state.errors.Phone}
              value={this.state.supplierDetails.Phone ? this.state.supplierDetails.Phone : ''}
              onChangeText={Phone => this.setState({ supplierDetails: { ...this.state.supplierDetails, Phone }, errors: { ...this.state.errors, Phone: '' } })}
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
    userSearchedUExistingAccounts: state.bankAccounts.selectedBankAccounts,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateSupplierList: () => dispatch({ type: 'UPDATE_SUPPLIER_LAST_EDITED_TIMESTAMP' }),
    resetToSupplierDetails: supplierData =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'SupplierList' }),
          NavigationActions.navigate({ routeName: 'SupplierList', params: { ...supplierData } })
        ]
      })),
    addNewAddressToList: address => dispatch(addNewAddressToList(address)),
    clearAddressList: () => dispatch(clearAddressList()),
    setAddressList: list => dispatch(setAddressList(list)),
    udpadeRecentlyAddedBankAccounts: (accounts) => dispatch(udpadeRecentlyAddedBankAccounts(accounts))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewSupplier);

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
