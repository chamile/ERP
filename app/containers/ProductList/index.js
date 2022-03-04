// @flow
import React, { Component } from 'react';
import {
  View,
  RefreshControl,
  FlatList,
  Image,
  Text,
  Dimensions,
  StyleSheet,
  Platform,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ProductService from '../../services/ProductService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ProductListRow } from './productListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from "../../helpers/UIHelper";
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class ProductList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('ProductList.index.title'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
        {
          title: i18n.t('ProductList.index.searchProducts'),
          entityType: EntityType.PRODUCT,
          placeholder: i18n.t('OrderDetails.index.searchProductByIdOrName'),
          showInstantResults: true,
        }
        }
        disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      products: [],
      pageSize: 20,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ALL) || PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_PRODUCTS), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshProducts = this.refreshProducts.bind(this);
    this.onProductSelect = this.onProductSelect.bind(this);
    this.fetchInitialProducts = this.fetchInitialProducts.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialProducts() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.productList.lastEditedTime != newProps.productList.lastEditedTime) {
      this.refreshProducts();
    }
  }

  handleNoPermission() {
    this.setState({ isLoading: false }, () => {
      InteractionManager.runAfterInteractions(() => {
        this.props.navigation.setParams({
          isActionButtonDisabled: true,
        });
      });
    });
  }

  onProductSelect(product) {
    const _onProductSelect = () => {
      this.props.navigation.navigate('ProductDetails', {
        productID: product.ID,
        EntityType: EntityType.PRODUCT,
        CompanyKey: this.props.company.selectedCompany.Key
      });
    };
    Platform.OS === 'ios' ? _onProductSelect() : setTimeout(_onProductSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialProducts() {
    this.setState({ isLoading: true });
    this.fetchProducts(this.fetchInitialProducts);
  }

  fetchProducts(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    ProductService.getProductList(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, products: response.data, hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleProductFetchErrors(response.problem, caller, i18n.t('ProductList.index.fetchProductError'));
        }
      })
      .catch((error) => {
        this.handleProductFetchErrors(error.problem, caller, i18n.t('ProductList.index.fetchProductError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    ProductService.getProductList(companyKey, this.state.products.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, products: [...this.state.products, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleProductFetchErrors(response.problem, caller, i18n.t('ProductList.index.fetchProductError'));
        }
      })
      .catch((error) => {
        this.handleProductFetchErrors(error.problem, caller, i18n.t('ProductList.index.fetchProductError'));
      });
  }

  handleProductFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ProductList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshProducts() {
    this.setState({ isRefreshing: true });
    this.fetchProducts(this.refreshProducts);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Sales/noOrdersIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('ProductList.index.noProducts')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('ProductList.index.noAccessToProducts')}</Text>
      </View>
    );
  }

  renderFooter() {
    if (this.state.hasNextPage) {
      return (
        <View style={styles.footerLoaderBox}>
          <ActivityIndicator
            animating={true}
            color="#0082C0"
            size="small"
          />
        </View>
      );
    }
    else {
      return (
        <ListPaddingComponent height={50} />
      );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        {this.state.hasPermissionToModule ?
          <View style={styles.container}>
            <FlatList
              keyExtractor={(item, index) => item.ID}
              data={this.state.products}
              renderItem={props => <ProductListRow {...props} onSelect={this.onProductSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshProducts}
                  tintColor={theme.PRIMARY_COLOR}
                />
              }
              ListHeaderComponent={() => <ListPaddingComponent height={20} />}
              ListFooterComponent={this.renderFooter}
              onEndReached={this.onEndReached}
              onEndReachedThreshold={0.3}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            />

            {!this.state.isLoading && this.state.products.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('ProductList.index.addNewProduct')} buttonStyle={styles.addOrderButton} onPress={() => this.props.navigation.navigate('AddNewProduct', { isEditMode: false, CompanyKey: this.props.company.selectedCompany.Key })} />
            </FloatingBottomContainer>
          </View>
          : this.renderPlaceholderWithNoPermission()}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    productList: state.productList,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(ProductList);

const styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  tabIconStyle: {
    width: 28,
    height: 28,
  },
  addOrderButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  container: {
    flex: 1,
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
