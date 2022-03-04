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
  StatusBar,
  Platform,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { uniqBy } from 'lodash';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import InvoiceService from '../../services/InvoiceService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { CameraIcon } from '../../components/CameraIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { InvoiceListRow } from './InvoiceListRow';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import { addTempImages, resetToNewSupplierInvoice } from '../../actions/addNewInvoiceActions';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class InvoiceList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('InvoiceList.index.title'),
      headerLeft: <DrawerIcon />,
      headerRight: <CameraIcon disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false} onPress={() => {
        navigation.navigate('CameraView', {
          showImgGallery: true,
          showSkip: true,
          selectMultiple: true,
          title: i18n.t('AddNewInvoice.index.title'),
          navigateForwardTo: () => navigation.dispatch(resetToNewSupplierInvoice()),
          onImageAdd: (images) => navigation.dispatch(addTempImages(images)),
        }
        )
      }} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />
    }
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      userInvoices: [],
      pageSize: 30,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS) //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshUserInvoices = this.refreshUserInvoices.bind(this);
    this.onInvoiceSelect = this.onInvoiceSelect.bind(this);
    this.fetchInvoices = this.fetchInvoices.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.handleNoPermission = this.handleNoPermission.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInvoices() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.invoiceList.lastEditedTime != newProps.invoiceList.lastEditedTime) {
      this.refreshUserInvoices();
    }
  }

  handleNoPermission() {
    this.setState({ isLoading: false }, () => {
      InteractionManager.runAfterInteractions(() => {
        this.props.navigation.setParams({
          isActionButtonDisabled: true
        });
      });
    });
  }		   

  onInvoiceSelect(invoice) {
    const _onInvoiceSelect = () => {
      this.props.navigation.navigate('InvoiceDetails', {
        invoiceID: invoice.ID,
        EntityType: 'supplierinvoice',
        CompanyKey: this.props.company.selectedCompany.Key,
        refreshInvoiceList: this.fetchInvoices
      });
    };
    Platform.OS == 'ios' ? _onInvoiceSelect() : setTimeout(_onInvoiceSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInvoices() {
    this.setState({ isLoading: true });
    this.fetchUserInvoices(this.fetchInvoices);
  }

  fetchUserInvoices(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    InvoiceService.getUserInvoices(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          let userInvoices = response.data.Data ? [...response.data.Data] : [];
          userInvoices = uniqBy(userInvoices, 'ID');
          this.setState({ isLoading: false, isRefreshing: false, userInvoices, hasNextPage: ((response.data.Data ? response.data.Data.length : 0) === this.state.pageSize) });
        } else {
          this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('InvoiceList.index.gettingUserInvoicesError'));
        }
      })
      .catch((error) => {
        this.handleInvoiceFetchErrors(error.problem, caller, i18n.t('InvoiceList.index.gettingUserInvoicesError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    InvoiceService.getUserInvoices(companyKey, this.state.userInvoices.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          let userInvoices = [...this.state.userInvoices, ...response.data.Data];
          userInvoices = uniqBy(userInvoices, 'ID');
          this.setState({ isLoading: false, isRefreshing: false, userInvoices, hasNextPage: (response.data.Data.length === this.state.pageSize) });
        } else {
          this.handleInvoiceFetchErrors(response.problem, caller, i18n.t('InvoiceList.index.gettingMoreUserInvoicesError'));
        }
      })
      .catch((error) => {
        this.handleInvoiceFetchErrors(error.problem, caller, i18n.t('InvoiceList.index.gettingMoreUserInvoicesError'));
      });
  }

  handleInvoiceFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('InvoiceList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshUserInvoices() {
    this.setState({ isRefreshing: true });
    this.fetchUserInvoices(this.refreshUserInvoices);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('InvoiceList.index.noInvoices')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('InvoiceList.index.noAccessToSupplierInvoice')}</Text>
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

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        {this.state.hasPermissionToModule ?
          <View>
            <FlatList
              keyExtractor={(item, index) => `${item.ID}`}
              data={this.state.userInvoices}
              renderItem={props => <InvoiceListRow {...props} onSelect={this.onInvoiceSelect} fileServerToken={this.props.token.fileServerToken} fileServerTokenUpdatedTimeStamp={this.props.token.fileServerTokenUpdatedTimeStamp} companyKey={this.props.company.selectedCompany.Key} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshUserInvoices}
                  tintColor={theme.PRIMARY_COLOR}
                />
              }
              ListHeaderComponent={() => <ListPaddingComponent height={20} />}
              ListFooterComponent={this.renderFooter}
              onEndReached={this.onEndReached}
              onEndReachedThreshold={0.3}
            />

            {!this.state.isLoading && this.state.userInvoices.length === 0 && this.state.hasPermissionToModule ? this.renderPlaceholder() : null}
          </View>
          : this.renderPlaceholderWithNoPermission()}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    invoiceNav: state.invoiceNav,
    invoiceList: state.invoiceList,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    // completeOnboarding: () => dispatch(completeOnboarding()),
    // resetToCompanySelect: () => dispatch(resetToCompanySelect())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InvoiceList);

const styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.6
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  imageWithNotificationBadge: {
    width: 28,
    height: 28
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
