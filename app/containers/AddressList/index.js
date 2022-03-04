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
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import CustomerService from '../../services/CustomerService';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { AddressListRow } from './AddressListRow';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { HeaderTextButton } from '../../components/HeaderTextButton';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

class AddressList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('AddressList.index.addedAddresses'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.navigate('AddNewAddress', { isEditMode: false })} text={i18n.t('AddressList.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { navigation.goBack(); }} text={i18n.t('AddressList.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      addresses: [],
      pageSize: 10,
      hasNextPage: false,
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshAddresses = this.refreshAddresses.bind(this);
    this.onAddressSelect = this.onAddressSelect.bind(this);
    this.fetchInitialAddressesForCustomer = this.fetchInitialAddressesForCustomer.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.onAddressEdit = this.onAddressEdit.bind(this);
    this.onAddressClear = this.onAddressClear.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ disableActionButton: false });
    this.fetchInitialAddressesForCustomer();
  }

  onAddressSelect(address, index) {
    if (this.props.navigation.state.params.data && this.props.navigation.state.params.data.setAddress) {
      this.props.navigation.state.params.data.setAddress(address, index);
      this.props.navigation.goBack();
    }
  }

  onAddressEdit(item, index) {
    this.props.navigation.navigate('AddNewAddress', {
      isEditMode: true,
      address: item,
      index,
    });
  }

  onAddressClear(address, index) {
    if (this.props.navigation.state.params.data && this.props.navigation.state.params.data.clearAddress) {
      this.props.navigation.state.params.data.clearAddress(address, index);
      this.props.navigation.goBack();
    }
  }

  fetchInitialAddressesForCustomer() {
    this.setState({ isLoading: true });
    this.fetchAddresses(this.fetchInitialAddressesForCustomer);
  }

  fetchAddresses(caller) {
    if (this.props.navigation.state.params.data && this.props.navigation.state.params.data.customerID) {
      CustomerService.getCustomerAddresses(this.props.navigation.state.params.data.customerID, this.props.company.selectedCompany.Key)
        .then((response) => {
          if (response.ok && response.data, response.data.Info && response.data.Info.Addresses) {
            this.setState({ isLoading: false, isRefreshing: false, addresses: [...response.data.Info.Addresses] });
          } else {
            this.handleAddressFetchErrors(response.problem, caller, i18n.t('AddressList.index.fetchAddressError'));
          }
        })
        .catch((error) => {
          this.handleAddressFetchErrors(error.problem, caller, i18n.t('AddressList.index.fetchAddressError'));
        });
    }
    else {
      this.setState({ isLoading: false, isRefreshing: false });
    }
  }

  handleAddressFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddressList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshAddresses() {
    this.setState({ isRefreshing: true });
    this.fetchAddresses(this.refreshAddresses);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-locate-outline" size={60} color={theme.SECONDARY_TEXT_COLOR} />
        <Text style={styles.placeholderText}>{i18n.t('AddressList.index.noAddresses')}</Text>
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
        <ListPaddingComponent height={10} />
      );
    }
  }

  renderSelectedAddress(selectedIndex) {
    return (
      <View>
        <Text style={styles.resultTitle}>
          {i18n.t('AddressList.index.yourCurrentSelection')}
        </Text>
        <AddressListRow item={{ ...this.props.addressList.addresses[selectedIndex], ID: 0 }} index={0} onPressAction={this.onAddressClear} actionName={i18n.t('AddressList.index.clear')} />
        <Text style={styles.resultTitle}>
          {i18n.t('AddressList.index.addedAddresses')}
        </Text>
      </View>
    );
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <View style={styles.container}>
          {this.props.navigation.state.params.data && this.props.navigation.state.params.data.selectedAddressArrayIndex != null ? this.renderSelectedAddress(this.props.navigation.state.params.data.selectedAddressArrayIndex) : null}
          <FlatList
            keyExtractor={(item, index) => item.ID || Math.random()}
            data={this.props.addressList.addresses}
            renderItem={props => <AddressListRow {...props} onSelect={this.onAddressSelect} onPressAction={this.onAddressEdit} />}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this.refreshAddresses}
                tintColor={theme.PRIMARY_COLOR}
              />
            }
            ListHeaderComponent={() => <ListPaddingComponent height={10} />}
            ListFooterComponent={this.renderFooter}
          />
          {!this.state.isLoading && this.props.addressList.addresses.length === 0 ? this.renderPlaceholder() : null}
        </View>
        {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    addressList: state.addressList,
  };
};

export default connect(
  mapStateToProps,
)(AddressList);

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
    height: 30,
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
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  resultTitle: {
    paddingTop: 15,
    paddingLeft: 15,
    fontSize: 16,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR
  },
  iphoneXSpace: {
    height: 50,
  }
});
