// @flow
import React, { Component } from 'react';
import {
  View,
  RefreshControl,
  FlatList,
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
import CustomerService from '../../services/CustomerService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { CustomerListRow } from './customerListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import { clearAddressList } from '../../actions/addressListActions';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class CustomerList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('CustomerList.index.customerList'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
          {
            title: i18n.t('CustomerList.index.searchCustomers'),
            entityType: EntityType.CUSTOMER,
            placeholder: i18n.t('CustomerList.index.searchCustomerPlaceholder'),
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
      customers: [],
      pageSize: 10,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ALL) || PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_CUSTOMER), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshCustomers = this.refreshCustomers.bind(this);
    this.onCustomerSelect = this.onCustomerSelect.bind(this);
    this.fetchInitialCustomers = this.fetchInitialCustomers.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialCustomers() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.customerList.lastEditedTime != newProps.customerList.lastEditedTime) {
      this.refreshCustomers();
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

  onCustomerSelect(customer) {
    const _onCustomerSelect = () => {
      this.props.navigation.navigate('CustomerDetails', {
        customerID: customer.ID,
        EntityType: EntityType.CUSTOMER,
        CompanyKey: this.props.company.selectedCompany.Key,
      });
    };
    Platform.OS === 'ios' ? _onCustomerSelect() : setTimeout(_onCustomerSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialCustomers() {
    this.setState({ isLoading: true });
    this.fetchCustomers(this.fetchInitialCustomers);
  }

  fetchCustomers(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    CustomerService.getCustomers(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, customers: [...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleCustomerFetchErrors(response.problem, caller, i18n.t('CustomerList.index.fetchCustomerError'));
        }
      })
      .catch((error) => {
        this.handleCustomerFetchErrors(error.problem, caller, i18n.t('CustomerList.index.fetchCustomerError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    CustomerService.getCustomers(companyKey, this.state.customers.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, customers: [...this.state.customers, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleCustomerFetchErrors(response.problem, caller, i18n.t('CustomerList.index.fetchCustomerError'));
        }
      })
      .catch((error) => {
        this.handleCustomerFetchErrors(error.problem, caller, i18n.t('CustomerList.index.fetchCustomerError'));
      });
  }

  handleCustomerFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('CustomerList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshCustomers() {
    this.setState({ isRefreshing: true });
    this.fetchCustomers(this.refreshCustomers);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-people-outline" size={75} color={theme.SECONDARY_TEXT_COLOR} />
        <Text style={styles.placeholderText}>{i18n.t('CustomerList.index.noCustomers')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('CustomerList.index.noAccessToCustomers')}</Text>
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
              data={this.state.customers}
              renderItem={props => <CustomerListRow {...props} onSelect={this.onCustomerSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshCustomers}
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

            {!this.state.isLoading && this.state.customers.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('CustomerList.index.addNewCustomer')} buttonStyle={styles.addOrderButton} onPress={() => {
                this.props.navigation.navigate('SearchView', {
                  navigation: this.props.navigation, data: {
                    title: i18n.t('CustomerList.index.searchCustomers'),
                    entityType: EntityType.PHONEBOOK_SEARCH,
                    origine: EntityType.CUSTOMER,
                    placeholder: i18n.t('CustomerList.index.searchCustomerPlaceholder'),
                  }
                });
                this.props.clearAddressList();
              }} />
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
    customerList: state.customerList,
    company: state.company,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    clearAddressList: () => dispatch(clearAddressList()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CustomerList);

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
    alignSelf: 'center',
    opacity: 0.8,
  },
  placeholderText: {
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
