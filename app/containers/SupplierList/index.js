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
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { SupplierListRow } from './SupplierListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import { clearAddressList } from '../../actions/addressListActions';
import SupplierService from '../../services/SupplierService';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class SupplierList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('SupplierList.index.supplierList'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
          {
            title: i18n.t('SupplierList.index.searchSuppliers'),
            entityType: EntityType.SUPPLIER,
            action: 'SEARCH',
            placeholder: i18n.t('SupplierList.index.searchSupplierPlaceholder'),
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
      suppliers: [],
      pageSize: 10,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) || PermissionChecker.hasUserPermissionType(PermissionType.UI_ADMIN), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshSuppliers = this.refreshSuppliers.bind(this);
    this.onSupplierSelect = this.onSupplierSelect.bind(this);
    this.fetchInitialSuppliers = this.fetchInitialSuppliers.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialSuppliers() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.supplierList.lastEditedTime != newProps.supplierList.lastEditedTime) {
      this.refreshSuppliers();
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

  onSupplierSelect(supplier) {
    const _onSupplierSelect = () => {
      this.props.navigation.navigate('SupplierDetails', {
        supplierID: supplier.ID,
        EntityType: EntityType.SUPPLIER,
        CompanyKey: this.props.company.selectedCompany.Key,
      });
    };
    Platform.OS === 'ios' ? _onSupplierSelect() : setTimeout(_onSupplierSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialSuppliers() {
    this.setState({ isLoading: true });
    this.fetchSuppliers(this.fetchInitialSuppliers);
  }

  fetchSuppliers(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    SupplierService.getSuppliers(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, suppliers: [...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleSupplierFetchErrors(response.problem, caller, i18n.t('SupplierList.index.fetchSupplierError'));
        }
      })
      .catch((error) => {
        this.handleSupplierFetchErrors(error.problem, caller, i18n.t('SupplierList.index.fetchSupplierError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    SupplierService.getSuppliers(companyKey, this.state.suppliers.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, suppliers: [...this.state.suppliers, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleSupplierFetchErrors(response.problem, caller, i18n.t('SupplierList.index.fetchSupplierError'));
        }
      })
      .catch((error) => {
        this.handleSupplierFetchErrors(error.problem, caller, i18n.t('SupplierList.index.fetchSupplierError'));
      });
  }

  handleSupplierFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SupplierList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshSuppliers() {
    this.setState({ isRefreshing: true });
    this.fetchSuppliers(this.refreshSuppliers);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-people-outline" size={75} color={theme.SECONDARY_TEXT_COLOR} />
        <Text style={styles.placeholderText}>{i18n.t('SupplierList.index.noSuppliers')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('SupplierList.index.noAccessToSuppliers')}</Text>
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
              data={this.state.suppliers}
              renderItem={props => <SupplierListRow {...props} onSelect={this.onSupplierSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshSuppliers}
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

            {!this.state.isLoading && this.state.suppliers.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('SupplierList.index.addNewSupplier')} buttonStyle={styles.addOrderButton} onPress={() => {
                this.props.navigation.navigate('SearchView', {
                  navigation: this.props.navigation, data: {
                    title: i18n.t('SupplierList.index.searchSuppliers'),
                    entityType: EntityType.PHONEBOOK_SEARCH,
                    origine: EntityType.SUPPLIER,
                    placeholder: i18n.t('SupplierList.index.searchSupplierPlaceholder'),
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
    supplierList: state.supplierList,
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
)(SupplierList);

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
