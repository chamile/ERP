// @flow
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Keyboard,
  Animated,
  ActivityIndicator,
  Easing,
  Alert
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Analytics from 'appcenter-analytics';
import moment from 'moment';

import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import i18n from '../../i18n/i18nConfig';
import ProductService from '../../services/ProductService';
import FileService from '../../services/FileService';
import CurrencyService from '../../services/CurrencyService';
import { getImageLink, createGuid } from '../../helpers/APIUtil';
import { EntityType } from '../../constants/EntityTypes';
import ImageCarousel from '../../components/ImageCarousel';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { DeFormatNumber, FormatNumber } from '../../helpers/NumberFormatUtil';
import QuoteService from '../../services/QuoteService';


class AddNewQuoteItem extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.edit ? i18n.t('AddNewQuoteItem.index.editItem') : i18n.t('AddNewQuoteItem.index.addItem'),
      headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.state.params.edit ? navigation.state.params.editItemOnQuote() : navigation.state.params.addItemToQuote(); }} text={navigation.state.params.edit ? i18n.t('AddNewQuoteItem.index.save') : i18n.t('AddNewQuoteItem.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }} text={i18n.t('AddNewQuoteItem.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      localizedZero: FormatNumber(0),
      isLoading: true,
      moveAnimation: new Animated.Value(0),
      productDetails: {
        ProductID: 0,
        ImageFileID: '',
        ItemText: '',
        PriceExVatCurrency: 0,
        PriceIncVatCurrency: 0,
        Unit: '',
        DiscountPercent: 0,
        NumberOfItems: 1,
        NumberOfItemsDisplay: FormatNumber(1),
        Sum: 0,
        CurrencyCodeID: this.props.navigation.state.params.CurrencyCodeID,
        CurrencyExchangeRate: this.props.navigation.state.params.CurrencyExchangeRate ? this.props.navigation.state.params.CurrencyExchangeRate : 0,
        CurrencyCode: this.props.navigation.state.params.CurrencyCode ? this.props.navigation.state.params.CurrencyCode : { Code: '' },
        VatType: {
          ID: null,
          Name: '',
          VatPercent: 0
        },
        Images: [],
        VatPercent: 0,
        PriceExVatCurrencyDisplay: FormatNumber(0),
        PriceIncVatCurrencyDisplay: FormatNumber(0),
        DiscountPercentDisplay: FormatNumber(0),
      },
      errors: {
        PriceExVatCurrency: null,
        PriceIncVatCurrency: null,
        Unit: null,
        DiscountPercent: null,
        NumberOfItems: null,
        Sum: null,
      },
      itemAdded: false,
    };
    this.addItemToQuote = this.addItemToQuote.bind(this);
    this.selectVatCode = this.selectVatCode.bind(this);
    this.setVATCode = this.setVATCode.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.onNumberChange = this.onNumberChange.bind(this);
    this.onDiscountChange = this.onDiscountChange.bind(this);
    this.onPriceChange = this.onPriceChange.bind(this);
    this.editItemOnQuote = this.editItemOnQuote.bind(this);
    this.fetchProductDetails = this.fetchProductDetails.bind(this);
    this.setEditDetails = this.setEditDetails.bind(this);
    this.setSpecialDiscountForCustomer = this.setSpecialDiscountForCustomer.bind(this);
    this.onPriceIncVatChange = this.onPriceIncVatChange.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ addItemToQuote: this.addItemToQuote, disableActionButton: false, editItemOnQuote: this.editItemOnQuote });
    this.props.navigation.state.params.edit ? this.setEditDetails() : this.fetchProductDetails();
  }

  onDiscountChange() {
    const DiscountPercent = DeFormatNumber(this.state.productDetails.DiscountPercentDisplay);
    if (DiscountPercent !== false) {
      const DiscountPercentDisplay = FormatNumber(DiscountPercent);
      this.setState({ productDetails: { ...this.state.productDetails, DiscountPercent, DiscountPercentDisplay } }, () => {
        this.calculateTradePrices();
      });
    } else {
      if (this.state.productDetails.DiscountPercentDisplay == '') {
        this.resetData('DiscountPercentDisplay');
      } else {
        this.setState({ errors: { ...this.state.errors, DiscountPercent: i18n.t('AddNewQuoteItem.index.discountFormatError') } });
      }
    }
  }

  onPriceChange() {
    if (this.state.productDetails.PriceExVatCurrencyDisplay !== '') {
      const PriceExVatCurrency = DeFormatNumber(this.state.productDetails.PriceExVatCurrencyDisplay);
      const PriceExVatCurrencyDisplay = FormatNumber(PriceExVatCurrency);
      if (PriceExVatCurrency !== false) {
        this.setState({ productDetails: { ...this.state.productDetails, PriceExVatCurrency, PriceExVatCurrencyDisplay } }, () => {
          this.calculateTradePrices();
        });
      }
      else {
        this.setState({ errors: { ...this.state.errors, PriceExVatCurrency: i18n.t('AddNewQuoteItem.index.priceFormatError') } });
      }
    }
    else {
      this.resetData('PriceExVatCurrencyDisplay');
    }
  }

  onPriceIncVatChange() {
    const PriceIncVatCurrency = DeFormatNumber(this.state.productDetails.PriceIncVatCurrencyDisplay);
    if (PriceIncVatCurrency !== false) {
      const PriceIncVatCurrencyDisplay = FormatNumber(PriceIncVatCurrency);
      const PriceExVatCurrency = this.calculatePriceUsingPriceIncVat(PriceIncVatCurrency, this.state.productDetails.VatPercent);
      this.setState({ productDetails: { ...this.state.productDetails, PriceIncVatCurrency, PriceExVatCurrency, PriceExVatCurrencyDisplay: FormatNumber(PriceExVatCurrency), PriceIncVatCurrencyDisplay } }, () => {
        this.calculateTradePrices();
      });
    }
    else {
      if (this.state.productDetails.PriceIncVatCurrencyDisplay == '') {
        this.resetData('PriceIncVatCurrencyDisplay');
      }
      else {
        this.setState({ errors: { ...this.state.errors, PriceIncVatCurrency: i18n.t('AddNewQuoteItem.index.priceFormatError') } });
      }
    }
  }

  calculatePriceUsingPriceIncVat(priceIncVatCurrency, vatPercent) {
    if (vatPercent == null) {
      return priceIncVatCurrency;
    }
    return this.roundPrice((priceIncVatCurrency * 100) / (100 + vatPercent), 4);
  }

  onNumberChange() {
    const NumberOfItems = DeFormatNumber(this.state.productDetails.NumberOfItemsDisplay);
    if (NumberOfItems) {
      const NumberOfItemsDisplay = FormatNumber(NumberOfItems);
      this.setState({ productDetails: { ...this.state.productDetails, NumberOfItemsDisplay, NumberOfItems } },
        () => {
          this.calculateTradePrices();
        });
    } else {
      this.setState({ errors: { ...this.state.errors, NumberOfItems: i18n.t('AddNewQuoteItem.index.numberOfItemsFormatError') } });
    }
  }

  fetchProductDetails() {
    ProductService.getProduct(this.props.navigation.state.params.productID, this.props.company.selectedCompany.Key)
      .then((res) => {
        const product = res.data;
        // following is used to findout the valid vat percent from list of vatPercentages.
        if (product.VatType && product.VatType.VatTypePercentages) {
          const vatPercentObj = product.VatType.VatTypePercentages.find((element) => {
            if (element.VatTypeID === product.VatTypeID) {
              const today = moment();
              const validFrom = moment(element.ValidFrom);
              const validTo = element.ValidTo ? moment(element.ValidTo) : null;
              if (today.isAfter(validFrom)) {
                if (validTo) {
                  return today.isBefore(validTo);
                }
                else {
                  return true;
                }
              }
            }
            return false;
          });
          if (vatPercentObj) {
            product.VatPercent = vatPercentObj.VatPercent;
          }
        }
        else {
          product.VatPercent = this.calculateVatPercentManually({ PriceIncVat: this.roundPrice(product.PriceIncVat / this.state.productDetails.CurrencyExchangeRate, 4), PriceExVat: this.roundPrice(product.PriceExVat / this.state.productDetails.CurrencyExchangeRate, 4) });
        }

        this.setState({
          isLoading: true,
          productDetails: {
            ...this.state.productDetails,
            ProductID: product.ID,
            ItemText: product.Name,
            AccountID: product.AccountID,
            DimensionsID: product.DimensionsID,
            PriceExVat: this.roundPrice(product.PriceExVat / this.state.productDetails.CurrencyExchangeRate, 4),
            PriceExVatCurrency: product.PriceExVat ? this.roundPrice(product.PriceExVat / this.state.productDetails.CurrencyExchangeRate, 4) : 0,
            PriceIncVat: this.roundPrice(product.PriceIncVat / this.state.productDetails.CurrencyExchangeRate, 4),
            PriceIncVatCurrency: product.PriceIncVat ? this.roundPrice(product.PriceIncVat / this.state.productDetails.CurrencyExchangeRate, 4) : 0,
            Unit: product.Unit,
            VatTypeID: product.VatTypeID,
            VatType: { ...this.state.VatType, ...product.VatType },
            ImageFileID: product.ImageFileID,
            CostPrice: product.CostPrice,
            CalculateGrossPriceBasedOnNetPrice: product.CalculateGrossPriceBasedOnNetPrice,
            PriceExVatCurrencyDisplay: FormatNumber(product.PriceExVat ? this.roundPrice(product.PriceExVat / this.state.productDetails.CurrencyExchangeRate, 4) : 0),
            PriceIncVatCurrencyDisplay: FormatNumber(product.PriceIncVat ? this.roundPrice(product.PriceIncVat / this.state.productDetails.CurrencyExchangeRate, 4) : 0),
            VatPercent: product.VatPercent,
          }
        }, () => { this.calculateTradePrices(); });
        return FileService.getFiles(this.props.navigation.state.params.productID, EntityType.PRODUCT, this.props.company.selectedCompany.Key)
      })
      .then((response) => {
        this.setState({
          isLoading: false,
          productDetails: { ...this.state.productDetails, Images: response.data.length === 0 ? [] : response.data.map(image => { return { StorageReference: image.StorageReference, ID: image.ID } }) }
        });
      }).catch((err) => {
        this.handleProductErrors(err.problem, this.componentDidMount.bind(this), i18n.t('AddNewQuoteItem.index.fetchingProductError'));
      });
  }

  setEditDetails() {
    FileService.getFiles(this.props.navigation.state.params.item.ProductID, EntityType.PRODUCT, this.props.company.selectedCompany.Key)
      .then((response) => {
        this.setState({
          isLoading: false,
          productDetails: { ...this.state.productDetails, Images: response.data.length === 0 ? [] : response.data.map(image => { return { StorageReference: image.StorageReference, ID: image.ID } }) }
        });
      }).catch(() => { });

    const item = this.props.navigation.state.params.item;
    this.setState({
      isLoading: false,
      productDetails: {
        ...this.state.productDetails,
        ID: item.ID,
        ProductID: item.ProductID,
        ItemText: item.ItemText,
        PriceExVat: item.PriceExVat,
        PriceExVatCurrency: item.PriceExVatCurrency,
        PriceIncVat: item.PriceIncVat,
        PriceIncVatCurrency: item.PriceIncVatCurrency || item.PriceIncVat * item.CurrencyExchangeRate,
        Unit: item.Unit,
        VatTypeID: item.VatTypeID,
        VatType: { ...item.VatType },
        ImageFileID: item.ImageFileID,
        CurrencyCodeID: item.CurrencyCodeID,
        CurrencyExchangeRate: item.CurrencyExchangeRate,
        CurrencyCode: item.CurrencyCode,
        CustomerOrderID: item.CustomerOrderID,
        NumberOfItems: item.NumberOfItems,
        DiscountPercent: item.DiscountPercent,
        DiscountPercentDisplay: FormatNumber(item.DiscountPercent),
        PriceExVatCurrencyDisplay: FormatNumber(item.PriceExVatCurrency),
        PriceIncVatCurrencyDisplay: FormatNumber(item.PriceIncVatCurrency),
        NumberOfItemsDisplay: FormatNumber(item.NumberOfItems),
        VatPercent: item.VatPercent,
      }
    }, () => { this.calculateTradePrices(); });
  }

  getItemDetails(edit = false) {
    let product = { ...this.state.productDetails };
    delete product.VatType;
    delete product.CurrencyCodeID;
    delete product.CurrencyCode;
    delete product.Sum;
    delete product.CurrencyExchangeRate;
    delete product.Images;
    delete product.NumberOfItemsDisplay;
    delete product.PriceExVatCurrencyDisplay;
    delete product.DiscountPercentDisplay;
    delete product.PriceIncVatCurrencyDisplay;
    if (!edit) {
      product._createguid = createGuid();
    }
    return product;
  }

  addItemToQuote() {
    this.startAnimation();
    Keyboard.dismiss();
    this.props.navigation.setParams({ disableActionButton: true });
    // if (!this.state.itemAdded) {
    this.state.itemAdded = true;
    setTimeout(() => {
      if (this.isValid()) {
        this.props.navigation.setParams({ disableActionButton: true });
        QuoteService.addNewItem(this.props.navigation.state.params.quoteID, this.getItemDetails(), this.props.company.selectedCompany.Key)
          .then((res) => {
            this.startAnimation(true);
            this.props.navigation.state.params.refreshData();
            this.props.navigation.state.params.goBack();
            this.props.navigation.goBack();
            this.props.navigation.setParams({ disableActionButton: false });
            this.state.itemAdded = false;
            Analytics.trackEvent(AnalyticalEventNames.EDIT_ITEM, { entity: 'Customer quote item' });
          })
          .catch((err) => {
            this.state.itemAdded = false;
            this.startAnimation(true);
            this.handleProductErrors(err.problem, this.addItemToQuote, i18n.t('AddNewQuoteItem.index.addItemError'));
            this.props.navigation.setParams({ disableActionButton: false });
          });
      }
      else {
        this.props.navigation.setParams({ disableActionButton: false });
      }
    }, 1000);
    // }
  }

  editItemOnQuote() {
    this.startAnimation();
    Keyboard.dismiss();
    this.props.navigation.setParams({ disableActionButton: true });
    setTimeout(() => {
      if (this.isValid()) {
        this.props.navigation.setParams({ disableActionButton: true });
        QuoteService.addNewItem(this.props.navigation.state.params.quoteID, this.getItemDetails(true), this.props.company.selectedCompany.Key)
          .then((res) => {
            this.startAnimation(true);
            this.props.navigation.state.params.refreshData();
            this.props.navigation.goBack();
            this.props.navigation.setParams({ disableActionButton: false });
            Analytics.trackEvent(AnalyticalEventNames.CREATE_ITEM, { entity: 'Customer quote item' });
          })
          .catch((err) => {
            let errorMsg = i18n.t('AddNewQuoteItem.index.editItemError');
            if (err.data && err.data.ErrorsCount && err.data.ErrorsCount > 0) {
              errorMsg = err.data.Messages[0].Message;
              Alert.alert('ERROR', errorMsg);
            } else {
              this.handleProductErrors(err.problem, this.editItemOnQuote, errorMsg);
            }
            this.startAnimation(true);
            this.props.navigation.setParams({ disableActionButton: false });
          });
      }
      else {
        this.props.navigation.setParams({ disableActionButton: false });
      }
    }, 1000);
  }

  resetData(Key) {
    if (Key == 'Sum')
      this.setState({ productDetails: { ...this.state.productDetails, Sum: this.state.localizedZero } });
    if (Key == 'DiscountPercentDisplay')
      this.setState({ productDetails: { ...this.state.productDetails, DiscountPercentDisplay: this.state.localizedZero } });
    if (Key == 'PriceIncVatCurrencyDisplay')
      this.setState({ productDetails: { ...this.state.productDetails, PriceIncVatCurrencyDisplay: this.state.localizedZero } });
    if (Key == 'PriceExVatCurrencyDisplay')
      this.setState({ productDetails: { ...this.state.productDetails, PriceExVatCurrencyDisplay: this.state.localizedZero } });
  }

  isValid() {
    const errors = {};
    if (DeFormatNumber(this.state.productDetails.DiscountPercentDisplay) === false) {
      if (this.state.productDetails.DiscountPercentDisplay == '' && this.props.navigation.state.params.edit) {
        this.resetData('DiscountPercentDisplay');
      }
      else {
        errors.DiscountPercent = i18n.t('AddNewQuoteItem.index.discountFormatError');
      }
    }
    if (!this.state.productDetails.NumberOfItems || (DeFormatNumber(this.state.productDetails.NumberOfItemsDisplay) === false) || DeFormatNumber(this.state.productDetails.NumberOfItemsDisplay) === 0) {
      errors.NumberOfItems = i18n.t('AddNewQuoteItem.index.numberOfItemsFormatError');
    }
    if ((!this.state.productDetails.PriceExVatCurrency && DeFormatNumber(this.state.productDetails.PriceExVatCurrencyDisplay) !== 0) || (DeFormatNumber(this.state.productDetails.PriceExVatCurrencyDisplay) === false)) {
      errors.PriceExVatCurrency = i18n.t('AddNewQuoteItem.index.priceFormatError');
    }
    if ((!this.state.productDetails.PriceIncVatCurrency && DeFormatNumber(this.state.productDetails.PriceIncVatCurrencyDisplay) !== 0) || (DeFormatNumber(this.state.productDetails.PriceIncVatCurrencyDisplay) === false)) {
      if (this.state.productDetails.PriceIncVatCurrencyDisplay == '' && this.props.navigation.state.params.edit) {
        this.resetData('PriceIncVatCurrencyDisplay');
      }
      else {
        errors.PriceIncVatCurrency = i18n.t('AddNewQuoteItem.index.priceFormatError');
      }
    }
    if ((!this.state.productDetails.Sum && DeFormatNumber(this.state.productDetails.Sum) !== 0) || (DeFormatNumber(this.state.productDetails.Sum) === false)) {
      if (this.state.productDetails.Sum == '' && this.props.navigation.state.params.edit) {
        this.resetData('Sum');
      }
      else {
        errors.Sum = i18n.t('AddNewQuoteItem.index.sumFormatError');
      }
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  selectVatCode() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Supplier: null } });
    this.props.navigation.navigate('LookupVatView', {
      data: {
        title: i18n.t('AddNewQuoteItem.index.selectVatType'),
        searchCriteria: i18n.t('AddNewQuoteItem.index.vatType'),
        entityType: EntityType.VAT_TYPE,
        setter: this.setVATCode,
        service: CurrencyService.getVATCodes.bind(null, this.props.company.selectedCompany.Key),
        filter: (VATCode, serachText) => this.filterVATCode(VATCode, serachText)
      }
    });
  }

  filterVATCode(VATCode, serachText) {
    if ((VATCode.ID && VATCode.ID.toString().indexOf(serachText) !== -1)
      || (VATCode.Name && VATCode.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return VATCode;
    } else {
      return null;
    }
  }

  setVATCode(VatType) {
    this.setState({ productDetails: { ...this.state.productDetails, VatPercent: VatType.VatPercent, VatType, VatTypeID: VatType.ID } }, () => { this.calculateTradePrices(); });
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
  }

  roundPrice(value, decimals) {
    return Number(Math.round(Number.parseFloat(value + 'e' + decimals)) + 'e-' + decimals);
  }

  calculateDiscount(priceExVat, priceIncVat, numberOfItems, discountPercent) {
    return {
      discountExVat: this.roundPrice((numberOfItems * priceExVat * discountPercent) / 100, 4),
      discountIncVat: this.roundPrice((numberOfItems * priceIncVat * discountPercent) / 100, 4)
    };
  }

  calculatePriceIncVat(priceExVatCurrency, vatPercent) {
    if (vatPercent == null) {
      vatPercent = this.calculateVatPercentManually(this.state.productDetails);
    }
    return this.roundPrice((priceExVatCurrency * (100 + vatPercent)) / 100, 4);
  }

  calculateBaseCurrencyAmounts(priceExVatCurrency, priceIncVatCurrency, currencyExchangeRate) {
    let PriceExVat;
    let PriceIncVat;
    if (currencyExchangeRate !== 0) {
      PriceExVat = priceExVatCurrency * currencyExchangeRate;
      PriceIncVat = priceIncVatCurrency * currencyExchangeRate;
    }
    else {
      PriceExVat = priceExVatCurrency;
      PriceIncVat = priceIncVatCurrency;
    }
    return { PriceExVat, PriceIncVat };
  }

  calculateTradePrices() { // logic from https://github.com/unimicro/AppFrontend/blob/develop/src/app/components/sales/salesHelper/TradeItemHelper.ts
    const PriceExVatCurrency = this.state.productDetails.PriceExVatCurrency;
    const PriceIncVatCurrency = this.calculatePriceIncVat(PriceExVatCurrency, this.state.productDetails.VatPercent);
    const { PriceExVat, PriceIncVat } = this.calculateBaseCurrencyAmounts(PriceExVatCurrency, PriceIncVatCurrency, this.state.productDetails.CurrencyExchangeRate);
    const { discountExVat, discountIncVat } = this.calculateDiscount(PriceExVat, PriceIncVat, this.state.productDetails.NumberOfItems, this.state.productDetails.DiscountPercent);
    const Discount = discountExVat;
    const SumTotalExVat = (this.state.productDetails.NumberOfItems * PriceExVat) - discountExVat;
    const SumTotalIncVat = (this.state.productDetails.NumberOfItems * PriceIncVat) - discountIncVat;
    const SumVat = (SumTotalIncVat - SumTotalExVat) || 0;
    const discountExVatCurrency = discountExVat / this.state.productDetails.CurrencyExchangeRate;
    const discountIncVatCurrency = discountIncVat / this.state.productDetails.CurrencyExchangeRate;
    const DiscountCurrency = discountExVatCurrency || 0;
    const SumTotalExVatCurrency = (this.state.productDetails.NumberOfItems * PriceExVatCurrency) - discountExVatCurrency;
    const SumTotalIncVatCurrency = (this.state.productDetails.NumberOfItems * PriceIncVatCurrency) - discountIncVatCurrency;
    const SumVatCurrency = (SumTotalIncVatCurrency - SumTotalExVatCurrency) || 0;
    this.setState({
      productDetails: {
        ...this.state.productDetails,
        SumVatCurrency,
        SumTotalIncVatCurrency,
        SumTotalExVatCurrency,
        DiscountCurrency,
        SumVat,
        SumTotalIncVat,
        SumTotalExVat,
        Discount,
        PriceExVat,
        PriceIncVat,
        PriceIncVatCurrency,
        PriceExVatCurrency,
        Sum: FormatNumber(SumTotalIncVatCurrency),
        PriceIncVatCurrencyDisplay: FormatNumber(PriceIncVatCurrency)
      },
      errors: {
        PriceExVatCurrency: null,
        PriceIncVatCurrency: null,
        Unit: null,
        DiscountPercent: null,
        NumberOfItems: null,
        Sum: null,
      }
    });
    return SumTotalIncVatCurrency;
  }

  setSpecialDiscountForCustomer() {
    const SumTotalIncVatCurrency = DeFormatNumber(this.state.productDetails.Sum);
    if ((SumTotalIncVatCurrency !== false) && !isNaN(this.state.productDetails.NumberOfItems)) {
      const Sum = FormatNumber(SumTotalIncVatCurrency);
      let DiscountPercent = this.calculateDiscountReverse(SumTotalIncVatCurrency, this.state.productDetails.NumberOfItems, this.state.productDetails.PriceIncVatCurrency, this.state.productDetails.CurrencyExchangeRate, this.state.productDetails.PriceIncVat);
      DiscountPercent = this.roundPrice(DiscountPercent, 4);
      const DiscountPercentDisplay = FormatNumber(DiscountPercent);
      this.setState({ productDetails: { ...this.state.productDetails, DiscountPercent, DiscountPercentDisplay, Sum } }, () => {
        this.calculateTradePrices();
      });
    }
    else {
      if (this.state.productDetails.Sum == '') {
        this.resetData('Sum');
      } else {
        this.setState({ errors: { ...this.state.errors, Sum: i18n.t('AddNewQuoteItem.index.sumFormatError') } });
      }
    }
  }

  calculateDiscountReverse(SumTotalIncVatCurrency, NumberOfItems, PriceIncVatCurrency, CurrencyExchangeRate, PriceIncVat) {
    const discountIncVatCurrency = (NumberOfItems * PriceIncVatCurrency) - SumTotalIncVatCurrency;
    const discountIncVat = discountIncVatCurrency * CurrencyExchangeRate;
    const discount = NumberOfItems === 0 || PriceIncVat === 0 ? 0 : (discountIncVat * 100) / (NumberOfItems * PriceIncVat);
    return discount;
  }

  calculateVatPercentManually(item) {
    if (item.PriceExVat === 0) {
      return 0;
    }
    else {
      return this.roundPrice(100 * ((item.PriceIncVat - item.PriceExVat) / item.PriceExVat), 2);
    }
  }

  handleProductErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewQuoteItem.index.somethingWrong')) {
    this.setState({ isLoading: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
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

  handlePlaceHolder(key = '') {
    this.scrollToBottom();
    if (key.trim() == "PriceExVatCurrencyDisplay") {
      if (this.state.productDetails.PriceExVatCurrencyDisplay.toString() == this.state.localizedZero) {
        this.setState({ productDetails: { ...this.state.productDetails, PriceExVatCurrencyDisplay: '' } });
      }
    }
    else if (key.trim() == "PriceIncVatCurrencyDisplay") {
      if (this.state.productDetails.PriceIncVatCurrencyDisplay.toString() == this.state.localizedZero) {
        this.setState({ productDetails: { ...this.state.productDetails, PriceIncVatCurrencyDisplay: '' } });
      }
    }
    else if (key.trim() == "DiscountPercentDisplay") {
      if (this.state.productDetails.DiscountPercentDisplay.toString() == this.state.localizedZero) {
        this.setState({ productDetails: { ...this.state.productDetails, DiscountPercentDisplay: '' } });
      }
    }
    else if (key.trim() == "Sum") {
      if (this.state.productDetails.Sum.toString() == this.state.localizedZero) {
        this.setState({ productDetails: { ...this.state.productDetails, Sum: '' } });
      }
    }
  }
  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} loaderPosition={'nav_tabs'} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
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
            <Text>{`${this.props.navigation.state.params.edit ? i18n.t('AddNewQuoteItem.index.updatingItem') : i18n.t('AddNewQuoteItem.index.savingItem')} ...`}</Text>
          </View>
        </Animated.View>

        <ScrollView keyboardDismissMode={'interactive'} key={'scrollView'} ref={ref => this._scrollview = ref} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <ImageCarousel
            images={this.state.productDetails.Images}
            viewModeOnly={true}
            noImageTitle={i18n.t('AddNewQuoteItem.index.noImages')}
            getImageURI={image => getImageLink(image.StorageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true, 400, 600)}
          />
          <View style={styles.spacer} />
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.SKU')}
              placeHolder={'SKU'}
              isKeyboardInput={true}
              editable={false}
              value={this.state.productDetails.ProductID ? this.state.productDetails.ProductID.toString() : ''}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.product')}
              placeHolder={i18n.t('AddNewQuoteItem.index.productName')}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, ItemText: text } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.productDetails.ItemText}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.number')}
              placeHolder={'0'}
              isKeyboardInput={true}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, NumberOfItemsDisplay: text }, errors: { ...this.state.errors, NumberOfItems: null } })}
              onBlur={this.onNumberChange}
              keyboardType={'numeric'}
              onFocus={this.scrollToBottom}
              value={this.state.productDetails.NumberOfItemsDisplay ? this.state.productDetails.NumberOfItemsDisplay.toString() : ''}
              error={this.state.errors.NumberOfItems}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.unit')}
              placeHolder={'Mth.'}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, Unit: text }, errors: { ...this.state.errors, Unit: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.productDetails.Unit}
              error={this.state.errors.Unit}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.price') + ` (${this.state.productDetails.CurrencyCode.Code})`}
              placeHolder={'0.00'}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, PriceExVatCurrencyDisplay: text }, errors: { ...this.state.errors, PriceExVatCurrency: null } })}
              onBlur={this.onPriceChange}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onFocus={() => this.handlePlaceHolder('PriceExVatCurrencyDisplay')}
              value={this.state.productDetails.PriceExVatCurrencyDisplay ? this.state.productDetails.PriceExVatCurrencyDisplay.toString() : ''}
              error={this.state.errors.PriceExVatCurrency}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.priceIncVat') + ` (${this.state.productDetails.CurrencyCode.Code})`}
              placeHolder={'0.00'}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, PriceIncVatCurrencyDisplay: text }, errors: { ...this.state.errors, PriceIncVatCurrency: null } })}
              editable={true}
              onBlur={this.onPriceIncVatChange}
              onFocus={() => this.handlePlaceHolder('PriceIncVatCurrencyDisplay')}
              value={this.state.productDetails.PriceIncVatCurrencyDisplay ? this.state.productDetails.PriceIncVatCurrencyDisplay.toString() : ''}
              error={this.state.errors.PriceIncVatCurrency}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.vatCode')}
              placeHolder={''}
              isKeyboardInput={false}
              onPress={this.selectVatCode}
              value={`${this.state.productDetails.VatType.Name} ${this.state.productDetails.VatPercent || this.state.productDetails.VatPercent === 0 ? this.state.productDetails.VatPercent : this.calculateVatPercentManually(this.state.productDetails)}%`}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.discount') + ' %'}
              placeHolder={'0%'}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, DiscountPercentDisplay: text }, errors: { ...this.state.errors, DiscountPercent: null } })}
              onBlur={this.onDiscountChange}
              isKeyboardInput={true}
              keyboardType={'numeric'}
              onFocus={() => this.handlePlaceHolder('DiscountPercentDisplay')}
              value={this.state.productDetails.DiscountPercentDisplay ? this.state.productDetails.DiscountPercentDisplay.toString() : ''}
              error={this.state.errors.DiscountPercent}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewQuoteItem.index.sum') + ` (${this.state.productDetails.CurrencyCode.Code})`}
              placeHolder={'0.00'}
              isKeyboardInput={true}
              editable={true}
              keyboardType={'numeric'}
              onBlur={this.setSpecialDiscountForCustomer}
              onChangeText={text => this.setState({ productDetails: { ...this.state.productDetails, Sum: text }, errors: { ...this.state.errors, Sum: null } })}
              onFocus={() => this.handlePlaceHolder('Sum')}
              value={this.state.productDetails.Sum ? this.state.productDetails.Sum.toString() : ''}
              error={this.state.errors.Sum}
            />
            <View style={styles.bottomSpacer} />
          </View>
          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewQuoteItem);

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
  infoContainer: {
    justifyContent: 'space-around',
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    height: 15,
  },
  bottomSpacer: {
    height: 80,
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
