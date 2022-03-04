// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { connect } from 'react-redux';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ProductService from '../../services/ProductService';
import FileService from '../../services/FileService';
import CommentService from '../../services/CommentService';
import CurrencyService from '../../services/CurrencyService';
import i18n from '../../i18n/i18nConfig';
import GenericButton from '../../components/GenericButton';
import { getHeaderStyle } from '../../helpers/UIHelper';
import ImageCarousel from '../../components/ImageCarousel';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import { getImageLink } from '../../helpers/APIUtil';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { FormatNumber } from '../../helpers/NumberFormatUtil';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH: number = Dimensions.get('window').width;

class ProductDetails extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    return {
      title: i18n.t('ProductDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: <CommentsIcon count={navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.productID } })} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      vatTypeDisplay: '',
      productDetails: {
        Name: '',
        PriceExVat: 0,
        Unit: '',
        PartName: '',
        Images: [],
        VatType: {
          ID: null,
          Name: '',
          VatPercent: 0
        },

      },
      VatTypes: [],
    };

    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.fetchProductData = this.fetchProductData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.getVatCodes = this.getVatCodes.bind(this);
    this.getFortmatedVatType = this.getFortmatedVatType.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ updateComments: this.updateComments });
    this.fetchData();
    CommentService.getComments(this.props.navigation.state.params.productID, this.props.navigation.state.params.EntityType,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.props.navigation.setParams({ comments: response.data }); }
      })
      .catch(error => this.handleProductErrors(error.problem, caller, i18n.t('ProductDetails.index.commentsError')));

  }

  getVatCodes() {
    CurrencyService.getVATCodes(this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.setState({ VatTypes: [...response.data] }, this.getFortmatedVatType);
        }
      })
      .catch((error) => {
        throw error;
      });

  }

  updateComments(comments) {
    this.props.navigation.setParams({ comments });
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchProductData(this.fetchData);
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchProductData(this.refreshData);
  }

  fetchProductData(caller) {
    let productDetails = {};
    let vatType = {};
    ProductService.getProduct(this.props.navigation.state.params.productID,  this.props.company.selectedCompany.Key)
      .then(response => {
        if (response.ok) {
          productDetails.Name = response.data.Name ? response.data.Name : '';
          productDetails.PriceExVat = response.data.PriceExVat ? response.data.PriceExVat : 0;
          productDetails.Unit = response.data.Unit ? response.data.Unit : '';
          productDetails.PartName = response.data.PartName ? response.data.PartName : '';
          vatType.ID = response.data.VatTypeID ? response.data.VatTypeID : null;
          vatType.Name = response.data.VatType && response.data.VatType.Name ? response.data.VatType.Name : '';
          vatType.VatPercent = response.data.VatType && response.data.VatType.VatTypePercentages[0].VatPercent ? response.data.VatType.VatTypePercentages[0].VatPercent : 0;
          productDetails.VatType = vatType;
          return FileService.getFiles(this.props.navigation.state.params.productID, EntityType.PRODUCT,  this.props.company.selectedCompany.Key)
        }
      })
      .then(response => {
        productDetails.Images = response.data.length === 0 ? [] : response.data.map(image => { return { ID: image.ID, StorageReference: image.StorageReference } });
        this.setState({
          isLoading: false,
          isRefreshing: false,
          productDetails
        }, this.getVatCodes());
      })
      .catch(error => {
        this.handleProductErrors(error.problem, caller, i18n.t('ProductDetails.index.fetchProductDataError'));
      });
  }

  handleProductErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ProductDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  getFortmatedVatType() {
    let vatTypes = this.state.VatTypes;
    let vatTypeID = this.state.productDetails.VatType.ID;
    let data = ''
    vatTypes.forEach(vatItem => {
      if (vatItem.ID == vatTypeID) {
        data = `${vatItem.Name} ${vatItem.VatPercent}%`;
      }
    });
    this.setState({ ...this.state.productDetails, vatTypeDisplay: data });
  }
  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshData}
            />
          }
          scrollEventThrottle={200}
          onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
        >

          <View>
            <ImageCarousel
              images={this.state.productDetails.Images}
              viewModeOnly={true}
              noImageTitle={i18n.t('ProductDetails.index.noImages')}
              getImageURI={image => getImageLink(image.StorageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true, 400, 600)} />
            <View style={styles.detailsContainer} >
              <InlineValidationInputField
                title={i18n.t('ProductDetails.index.product')}
                placeHolder={i18n.t('ProductDetails.index.notSpecified')}
                isKeyboardInput={true}
                editable={false}
                value={this.state.productDetails.Name ? this.state.productDetails.Name : ''}
              />
              <InlineValidationInputField
                title={i18n.t('ProductDetails.index.sku')}
                placeHolder={i18n.t('ProductDetails.index.notSpecified')}
                isKeyboardInput={true}
                editable={false}
                value={this.state.productDetails.PartName ? this.state.productDetails.PartName : ''}
              />
              <InlineValidationInputField
                title={i18n.t('ProductDetails.index.unit')}
                placeHolder={i18n.t('ProductDetails.index.notSpecified')}
                isKeyboardInput={true}
                editable={false}
                value={this.state.productDetails.Unit ? this.state.productDetails.Unit : ''}
              />
              <InlineValidationInputField
                title={i18n.t('ProductDetails.index.price')}
                placeHolder={i18n.t('ProductDetails.index.notSpecified')}
                isKeyboardInput={true}
                editable={false}
                value={FormatNumber(this.state.productDetails.PriceExVat)}
              />
              <InlineValidationInputField
                title={i18n.t('ProductDetails.index.vatCode')}
                placeHolder={i18n.t('ProductDetails.index.notSpecified')}
                isKeyboardInput={true}
                editable={false}
                value={this.state.vatTypeDisplay}
              />

            </View>
          </View>

          <View style={styles.spacer} />

        </ScrollView>

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          <GenericButton
            text={i18n.t('ProductDetails.index.editProduct')}
            buttonStyle={styles.editButton}
            onPress={() => this.props.navigation.navigate('AddNewProduct', {
              isEditMode: true,
              productID: this.props.navigation.state.params.productID,
              CompanyKey:  this.props.company.selectedCompany.Key,
              product: this.state.productDetails,
              refreshProductDetails: this.refreshData,
              vatTypeDisplay: this.state.vatTypeDisplay,
            })}
          />
        </FloatingBottomContainer>
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
  return {
    updateProductList: () => dispatch({ type: 'UPDATE_PRODUCTS_LAST_EDITED_TIMESTAMP' })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductDetails);

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
  mainText: {
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  editButton: {
    height: 35,
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
  }
});
