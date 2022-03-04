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
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { CustomerInvoiceListRow } from './CustomerInvoiceListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from "../../helpers/UIHelper";
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class CustomerInvoiceList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('CustomerInvoiceList.index.invoiceList'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
        {
          title: i18n.t('CustomerInvoiceList.index.searchCustomerInvoices'),
          entityType: EntityType.CUSTOMER_INVOICE
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
      customerInvoices: [],
      pageSize: 20,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ALL) || PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_INVOICES), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshCustomerInvoiceList = this.refreshCustomerInvoiceList.bind(this);
    this.onCustomerInvoiceSelect = this.onCustomerInvoiceSelect.bind(this);
    this.fetchInitialCustomerInvoices = this.fetchInitialCustomerInvoices.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialCustomerInvoices() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.customerInvoiceList.lastEditedTime != newProps.customerInvoiceList.lastEditedTime) {
      this.refreshCustomerInvoiceList();
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

  onCustomerInvoiceSelect(invoice) {
    const _onOrderSelect = () => {
      this.props.navigation.navigate('CustomerInvoiceDetails', {
        customerInvoiceID: invoice.ID,
        EntityType: 'customerinvoice',
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

  fetchInitialCustomerInvoices() {
    this.setState({ isLoading: true });
    this.fetchCustomerInvoiceList(this.fetchInitialCustomerInvoices);
  }

  fetchCustomerInvoiceList(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    CustomerInvoiceService.getCustomerInvoiceList(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, customerInvoices: [...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleCustomerInvoiceListFetchErrors(response.problem, caller, i18n.t('CustomerInvoiceList.index.fetchInvoiceError'));
        }
      })
      .catch((error) => {
        this.handleCustomerInvoiceListFetchErrors(error.problem, caller, i18n.t('CustomerInvoiceList.index.fetchInvoiceError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    CustomerInvoiceService.getCustomerInvoiceList(companyKey, this.state.customerInvoices.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, customerInvoices: [...this.state.customerInvoices, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleCustomerInvoiceListFetchErrors(response.problem, caller, i18n.t('CustomerInvoiceList.index.fetchInvoiceError'));
        }
      })
      .catch((error) => {
        this.handleCustomerInvoiceListFetchErrors(error.problem, caller, i18n.t('CustomerInvoiceList.index.fetchInvoiceError'));
      });
  }

  handleCustomerInvoiceListFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('CustomerInvoiceList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshCustomerInvoiceList() {
    this.setState({ isRefreshing: true });
    this.fetchCustomerInvoiceList(this.refreshCustomerInvoiceList);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Sales/noOrdersIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('CustomerInvoiceList.index.noInvoices')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('CustomerInvoiceList.index.noAccessToSales')}</Text>
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
              data={this.state.customerInvoices}
              renderItem={props => <CustomerInvoiceListRow {...props} onSelect={this.onCustomerInvoiceSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshCustomerInvoiceList}
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

            {!this.state.isLoading && this.state.customerInvoices.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('CustomerInvoiceList.index.addNewCustomerInvoice')} buttonStyle={styles.addOrderButton} onPress={() => this.props.navigation.navigate('AddNewCustomerInvoice', { isEdit: false })} />
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
    customerInvoiceList: state.customerInvoiceList,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(CustomerInvoiceList);

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
