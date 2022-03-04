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

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ProductService from '../../services/ProductService';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import ImageCarousel from '../../components/ImageCarousel';
import { createGuid, getImageLink } from '../../helpers/APIUtil';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { addTempImages, removeTempImage, clearTempImages } from '../../actions/addNewProductActions';
import { EntityType } from '../../constants/EntityTypes';
import UploadService from '../../services/UploadService';
import FileService from '../../services/FileService';
import CurrencyService from '../../services/CurrencyService';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { FormatNumber, DeFormatNumber } from '../../helpers/NumberFormatUtil';

const WIDTH: number = Dimensions.get('window').width;

class AddNewProduct extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.isEditMode ? i18n.t('AddNewProduct.index.editProduct') : i18n.t('AddNewProduct.index.addNewProduct'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleUpload()} text={navigation.state.params.isEditMode ? i18n.t('AddNewProduct.index.save') : i18n.t('AddNewProduct.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.goBack(); navigation.state.params.clearTempImages(); }} text={i18n.t('AddNewProduct.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      productDetails: {
        Name: '',
        PriceExVat: 0,
        Unit: '',
        PartName: '',
        Images: [],
        PriceExVatDisplay: FormatNumber(0),
        VatType: {
          ID: null,
          Name: '',
          VatPercent: 0
        },
        VatTyps: []
      },
      vatTypeDisplay: '',
      isPartNameEditable: false,
      moveAnimation: new Animated.Value(0),
      errors: {
        PriceExVat: '',
      },
      isUploading: false,
      uploadingFileStatus: '',
      didImageUploadFail: false,
      productID: null,
      DeletedImages: [],
      localizedZero: FormatNumber(0),
    };

