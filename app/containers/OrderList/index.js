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
import OrderService from '../../services/OrderService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { OrderListRow } from './orderListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from "../../helpers/UIHelper";
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class OrderList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('OrderList.index.orderList'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
        {
          title: i18n.t('OrderList.index.searchOrders'),
          entityType: EntityType.CUSTOMER_ORDER
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
      orders: [],
      pageSize: 20,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ALL) || PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ORDERS), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshOrders = this.refreshOrders.bind(this);
    this.onOrderSelect = this.onOrderSelect.bind(this);
    this.fetchInitialOrders = this.fetchInitialOrders.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialOrders() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.orderList.lastEditedTime != newProps.orderList.lastEditedTime) {
      this.refreshOrders();
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

  onOrderSelect(order) {
    const _onOrderSelect = () => {
      this.props.navigation.navigate('OrderDetails', {
        orderID: order.ID,
        EntityType: 'customerorder',
        CompanyKey: this.props.company.selectedCompany.Key,
      });
    };
    Platform.OS === 'ios' ? _onOrderSelect() : setTimeout(_onOrderSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialOrders() {
    this.setState({ isLoading: true });
    this.fetchOrders(this.fetchInitialOrders);
  }

  fetchOrders(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    OrderService.getOrders(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, orders: [...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleOrderFetchErrors(response.problem, caller, i18n.t('OrderList.index.fetchOrderError'));
        }
      })
      .catch((error) => {
        this.handleOrderFetchErrors(error.problem, caller, i18n.t('OrderList.index.fetchOrderError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    OrderService.getOrders(companyKey, this.state.orders.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, orders: [...this.state.orders, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleOrderFetchErrors(response.problem, caller, i18n.t('OrderList.index.fetchOrderError'));
        }
      })
      .catch((error) => {
        this.handleOrderFetchErrors(error.problem, caller, i18n.t('OrderList.index.fetchOrderError'));
      });
  }

  handleOrderFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('OrderList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshOrders() {
    this.setState({ isRefreshing: true });
    this.fetchOrders(this.refreshOrders);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Sales/noOrdersIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('OrderList.index.noOrders')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('OrderList.index.noAccessToSales')}</Text>
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
              keyExtractor={(item, index) => `${item.ID}`}
              data={this.state.orders}
              renderItem={props => <OrderListRow {...props} onSelect={this.onOrderSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshOrders}
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

            {!this.state.isLoading && this.state.orders.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('OrderList.index.addNewOrder')} buttonStyle={styles.addOrderButton} onPress={() => this.props.navigation.navigate('CreateOrder', { navigation: this.props.navigation, isEdit: false })} />
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
    orderList: state.orderList,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(OrderList);

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
