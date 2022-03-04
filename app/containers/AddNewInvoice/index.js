// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  Text,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { NavigationActions } from 'react-navigation';
import moment from 'moment';
import Analytics from 'appcenter-analytics';
import Icon from '../../components/CustomIcon';
import _ from 'lodash';

import { theme } from '../../styles';
import { EntityType } from '../../constants/EntityTypes';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { resetToInvoiceDetails, addTempImages, removeTempImage, clearTempImages } from '../../actions/addNewInvoiceActions';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import KIDValidator from '../../helpers/KIDValidator';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import SupplierService from '../../services/SupplierService';
import InvoiceService from '../../services/InvoiceService';
import UploadService from '../../services/UploadService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import ImageCarousel from '../../components/ImageCarousel';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { FormatNumber, DeFormatNumber } from '../../helpers/NumberFormatUtil';
import FileService from '../../services/FileService';
import { getImageLink, createGuid } from '../../helpers/APIUtil';
import OCRService from '../../services/OCRService';
import { OcrPropertyType } from '../../constants/OcrPropertyType';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import WorkerService from '../../services/WorkerService';
import CompanyService from '../../services/CompanyService';

const WIDTH = Dimensions.get('window').width;

class AddNewInvoice extends Component {

  static navigationOptions = ({ navigation, screenProps }) => {
    return {
      title: navigation.state.params.isEdit ? i18n.t('AddNewInvoice.index.editInvoice') : i18n.t('AddNewInvoice.index.title'),
      headerLeft: <HeaderBackButton onPress={() => { Keyboard.dismiss(); navigation.state.params.goBack(); }} />,
      headerRight: <HeaderTextButton
        position={'right'}
        isActionComplete={navigation.state.params.isActionComplete}
        onPress={navigation.state.params.handleUpload}
        text={navigation.state.params.isEdit ? i18n.t('AddNewInvoice.index.save') : i18n.t('AddNewInvoice.index.upload')} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      localizedZero: FormatNumber(0),
      isReady: false,
      isDateTimePickerVisible: false,
      picker: '',
      initialDate: moment(),
      isUploading: false,
      uploadingFileStatus: '',
      moveAnimation: new Animated.Value(0),
      fadeAnimation: new Animated.Value(0),
      invoiceID: undefined,
      didImageUploadFail: false,
      DeletedImages: [],
      isOCRInProgress: false,
      isOCRSuccess: false,
      isOcrDataBannerVisible: false,
      ocrScannedImageExternalID: null,
      ocrStatusText: '',
      isFetchingSupplierFromPhonebook: false,
      ocrData: {},
      invoiceDetails: {
        SupplierID: '',
        SupplierName: '',
        InvoiceNumber: '',
        TaxInclusiveAmountCurrency: '',
        TaxInclusiveAmountCurrencyDisplay: FormatNumber(0),
        InvoiceDate: moment(),
        PaymentDueDate: moment(),
        Images: [],
        ID: null,
        DepartmentName: '',
        ProjectName: '',
        DefaultDimensions: null,
        DefaultDimensionsID: null,
        PaymentID: null
      },
      errors: {
        Supplier: null,
        InvoiceNo: null,
        Amount: null,
        InvoiceDate: null,
        DueDate: null,
        Project: null,
        Department: null,
        PaymentID: null,
      }
    };

    this.isActionComplete = false;
    this._didFocusSubscription = props.navigation.addListener('didFocus', payload => BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid));

    this.onSupplierSelect = this.onSupplierSelect.bind(this);
    this.setSupplier = this.setSupplier.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.onDeleteTap = this.onDeleteTap.bind(this);
    this.addImages = this.addImages.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
    this.goBack = this.goBack.bind(this);
    this.onAmountBlur = this.onAmountBlur.bind(this);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.getOCRDataForAImage = this.getOCRDataForAImage.bind(this);
    this.getOCRDataForAnInboxImage = this.getOCRDataForAnInboxImage.bind(this);
    this.deleteUploadedOCRImage = this.deleteUploadedOCRImage.bind(this);
    this.handleOCRData = this.handleOCRData.bind(this);
    this.applyOCRData = this.applyOCRData.bind(this);
    this.ocrSupplierLookup = this.ocrSupplierLookup.bind(this);
    this.askUserToCreateSupplier = this.askUserToCreateSupplier.bind(this);