    this.editProduct = this.editProduct.bind(this);
    this.createNewProduct = this.createNewProduct.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.addImages = this.addImages.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.onDeleteTap = this.onDeleteTap.bind(this);
    this.deleteExsistingImageFromState = this.deleteExsistingImageFromState.bind(this);
    this.onPriceBlur = this.onPriceBlur.bind(this);
    this.selectVatCode = this.selectVatCode.bind(this);
    this.setVATCode = this.setVATCode.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams({ handleUpload: this.handleUpload, disableActionButton: false, clearTempImages: this.props.clearTempImages });
    this.props.navigation.state.params.isEditMode ? this.setEditDetails() : this.setCreateNewProductDetails();
  }
  componentDidMount() {
    this.setState({ vatTypeDisplay: this.props.navigation.state.params.vatTypeDisplay })
  }

  setEditDetails() {
    this.props.navigation.state.params.product ? this.setState({ productDetails: { ...this.props.navigation.state.params.product, PriceExVatDisplay: FormatNumber(this.props.navigation.state.params.product.PriceExVat) }, productID: this.props.navigation.state.params.productID }) : null;
  }

  setCreateNewProductDetails() {
    this.setState({ isLookingProductNumber: true });
    ProductService.getPartNameSuggestion( this.props.company.selectedCompany.Key)
      .then((response) => {
        this.setState({ isLookingProductNumber: false, isPartNameEditable: true, productDetails: { ...this.state.productDetails, PartName: response.data.PartNameSuggestion } });
      })
      .catch(() => {
        this.setState({ isPartNameEditable: true, isLookingProductNumber: false });
      });
  }

  isValid() {
    const errors = {};
    if (!this.state.productDetails.Name) {
      errors.Name = i18n.t('AddNewProduct.index.noName');
    }
    if (!this.state.productDetails.PartName) {
      errors.PartName = i18n.t('AddNewProduct.index.noPartName');
    }
    if (!this.state.productDetails.PriceExVatDisplay && DeFormatNumber(this.state.productDetails.PriceExVatDisplay) !== 0) {
      errors.PriceExVat = i18n.t('AddNewProduct.index.noPrice');
    }
    if (this.state.productDetails.PriceExVatDisplay && DeFormatNumber(this.state.productDetails.PriceExVatDisplay) === false) {
      errors.PriceExVat = i18n.t('AddNewProduct.index.invalidPrice');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  addImages(data) {
    let newImagesList = [];
    if (Array.isArray(data)) {
      data.forEach(item => newImagesList.push(item));
    } else {
      newImagesList.push(data);
    }
    this.props.addTempImages(newImagesList);
  }

  handleUpload() {
    Keyboard.dismiss();
    setTimeout(() => {
      if (!this.state.isUploading && this.isValid()) {
        this.setState({ isUploading: true });
        if (this.props.navigation.state.params.navigateFrom != null) {
          this.createNewProduct();

        }
        else {
          this.props.navigation.state.params.isEditMode ? this.editProduct() : this.createNewProduct();
        }
      } else {
        this.scrollToBottom();
      }
    }, 100); // use setTimeout to ensure onBlur method is triggered after keyboard dismiss and calculations are done before uploading
  }

  async uploadImages(postUploadFunction = () => { }) {
    const tempImages = this.props.newProduct.tempImages;
    const deletedImages = this.state.DeletedImages.slice();
    try {
      if (deletedImages.length !== 0) {
        for (let fileIndex in deletedImages) {
          await FileService.deleteFile(
            deletedImages[fileIndex].ID,
            this.props.company.selectedCompany.Key);
          this.setState({ DeletedImages: deletedImages.filter(function (image) { return image.ID != deletedImages[fileIndex].ID }) });
        }
        this.setState({ DeletedImages: [] });
      }
      if (tempImages.length !== 0) {
        for (let imgIndex in tempImages) {
          this.setState({ uploadingFileStatus: `${i18n.t('AddNewProduct.index.image')} ${Number(imgIndex) + 1} ${i18n.t('AddNewInvoice.index.outOf')} ${tempImages.length}` });
          await UploadService.uploadProductImages(
            this.state.productID,
            imgIndex,
            tempImages[imgIndex],
            this.props.token.accessToken,
            this.props.company.selectedCompany.Key);

          this.props.removeTempImage(tempImages[imgIndex]);
        }
        this.setState({ uploadingFileStatus: '', isUploading: false });
        this.props.clearTempImages();
      }
      this.props.navigation.setParams({ disableActionButton: false });
      this.startAnimation(true);
      postUploadFunction();
    } catch (error) {
      this.startAnimation(true);
      this.setState({ didImageUploadFail: true, isUploading: false });
      this.props.navigation.setParams({ disableActionButton: false });
      this.handleProductErrors(error.problem, this.handleUpload, i18n.t('AddNewProduct.index.imageError'));
    }
  }

  onDeleteTap(deletedImage) {
    if (deletedImage.hasOwnProperty('StorageReference')) { //to identify if a image is newly added or already exsisting
      this.deleteExsistingImageFromState(deletedImage);
    }
    else {
      this.props.removeTempImage(deletedImage);
    }
  }

  onPriceBlur() {
    const PriceExVat = DeFormatNumber(this.state.productDetails.PriceExVatDisplay);
    if (PriceExVat !== false) {
      const PriceExVatDisplay = FormatNumber(PriceExVat);
      this.setState({ productDetails: { ...this.state.productDetails, PriceExVat, PriceExVatDisplay } });
    }
    else {
      this.setState({ errors: { ...this.state.errors, PriceExVat: this.state.productDetails.PriceExVatDisplay ? i18n.t('AddNewProduct.index.invalidPrice') : i18n.t('AddNewProduct.index.noPrice') } });
    }
  }

  deleteExsistingImageFromState(file) {
    let newImageArr = this.state.productDetails.Images.filter(function (image) { return image.ID != file.ID; });
    this.setState({ productDetails: { ...this.state.productDetails, Images: [...newImageArr] }, DeletedImages: [...this.state.DeletedImages, file] });
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

  editProduct(caller) {
    const _postEditProductFunction = () => {
      this.props.navigation.state.params.refreshProductDetails ? this.props.navigation.state.params.refreshProductDetails() : null;
      this.props.updateProductList();
      this.props.navigation.goBack();
    }
    const product = {
      Name: this.state.productDetails.Name,
      PriceExVat: DeFormatNumber(this.state.productDetails.PriceExVatDisplay),
      Unit: this.state.productDetails.Unit,
      PartName: this.state.productDetails.PartName,
      ID: this.props.navigation.state.params.productID,
      VatTypeID: this.state.productDetails.VatType.ID,
    };
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    ProductService.editProduct(this.props.navigation.state.params.productID, product,  this.props.company.selectedCompany.Key)
      .then((response) => {
        this.uploadImages(_postEditProductFunction);
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Product' });
      })
      .catch((error) => {
        this.startAnimation(true);
        this.setState({ isUploading: false });
        this.props.navigation.setParams({ disableActionButton: false });
        this.handleProductErrors(error.problem, caller, i18n.t('AddNewProduct.index.editProductError'));
      });
  }

  createNewProduct(caller) {
    const _navigateToProductDetails = () => {
      this.props.resetToProductDetails({
        productID: this.state.productID,
        EntityType: EntityType.PRODUCT,
        CompanyKey:  this.props.company.selectedCompany.Key,
      });
    }


    const product = {
      Name: this.state.productDetails.Name,
      PriceExVat: DeFormatNumber(this.state.productDetails.PriceExVatDisplay),
      Unit: this.state.productDetails.Unit,
      PartName: this.state.productDetails.PartName,
      CostPrice: DeFormatNumber(this.state.productDetails.PriceExVatDisplay),
      VatTypeID: this.state.productDetails.VatType.ID,
      _createguid: createGuid(),
    };
    this.props.navigation.setParams({ disableActionButton: true });
    this.startAnimation();
    if (!this.state.didImageUploadFail) {
      ProductService.createProduct(product,  this.props.company.selectedCompany.Key)
        .then((response) => {
          const _navigateToDetailsScreen = () => {
            this.props.navigation.state.params.customerSetter(response.data)
          }

          if (this.props.navigation.state.params.navigateFrom == null) {
            this.setState({ productID: response.data.ID });
            this.uploadImages(_navigateToProductDetails);
          }
          else {
            this.setState({ productID: response.data.ID });
            this.uploadImages(_navigateToDetailsScreen);
          }
          Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Product' });
        })
        .catch((error) => {
          if (error.data &&
            error.data._validationResults &&
            error.data._validationResults[Object.keys(error.data._validationResults)[0]].length > 0 &&
            error.data._validationResults[Object.keys(error.data._validationResults)[0]][0].ComplexValidationRule &&
            error.data._validationResults[Object.keys(error.data._validationResults)[0]][0].ComplexValidationRule.ValidationCode) {
            if (error.data._validationResults[Object.keys(error.data._validationResults)[0]][0].ComplexValidationRule.ValidationCode === 115001) {
              this.handleProductErrors(error.problem, null, i18n.t('AddNewProduct.index.uniquePartNumberError'));
              this.setState({ errors: { ...this.state.errors, PartName: i18n.t('AddNewProduct.index.uniquePartNumberError') } });
              this.scrollToBottom();
            } else {
              this.handleProductErrors(error.problem, caller, i18n.t('AddNewProduct.index.addProductError'));
            }
          } else {
            this.handleProductErrors(error.problem, caller, i18n.t('AddNewProduct.index.addProductError'));
          }
          this.startAnimation(true);
          this.props.navigation.setParams({ disableActionButton: false });
          this.setState({ isUploading: false });
        });
    }
    else {
      this.uploadImages();
    }
  }

  handleProductErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewProduct.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  handlePlaceHolder() {
    this.scrollToBottom();
    if (this.state.productDetails.PriceExVatDisplay == this.state.localizedZero) {
      this.setState({ productDetails: { ...this.state.productDetails, PriceExVatDisplay: "" } });
    }
  }

  selectVatCode() {
    Keyboard.dismiss();
    this.setState({ errors: { ...this.state.errors, Supplier: null } });
    this.props.navigation.navigate('LookupVatView', {
      data: {
        title: i18n.t('AddNewOrderItem.index.selectVatType'),
        searchCriteria: i18n.t('AddNewOrderItem.index.vatType'),
        entityType: EntityType.VAT_TYPE,
        setter: this.setVATCode,
        service: CurrencyService.getVATCodes.bind(null, this.props.company.selectedCompany.Key),
        filter: (VATCode, serachText) => this.filterVATCode(VATCode, serachText)
      }
    });
  }

  setVATCode(VatType) {
    this.setState({ productDetails: { ...this.state.productDetails, VatType: { Name: VatType.Name, VatPercent: VatType.VatPercent, ID: VatType.ID } }, vatTypeDisplay: `${VatType.Name} ${VatType.VatPercent}%` });
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
            <Text>{`${this.props.navigation.state.params.isEditMode ? `${i18n.t('AddNewProduct.index.updatingProduct')} ...` : `${i18n.t('AddNewProduct.index.addingProduct')} ...`}${this.state.uploadingFileStatus ? `\n${i18n.t('AddNewProduct.index.uploading')} ${this.state.uploadingFileStatus}` : ''}`}</Text>
          </View>
        </Animated.View>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View>
            <ImageCarousel
              images={[...this.state.productDetails.Images, ...this.props.newProduct.tempImages]}
              viewModeOnly={false}
              noImageTitle={i18n.t('AddNewProduct.index.noImages')}
              getImageURI={(image) => image.hasOwnProperty('StorageReference') ? getImageLink(image.StorageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true, 400, 600) : { uri: (image.path || image) }}
              onImageAdd={this.addImages}
              navigateToCamera={this.props.navigateToCamera}
              onDelete={this.onDeleteTap}
            />
            <View style={styles.detailsContainer} >
              <InlineValidationInputField
                title={i18n.t('AddNewProduct.index.product')}
                placeHolder={i18n.t('AddNewProduct.index.notSpecified')}
                isKeyboardInput={true}
                value={this.state.productDetails.Name ? this.state.productDetails.Name : ''}
                onChangeText={Name => this.setState({ productDetails: { ...this.state.productDetails, Name }, errors: { ...this.state.errors, Name: '' } })}
                error={this.state.errors.Name}
                onFocus={this.scrollToBottom}
              />
              <InlineValidationInputField
                title={i18n.t('AddNewProduct.index.sku')}
                placeHolder={i18n.t('AddNewProduct.index.notSpecified')}
                isKeyboardInput={true}
                editable={this.state.isPartNameEditable}
                value={this.state.productDetails.PartName ? this.state.productDetails.PartName : ''}
                onChangeText={PartName => this.setState({ productDetails: { ...this.state.productDetails, PartName }, errors: { ...this.state.errors, PartName: '' } })}
                error={this.state.errors.PartName}
                onFocus={this.scrollToBottom}
                showLoadingSpinner={this.state.isLookingProductNumber}
              />
              <InlineValidationInputField
                title={i18n.t('AddNewProduct.index.unit')}
                placeHolder={i18n.t('AddNewProduct.index.notSpecified')}
                isKeyboardInput={true}
                value={this.state.productDetails.Unit ? this.state.productDetails.Unit : ''}
                onChangeText={Unit => this.setState({ productDetails: { ...this.state.productDetails, Unit } })}
                onFocus={this.scrollToBottom}
              />
              <InlineValidationInputField
                title={i18n.t('AddNewProduct.index.price')}
                placeHolder={i18n.t('AddNewProduct.index.notSpecified')}
                isKeyboardInput={true}
                keyboardType={'numeric'}
                value={this.state.productDetails.PriceExVatDisplay ? this.state.productDetails.PriceExVatDisplay.toString() : ''}
                onChangeText={PriceExVatDisplay => this.setState({ productDetails: { ...this.state.productDetails, PriceExVatDisplay }, errors: { ...this.state.errors, PriceExVat: '' } })}
                error={this.state.errors.PriceExVat}
                onFocus={() => this.handlePlaceHolder()}
                onBlur={this.onPriceBlur}
              />
              <InlineValidationInputField
                title={i18n.t('AddNewProduct.index.vatCode')}
                placeHolder={i18n.t('AddNewProduct.index.notSpecified')}
                isKeyboardInput={false}
                onPress={this.selectVatCode}
                value={this.state.vatTypeDisplay}
              />
            </View>
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
    newProduct: state.newProduct,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch, { navigation }) => {
  return {
    updateProductList: () => dispatch({ type: 'UPDATE_PRODUCTS_LAST_EDITED_TIMESTAMP' }),
    navigateToCamera: () => dispatch(NavigationActions.navigate({ routeName: 'CameraView', params: { showImgGallery: false, showSkip: false, onImageAdd: (images) => dispatch(addTempImages(images)), title: navigation.state.params.isEditMode ? i18n.t('AddNewProduct.index.editProduct') : i18n.t('AddNewProduct.index.addNewProduct') } })),
    addTempImages: images => dispatch(addTempImages(images)),
    removeTempImage: image => dispatch(removeTempImage(image)),
    clearTempImages: () => dispatch(clearTempImages()),
    resetToProductDetails: productParams =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'ProductList' }),
          NavigationActions.navigate({ routeName: 'ProductDetails', params: { ...productParams } })
        ]
      })),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewProduct);

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingVertical: 9,
    paddingHorizontal: 5,
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    paddingTop: 10,
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  mainText: {
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  editButton: {
    height: 30,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 16,
  },
  amountSmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 15,
  },
  spacer: {
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