    this._showDatePicker = this._showDatePicker.bind(this);
    this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
    this._handleDatePicked = this._handleDatePicked.bind(this);
    this.deleteExsistingImageFromState = this.deleteExsistingImageFromState.bind(this);
    this.onDepartmentSelect = this.onDepartmentSelect.bind(this);
    this.onProjectSelect = this.onProjectSelect.bind(this);
    this.setProject = this.setProject.bind(this);
    this.setDepartment = this.setDepartment.bind(this);
  }

  async componentDidMount() {
    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload => BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid));
    this.props.navigation.setParams({ handleUpload: this.handleUpload, goBack: this.goBack });
    if (this.props.navigation.state.params.isEdit) {
      const invoice = this.props.navigation.state.params.invoice;
      this.setState({
        invoiceDetails: {
          PaymentID: invoice.PaymentID != null ? invoice.PaymentID : null,
          SupplierID: invoice.supplierID,
          SupplierName: invoice.supplierName,
          InvoiceNumber: invoice.invoiceNumber,
          TaxInclusiveAmountCurrency: invoice.amount,
          InvoiceDate: moment(invoice.invoiceDate),
          PaymentDueDate: moment(invoice.dueDate),
          Images: invoice.images,
          TaxInclusiveAmountCurrencyDisplay: FormatNumber(invoice.amount),
          ID: invoice.id,
          DefaultDimensions: invoice.defaultDimensions || {},
          DefaultDimensionsID: invoice.defaultDimensionsID || null,
          DepartmentName: invoice.defaultDimensions && invoice.defaultDimensions.Department ? invoice.defaultDimensions.Department.Name : '',
          ProjectName: invoice.defaultDimensions && invoice.defaultDimensions.Project ? invoice.defaultDimensions.Project.Name : ''
        },
        isReady: true,
      });
    }
    else {
      if (this.props.newInvoice.tempImages.length > 0) {
        if (this.props.navigation.state.params.from === 'InboxList') {
          this.getOCRDataForAnInboxImage(this.props.newInvoice.tempImages[0]);
        }
        else {
          this.getOCRDataForAImage(this.props.newInvoice.tempImages[0]);
        }
      }
      const _pDate = { PaymentDueDate: moment().add('days', this.props.company.selectedCompany.CustomerCreditDays) };
      this.setState({ isReady: true, invoiceDetails: { ...this.state.invoiceDetails, ..._pDate } });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.navigation.state.params.isEdit && (this.props.newInvoice.tempImages.length === 0) && (this.props.newInvoice.tempImages.length < nextProps.newInvoice.tempImages.length)) { // to identify if new images are being added
      this.getOCRDataForAImage(nextProps.newInvoice.tempImages[0]);
    }
  }

  componentWillUnmount() {
    this._didFocusSubscription && this._didFocusSubscription.remove();
    this._willBlurSubscription && this._willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    Keyboard.dismiss();
    this.goBack();
    return true;
  };

  goBack() {
    this.props.navigation.goBack();
    this.props.clearTempImages();
    if (this.state.ocrScannedImageExternalID) { // when navigating back if there's an image which is uploaded it will be deleted
      this.deleteUploadedOCRImage(this.state.ocrScannedImageExternalID, this.props.company.selectedCompany.Key);
    }
  }


  handleUpload() {
    Keyboard.dismiss();
    if (!this.state.isUploading && this.isValid()) {
      setTimeout(() => {
        this.startAnimation();
        this.setState({ isUploading: true });
        this.upload(this.handleUpload);
      }, 200);
    } else {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.scrollToBottom();
    }
  }

  getOCRDataForAImage(image) {
    this.setState({ isOCRInProgress: true, isOCRSuccess: false, ocrStatusText: i18n.t('AddNewInvoice.index.uploadingFile') });
    FileService.uploadImage(image, this.props.token.accessToken, this.props.company.selectedCompany.Key)
      .then((response) => {
        this.setState({ ocrScannedImageExternalID: response.data.ExternalId, ocrStatusText: i18n.t('AddNewInvoice.index.scanningInProgress') });
        OCRService.getOCRDataForImage(response.data.ExternalId, this.props.company.selectedCompany.Key)
          .then((res) => {
            this.startOCRAnimation(1);
            const ocrData = this.handleOCRData(res.data);
            this.setState({
              isOCRInProgress: false,
              isOCRSuccess: true,
              isOcrDataBannerVisible: !_.every(ocrData, _.isEmpty),
              ocrStatusText: i18n.t('AddNewInvoice.index.scanningComplete'),
              ocrData,
            });
            setTimeout(() => this.setState({
              isOCRInProgress: false,
              isOCRSuccess: false,
            }), 8000);
          })
          .catch(() => {
            this.setState({
              isOCRInProgress: false,
              isOCRSuccess: false,
              ocrStatusText: '',
            });
          });
      })
      .catch(() => {
        this.setState({
          isOCRInProgress: false,
          isOCRSuccess: false,
          ocrStatusText: '',
        });
      });
  }

  getOCRDataForAnInboxImage(image) {
    this.setState({ isOCRInProgress: true, isOCRSuccess: false, ocrStatusText: i18n.t('AddNewInvoice.index.scanningInProgress'), ocrScannedImageExternalID: image.ID });
    OCRService.getOCRDataForImage(image.ID, this.props.company.selectedCompany.Key)
      .then((res) => {
        this.startOCRAnimation(1);
        const ocrData = this.handleOCRData(res.data);
        this.setState({
          isOCRInProgress: false,
          isOCRSuccess: true,
          isOcrDataBannerVisible: !_.every(ocrData, _.isEmpty),
          ocrStatusText: i18n.t('AddNewInvoice.index.scanningComplete'),
          ocrData,
        });
        setTimeout(() => this.setState({
          isOCRInProgress: false,
          isOCRSuccess: false,
        }), 8000);
      })
      .catch(() => {
        this.setState({
          isOCRInProgress: false,
          isOCRSuccess: false,
          ocrStatusText: '',
        });
      });
  }

  handleOCRData(result) {
    let data = {};
    if (result && result.InterpretedProperties) {
      const props = result.InterpretedProperties;
      const ocrObj = {};
      ocrObj.Orgno = this.getProposedValue(props, OcrPropertyType.OfficialNumber)
        .replace('MVA', '').replace('N0', '').replace('NO', '');
      ocrObj.PaymentID = this.getProposedValue(props, OcrPropertyType.CustomerIdentificationNumber);
      ocrObj.BankAccount = this.getProposedValue(props, OcrPropertyType.BankAccountNumber);
      ocrObj.BankAccountCandidates = ocrObj.BankAccount && ocrObj.BankAccount !== '' ? [ocrObj.BankAccount] : [];
      ocrObj.InvoiceDate = this.getProposedValue(props, OcrPropertyType.InvoiceDate);
      ocrObj.PaymentDueDate = this.getProposedValue(props, OcrPropertyType.DueDate);
      ocrObj.TaxInclusiveAmount = this.getProposedValue(props, OcrPropertyType.TotalAmount);
      ocrObj.InvoiceNumber = this.getProposedValue(props, OcrPropertyType.InvoiceNumber);
      ocrObj.Amount = ocrObj.TaxInclusiveAmount;
      data = { ...ocrObj };
    }
    return data;
  }

  applyOCRData() {
    this.startOCRAnimation(0);  // hide the ocr data banner with animation
    setTimeout(() => {
      this.setState({ isOcrDataBannerVisible: false });
    }, 400);
    const ocrObj = this.state.ocrData;
    const tempData = {};
    if (ocrObj.PaymentID) {
      tempData.PaymentID = ocrObj.PaymentID;
    }
    if (!this.state.invoiceDetails.InvoiceNumber && ocrObj.InvoiceNumber) {
      tempData.InvoiceNumber = ocrObj.InvoiceNumber;
    }
    if (!this.state.invoiceDetails.TaxInclusiveAmountCurrency && ocrObj.TaxInclusiveAmount) {
      tempData.TaxInclusiveAmountCurrency = ocrObj.TaxInclusiveAmount;
      tempData.TaxInclusiveAmountCurrencyDisplay = FormatNumber(parseFloat(ocrObj.TaxInclusiveAmount));
    }
    if (moment().format('YYYY-MM-DD') === this.state.invoiceDetails.InvoiceDate.format('YYYY-MM-DD') && ocrObj.InvoiceDate) {
      tempData.InvoiceDate = moment(ocrObj.InvoiceDate);
    }
    if (moment().format('YYYY-MM-DD') === this.state.invoiceDetails.PaymentDueDate.format('YYYY-MM-DD') && ocrObj.PaymentDueDate) {
      tempData.PaymentDueDate = moment(ocrObj.PaymentDueDate);
    }

    this.setState({ invoiceDetails: { ...this.state.invoiceDetails, ...tempData } });

    // set supplier if any Org number found
    if (ocrObj.Orgno && !this.state.invoiceDetails.SupplierID && !this.state.invoiceDetails.SupplierName) {
      this.ocrSupplierLookup(ocrObj.Orgno);
    }

  }

  ocrSupplierLookup(orgNo) {
    this.setState({ isFetchingSupplierFromPhonebook: true });
    SupplierService.filteruppliers(orgNo, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (!response.data || !response.data.length) {
          SupplierService.findSupplierViaPhonebook(
            orgNo,
            this.props.company.selectedCompany.Key
          )
            .then((res) => {
              //--bank account lookup ------------------->
              let supplierBa = null;
              SupplierService.searchSupliersBankAccountInIBNByAccountNo(this.state.ocrData.BankAccount, this.props.company.selectedCompany.Key)
                .then((response) => {
                  if (response.ok) {

                    const bankAccount = {
                      _createguid: createGuid(),
                      AccountNumber: response.data.AccountNumber,
                      IBAN: response.data.IBAN,
                      BankAccountType: "supplier",
                      BankID: response.data.Bank.ID,
                      Bank: { Name: response.data.Bank.Name, ID: response.data.BankID == undefined ? response.data.Bank.ID : response.data.BankID },
                      ID: response.data.ID

                    }
                    supplierBa = bankAccount;

                  }
                })
                .catch((error) => {

                });
              //----------------------------------------->
              if (res.data.Data && res.data.Data.entries && res.data.Data.entries.length > 0) { // found new data, navigate to create supplier view
                AlertService.showSimpleAlert(
                  i18n.t('AddNewInvoice.index.createSupplier'),
                  `${i18n.t('AddNewInvoice.index.createSupplierDesc')} ${res.data.Data.entries[0].navn ? _.startCase(_.toLower(res.data.Data.entries[0].navn)) : ''} ${i18n.t('AddNewInvoice.index.createSupplierDescEnding')}`,
                  AlertType.CONFIRMATION,
                  () => this.askUserToCreateSupplier(res.data.Data.entries[0], orgNo, supplierBa),
                  null,
                  i18n.t('AddNewInvoice.index.create'),
                  i18n.t('AddNewInvoice.index.cancel')
                );
              }
              this.setState({ isFetchingSupplierFromPhonebook: false });
            }).catch(() => {
              this.setState({ isFetchingSupplierFromPhonebook: false });
            });
        }
        else {
          this.setState({ isFetchingSupplierFromPhonebook: false });
          this.setSupplier(response.data[0]);
        }
      })
      .catch(() => {
        this.setState({ isFetchingSupplierFromPhonebook: false });
      });
  }

  askUserToCreateSupplier(data, orgNo, supplierBa) {
    this.props.navigation.navigate('AddNewSupplier', {
      isEditMode: false,
      data: {
        OcrData: true,
        Name: data.navn ? data.navn : '',
        OrganizationNumber: orgNo,
        SupplierBankAccount: supplierBa,
        Phone: data.tlf ? data.tlf : '',
        BillingPostCode: data.ppostnr ? data.ppostnr : '',
        BillingAddress: data.postadresse ? data.postadresse : '',
        BillingCity: data.ppoststed ? data.ppoststed : '',
        DeliveryAddress: data.forretningsadr ? data.forretningsadr : '',
        DeliveryZipNumber: data.forradrpostnr ? data.forradrpostnr : '',
        DeliveryCity: data.forradrpoststed ? data.forradrpoststed : '',
        // need to pass more data if available
      },
      navigateFrom: 'AddNewInvoice',
      supplierSetter: this.setSupplier,
    });
  }

  getProposedValue(props, propType) {
    const prop = props.find(x => x.OcrProperty.PropertyType === propType);
    if (prop && prop.ProposedCandidate) {
      return prop.ProposedCandidate.Value;
    }
    return '';
  }

  deleteUploadedOCRImage(externalId) {
    // silently set state to default when image is deleted
    FileService.deleteFile(externalId, this.props.company.selectedCompany.Key)
      .catch(() => { });
  }

  startOCRAnimation(fadeIn) {
    Animated.timing(
      this.state.fadeAnimation, {
        toValue: fadeIn,
        duration: 300,
        useNativeDriver: true
      },
    ).start();
  }

  addImages(data) {
    const newImagesList = [];
    if (Array.isArray(data)) {
      data.forEach(item => newImagesList.push(item));
    } else {
      newImagesList.push(data);
    }
    this.props.addTempImages(newImagesList);
  }

  async uploadImages(postUploadFunction = () => { }) {
    const tempImages = this.props.newInvoice.tempImages;
    const deletedImages = this.state.DeletedImages.slice();
    try {
      if (deletedImages.length !== 0) {
        for (let fileIndex in deletedImages) {
          await FileService.deleteSupplierInvoiceFile(
            deletedImages[fileIndex].ID,
            this.props.navigation.state.params.isEdit ? this.props.navigation.state.params.invoice.id : this.state.invoiceID,
            this.props.company.selectedCompany.Key);
          this.setState({ DeletedImages: deletedImages.filter((image) => { return image.ID !== deletedImages[fileIndex].ID; }) });
        }
        this.setState({ DeletedImages: [] });
      }
      if (tempImages.length !== 0) {
        for (let imgIndex in tempImages) {
          this.setState({ uploadingFileStatus: `${i18n.t('AddNewInvoice.index.image')} ${Number(imgIndex) + 1} ${i18n.t('AddNewInvoice.index.outOf')} ${tempImages.length}` });
          if (this.state.ocrScannedImageExternalID && imgIndex == 0) {
            if (this.props.navigation.state.params.from === 'InboxList') {
              await UploadService.linkImageToInvoice(this.state.ocrScannedImageExternalID, this.state.invoiceID, this.props.company.selectedCompany.Key);
            }
            else {
              await UploadService.linkImageToInvoice(this.state.ocrScannedImageExternalID, this.state.invoiceID, this.props.company.selectedCompany.Key);
            }
            this.props.removeTempImage(tempImages[imgIndex]);
          }
          else {
            await UploadService.uploadSupplierInvoice(
              this.props.navigation.state.params.isEdit ? this.props.navigation.state.params.invoice.id : this.state.invoiceID,
              imgIndex,
              tempImages[imgIndex],
              this.props.token.accessToken,
              this.props.company.selectedCompany.Key);
            this.props.removeTempImage(tempImages[imgIndex]);
          }
        }
        this.props.clearTempImages();
      }
      postUploadFunction();
      this.startAnimation(true);
      this.props.navigation.setParams({ isActionComplete: false });
    } catch (error) {
      this.setState({ didImageUploadFail: true, isUploading: false });
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.handleInvoiceUploadErrors(error.problem, this.handleUpload, i18n.t('AddNewInvoice.index.imageError'));
    }
  }

  async upload(caller) {
    this.isActionComplete = true;
    this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    let invoice = {
      ...this.state.invoiceDetails,
      TaxInclusiveAmount: DeFormatNumber(this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay),
      TaxInclusiveAmountCurrency: DeFormatNumber(this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay),
      InvoiceDate: this.state.invoiceDetails.InvoiceDate.format('YYYY-MM-DD'),
      PaymentDueDate: this.state.invoiceDetails.PaymentDueDate.format('YYYY-MM-DD')
    };
    delete invoice.SupplierName;
    delete invoice.ProjectName;
    delete invoice.DepartmentName;
    const companyKey = this.props.company.selectedCompany.Key;

    if (this.props.navigation.state.params.isEdit) {
      invoice = { ...invoice, ID: this.props.navigation.state.params.invoice.id };
      const _postEditInvoiceFunction = () => {
        this.props.navigation.state.params.refreshInvoiceDetails();
        this.props.navigation.goBack();
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Supplier Invoice' });
      };
      if (!this.state.didImageUploadFail) {
        try {
          //Removed DefaultDimensions object of its empty to sove the issue of editing invoice details
          if (JSON.stringify(invoice.DefaultDimensions) === JSON.stringify({})) {
            delete invoice.DefaultDimensions
          }
          await InvoiceService.editInvoice(this.props.navigation.state.params.invoice.id, invoice, companyKey);
        } catch (error) {
          this.handleInvoiceUploadErrors(error.problem, caller, i18n.t('AddNewInvoice.index.saveError'));
          this.isActionComplete = false;
          this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        }
      }
      this.uploadImages(_postEditInvoiceFunction);
    } else {
      const _postCreateInvoiceFunction = () => {
        this.props.resetToInvoiceDetails(this.state.invoiceID, companyKey);
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Supplier Invoice' });
      };
      if (!this.state.didImageUploadFail) {
        try {
          delete invoice.ID;
          const createResponse = await InvoiceService.createNewInvoice(invoice, companyKey);
          this.setState({ invoiceID: createResponse.data.ID });
        } catch (error) {
          this.handleInvoiceUploadErrors(error.problem, caller, i18n.t('AddNewInvoice.index.uploadError'));
          this.isActionComplete = false;
          this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        }
      }
      this.uploadImages(_postCreateInvoiceFunction);
    }
  }

  handleInvoiceUploadErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewInvoice.index.somethingWrong')) {
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

  onSupplierSelect() {
    this.setState({ errors: { ...this.state.errors, Supplier: null } });
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewInvoice.index.selectSupplier'),
        searchCriteria: i18n.t('AddNewInvoice.index.supplier'),
        entityType: EntityType.SUPPLIER,
        setter: this.setSupplier,
        service: SupplierService.getSuppliersForNewInvoice.bind(null, this.props.company.selectedCompany.Key),
        filter: (Supplier, serachText) => this.filterSupplier(Supplier, serachText)
      }
    });
  }

  handleOnBlur() {
    const TaxInclusiveAmountCurrency = DeFormatNumber(this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay);
    if (TaxInclusiveAmountCurrency !== false) {
      const TaxInclusiveAmountCurrencyDisplay = FormatNumber(TaxInclusiveAmountCurrency);
      this.setState({ invoiceDetails: { ...this.state.invoiceDetails, TaxInclusiveAmountCurrency, TaxInclusiveAmountCurrencyDisplay } });
    }
    else {
      this.setState({ errors: { ...this.state.errors, Amount: i18n.t('AddNewInvoice.index.amountErrorType2') } });
    }
  }

  onAmountBlur() {
    if (this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay == '') {
      const TaxInclusiveAmountCurrencyDisplay = this.state.localizedZero;
      this.setState({ invoiceDetails: { ...this.state.invoiceDetails, TaxInclusiveAmountCurrencyDisplay } }, this.handleOnBlur);
    }
    else {
      this.handleOnBlur;
    }
  }

  filterSupplier(Supplier, serachText) {
    if (Supplier.ID.toString().indexOf(serachText) !== -1
      || Supplier.Info.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1) {
      return Supplier;
    } else {
      return null;
    }
  }

  setSupplier(supplier) {
    this.setState({ invoiceDetails: { ...this.state.invoiceDetails, SupplierID: supplier.ID, SupplierName: supplier.Info.Name } });
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
  }

  isValid() {
    const errors = {};

    if (this.state.invoiceDetails.PaymentID) {
      if (!KIDValidator.isKIDValid(this.state.invoiceDetails.PaymentID.toString().trim()))
        errors.PaymentID = i18n.t('AddNewInvoice.index.kidError');
    }
    if (!this.state.invoiceDetails.SupplierID || !this.state.invoiceDetails.SupplierName) {
      errors.Supplier = i18n.t('AddNewInvoice.index.supplierError');
    }
    if (!this.state.invoiceDetails.InvoiceNumber) {
      errors.InvoiceNo = i18n.t('AddNewInvoice.index.invoiceError');
    }
    if (!this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay) {
      if (!this.props.navigation.state.params.isEdit) {
        errors.Amount = i18n.t('AddNewInvoice.index.amountErrorType1');
      }
    }
    else if (DeFormatNumber(this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay) === false) {
      errors.Amount = this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay + i18n.t('AddNewInvoice.index.amountErrorType2');
    }
    if (!moment(this.state.invoiceDetails.InvoiceDate.format('YYYY-MM-DD')).isSameOrBefore(this.state.invoiceDetails.PaymentDueDate.format('YYYY-MM-DD'))) {
      errors.DueDate = i18n.t('AddNewInvoice.index.dueDateError');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  isValidAmount(amount) {
    return amount.match(/^\d+(\.\d\d)?$/);
  }

  _showDatePicker(picker) {
    this.setState({ isDateTimePickerVisible: true, picker, initialDate: this.state.invoiceDetails[picker] });
  }

  _handleDatePicked(date) {
    let _date;
    let _pDate;
    if (this.state.picker === 'InvoiceDate') {
      _date = { InvoiceDate: moment(date) };
      _pDate = { PaymentDueDate: moment(date).add('days', this.props.company.selectedCompany.CustomerCreditDays) };
    } else if (this.state.picker === 'PaymentDueDate') {
      _date = { PaymentDueDate: moment(date) };
    }

    if (this.state.picker === 'InvoiceDate')
      this.setState({ isDateTimePickerVisible: false, invoiceDetails: { ...this.state.invoiceDetails, ..._date, ..._pDate } });
    else
      this.setState({ isDateTimePickerVisible: false, invoiceDetails: { ...this.state.invoiceDetails, ..._date } });
  }

  _hideDateTimePicker() {
    this.setState({ isDateTimePickerVisible: false });
  }

  onDeleteTap(deletedImage, index) {
    const imageLength = this.props.newInvoice.tempImages.length;
    const _deleteImage = (_deletedImage) => {
      if (_deletedImage.hasOwnProperty('StorageReference')) { // to identify if a image is newly added or already exsisting
        this.deleteExsistingImageFromState(_deletedImage);
      }
      else {
        this.props.removeTempImage(_deletedImage);
      }
    };

    if (!this.props.navigation.state.params.isEdit) {
      if (index === 0) { // to identify if user deletes ocr scanned image and then delete it from server
        this.setState({
          isOCRInProgress: false,
          isOCRSuccess: false,
          isOcrDataBannerVisible: false,
          ocrScannedImageExternalID: null,
        }, () => {
          this.deleteUploadedOCRImage(this.state.ocrScannedImageExternalID);
          if (imageLength > 1) {
            this.getOCRDataForAImage(this.props.newInvoice.tempImages[1]);
          }
          _deleteImage(deletedImage);
        });
      }
      else {
        _deleteImage(deletedImage);
      }
    } else {
      _deleteImage(deletedImage);
    }
  }

  deleteExsistingImageFromState(file) {
    const newImageArr = this.state.invoiceDetails.Images.filter((image) => { return image.ID !== file.ID; });
    this.setState({ invoiceDetails: { ...this.state.invoiceDetails, Images: [...newImageArr] }, DeletedImages: [...this.state.DeletedImages, file] });
  }

  handlePlaceHolder() {
    this.scrollToBottom();
    if (this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay.toString() == this.state.localizedZero) {
      this.setState({ invoiceDetails: { ...this.state.invoiceDetails, TaxInclusiveAmountCurrencyDisplay: '' } });
    }
  }

  onProjectSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewInvoice.index.selectProject'),
        searchCriteria: i18n.t('AddNewInvoice.index.project'),
        entityType: EntityType.PROJECT,
        showInstantResults: true,
        setter: this.setProject,
        service: WorkerService.getWorkingProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
      }
    });
  }

  setProject(project) {
    const temp = this.state.invoiceDetails.DefaultDimensions || {};
    this.setState({ invoiceDetails: { ...this.state.invoiceDetails, ProjectName: project.Name, DefaultDimensions: { ...temp, ProjectID: project.ID, Project: project, _createguid: createGuid() } } });
  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewInvoice.index.selectDepartment'),
        searchCriteria: i18n.t('AddNewInvoice.index.department'),
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
      }
    });
  }

  setDepartment(department) {
    const temp = this.state.invoiceDetails.DefaultDimensions || {};
    this.setState({ invoiceDetails: { ...this.state.invoiceDetails, DepartmentName: department.Name, DefaultDimensions: { ...temp, DepartmentID: department.ID, Department: department, _createguid: createGuid() } } });
  }

  render() {
    return (

      <ViewWrapperAsync withFade={true} withMove={true} isReady={this.state.isReady} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>

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
            <Text>{this.props.navigation.state.params.isEdit ? `${i18n.t('AddNewInvoice.index.saving')}${this.state.uploadingFileStatus ? `\n${i18n.t('AddNewInvoice.index.uploadOnSave')} ${this.state.uploadingFileStatus.toLowerCase()}` : ''}` : `${i18n.t('AddNewInvoice.index.uploading')}\n${this.state.uploadingFileStatus}`}</Text>
          </View>
        </Animated.View>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <ImageCarousel
            images={this.props.navigation.state.params.isEdit ? [...this.state.invoiceDetails.Images, ...this.props.newInvoice.tempImages] : [...this.props.newInvoice.tempImages]}
            viewModeOnly={false}
            noImageTitle={i18n.t('ImageCarousel.noImageTitle')}
            getImageURI={image => image.hasOwnProperty('StorageReference') ? getImageLink(image.StorageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true, 400, 600) : { uri: (image) }}
            onImageAdd={this.addImages}
            navigateToCamera={this.props.navigateToCamera}
            onDelete={this.onDeleteTap}
            isOCRInProgress={this.state.isOCRInProgress}
            isOCRSuccess={this.state.isOCRSuccess}
            ocrStatusText={this.state.ocrStatusText}
          />
          {this.state.isOcrDataBannerVisible ? <Animated.View style={[styles.ocrDataContainer, { opacity: this.state.fadeAnimation }]}>
            <Icon name={'close'} size={18} color={theme.SCREEN_COLOR_DARK_GREY} onPress={() => this.setState({ isOcrDataBannerVisible: false, isOCRInProgress: false, isOCRSuccess: false })} />
            <View>
              <Text style={styles.ocrDataDescription} numberOfLines={2}>{i18n.t('AddNewInvoice.index.ocrDataAvailableDesc')}</Text>
              <Text style={styles.ocrDataDescriptionWarning} numberOfLines={1}>{i18n.t('AddNewInvoice.index.ocrDataAvailableDescWarning')}</Text>
            </View>
            <Text style={styles.ocrDataApplyButton} onPress={this.applyOCRData}>{i18n.t('AddNewInvoice.index.apply')}</Text>
          </Animated.View> : null}
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.supplier')}
              placeHolder={i18n.t('AddNewInvoice.index.companyName')}
              isKeyboardInput={false}
              onPress={this.onSupplierSelect}
              value={this.state.invoiceDetails.SupplierName}
              error={this.state.errors.Supplier}
              showLoadingSpinner={this.state.isFetchingSupplierFromPhonebook}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.invoice')}
              placeHolder={i18n.t('AddNewInvoice.index.invoiceNo')}
              onChangeText={text => this.setState({ invoiceDetails: { ...this.state.invoiceDetails, InvoiceNumber: text }, errors: { ...this.state.errors, InvoiceNo: null } })}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onFocus={this.scrollToBottom}
              value={this.state.invoiceDetails.InvoiceNumber}
              error={this.state.errors.InvoiceNo}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.amount')}
              placeHolder={'NOK 0.00'}
              onChangeText={TaxInclusiveAmountCurrencyDisplay => this.setState({ invoiceDetails: { ...this.state.invoiceDetails, TaxInclusiveAmountCurrencyDisplay }, errors: { ...this.state.errors, Amount: null } })}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onFocus={() => this.handlePlaceHolder()}
              value={this.state.invoiceDetails.TaxInclusiveAmountCurrencyDisplay.toString()}
              error={this.state.errors.Amount}
              onBlur={this.onAmountBlur}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.project')}
              placeHolder={i18n.t('AddNewInvoice.index.projectNameNum')}
              isKeyboardInput={false}
              onPress={this.onProjectSelect}
              value={this.state.invoiceDetails.ProjectName}
              error={this.state.errors.Project}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.department')}
              placeHolder={i18n.t('AddNewInvoice.index.departmentNameNum')}
              isKeyboardInput={false}
              onPress={this.onDepartmentSelect}
              value={this.state.invoiceDetails.DepartmentName}
              error={this.state.errors.Department}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.kid')}
              placeHolder={'KID'}
              onChangeText={PaymentID => this.setState({ invoiceDetails: { ...this.state.invoiceDetails, PaymentID }, errors: { ...this.state.errors, PaymentID: null } })}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onFocus={() => this.handlePlaceHolder()}
              value={this.state.invoiceDetails.PaymentID}
              error={this.state.errors.PaymentID}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.invoiceDate')}
              placeHolder={'DD/MM/YYYY'}
              isKeyboardInput={false}
              onPress={() => { Keyboard.dismiss(); this._showDatePicker('InvoiceDate'); }}
              value={this.state.invoiceDetails.InvoiceDate.format('DD/MM/YYYY')}
              error={this.state.errors.InvoiceDate}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewInvoice.index.dueDate')}
              placeHolder={'DD/MM/YYYY'}
              isKeyboardInput={false}
              onPress={() => {
                Keyboard.dismiss();
                this.setState({ errors: { ...this.state.errors, DueDate: null } });
                this._showDatePicker('PaymentDueDate');
              }}
              value={this.state.invoiceDetails.PaymentDueDate.format('DD/MM/YYYY')}
              error={this.state.errors.DueDate}
            />
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
      </ViewWrapperAsync>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    newInvoice: state.newInvoice,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch, { navigation }) => {
  return {
    resetToInvoiceDetails: (id, companyKey, refresher) => dispatch(resetToInvoiceDetails(id, companyKey, refresher)),
    navigateToCamera: () => dispatch(NavigationActions.navigate({ routeName: 'CameraView', params: { showImgGallery: false, showSkip: false, onImageAdd: (images) => dispatch(addTempImages(images)), title: navigation.state.params.isEdit ? i18n.t('AddNewInvoice.index.editInvoice') : i18n.t('AddNewInvoice.index.title') } })),
    addTempImages: (images) => dispatch(addTempImages(images)),
    removeTempImage: (image) => dispatch(removeTempImage(image)),
    clearTempImages: () => dispatch(clearTempImages())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewInvoice);

const styles = StyleSheet.create({
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF',
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
    marginTop: 10,
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
    height: 25,
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
  infoRowValidationError: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.ERROR_TEXT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowTextValidationError: {
    color: theme.ERROR_TEXT_COLOR,
    flex: 1,
  },
  infoRowContainerError: {
    paddingRight: 15,
    paddingLeft: 15,
    backgroundColor: theme.ERROR_BACKGROUND_COLOR,
  },
  infoRowTitleError: {
    color: theme.ERROR_TEXT_COLOR,
    width: 90,
    fontWeight: '600',
  },
  infoRowTextError: {
    color: theme.ERROR_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextActiveError: {
    color: theme.ERROR_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextInputError: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 14,
    marginLeft: -2,
    color: theme.ERROR_TEXT_COLOR,
  },
  warningText: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 5,
    paddingBottom: 10,
    fontSize: 12,
    color: theme.SECONDARY_TEXT_COLOR,
  },
  iphoneXSpace: {
    height: 50,
  },
  ocrDataDescription: {
    fontSize: 12,
    width: (2 * WIDTH) / 3,
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  ocrDataDescriptionWarning: {
    fontSize: 11,
    width: (2 * WIDTH) / 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: theme.DISABLED_ITEM_COLOR,
  },
  ocrDataApplyButton: {
    borderColor: theme.SCREEN_COLOR_DARK_GREY,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    fontSize: 11,
  },
  ocrDataContainer: {
    height: 60,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 248, 198, 0.6)',
  }
});
