// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import CommentsIcon from '../CommentsIcon';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import SupplierService from '../../services/SupplierService';
import CommentService from '../../services/CommentService';
import i18n from '../../i18n/i18nConfig';
import GenericButton from '../../components/GenericButton';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH: number = Dimensions.get('window').width;

class SupplierDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('SupplierDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: <CommentsIcon count={navigation.state.params.comments ? navigation.state.params.comments.length : '...'} onPress={() => navigation.navigate('CommentsView', { data: { ...navigation.state.params, ID: navigation.state.params.supplierID } })} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      supplierDetails: {
        SupplierNumber: '',
        Info: {
          Name: '',
          InvoiceAddress: {
            AddressLine1: '',
          },
          ShippingAddress: {
            AddressLine1: '',
          },
          DefaultEmail: {
            EmailAddress: '',
          },
          DefaultPhone: {
            Number: '',
          },
          BankAccounts: []
        }
      },
      stats: {
        isLoadingOpenOrder: true,
        isLoadingTotalInvoiced: true,
        isLoadingOutstanding: true,
        openOrder: '',
        totalInvoiced: '',
        outstanding: '',
        openOrderCurrencyCode: '',
        totalInvoicedCurrencyCode: '',
        outstandingCurrencyCode: '',
        numberOfDueInvoices: '',
      },
    };

    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.fetchSupplierData = this.fetchSupplierData.bind(this);
    this.updateComments = this.updateComments.bind(this);
    this.editItem = this.editItem.bind(this);
    this.editSupplierDetails = this.editSupplierDetails.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams({ updateComments: this.updateComments });
    this.fetchData();

    CommentService.getComments(this.props.navigation.state.params.supplierID, this.props.navigation.state.params.EntityType,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.props.navigation.setParams({ comments: response.data }); }
      })
      .catch(() => {});
  }

  updateComments(comments) {
    this.props.navigation.setParams({ comments });
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchSupplierData(this.fetchData);
  }

  refreshData() {
    this.setState({ isRefreshing: true, stats: { ...this.state.stats, isLoadingOpenOrder: true, isLoadingOutstanding: true, isLoadingTotalInvoiced: true } });
    this.fetchSupplierData(this.refreshData);
  }

  editItem(item) {
    this.props.navigation.navigate('AddNewSupplier', {
      supplierID: this.props.navigation.state.params.supplierID,
      edit: true,
      EntityType: EntityType.S,
      CompanyKey:  this.props.company.selectedCompany.Key,
    });
  }

  editSupplierDetails() {
    this.props.navigation.navigate('AddNewSupplier', {
      isEditMode: true,
      data: this.state.supplierDetails,
      supplierID: this.props.navigation.state.params.supplierID,
      refreshData: this.refreshData,
    });
  }

  processAddress(address) {
    if (address.AddressLine1 && address.City && address.PostalCode && Number(address.AddressLine1.length + address.City.length + address.PostalCode.length) > 40) {
      return `${address.AddressLine1}, ${address.PostalCode} ${address.City}`.substring(0, 40) + '...';
    } else if (!address.AddressLine1 && !address.City && !address.PostalCode) {
      return null;
    } else {
      return `${address.AddressLine1 ? address.AddressLine1 : ''}, ${address.PostalCode ? address.PostalCode : ''} ${address.City ? address.City : ''}`;
    }
  }

  fetchSupplierData(caller) {
    SupplierService.getSupplierDetails(this.props.navigation.state.params.supplierID,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.setState({
            isLoading: false,
            isRefreshing: false,
            supplierDetails: response.data,
          });
          let supplierBankAccounts = this.state.supplierDetails.Info.BankAccounts.filter(item => item.Deleted == false)
          this.setState({ BankAccounts: supplierBankAccounts });


        }
      })
      .catch((error) => {
        this.handleSupplierErrors(error.problem, caller, i18n.t('SupplierDetails.index.fetchSupplierError'));
      });
    //Commented since this is not necessary at this time of delivery
    // CustomerService.getCustomerKPIOpenOrders(this.props.navigation.state.params.supplierID,  this.props.company.selectedCompany.Key)
    //   .then(res => {
    //     this.setState({
    //       stats: {
    //         ...this.state.stats,
    //         isLoadingOpenOrder: false,
    //         openOrder: res.data.Data && res.data.Data.length > 0 ? res.data.Data[0].SumOpenOrdersExVatCurrency : '',
    //       }
    //     });
    //   })
    //   .catch(err => {
    //     this.setState({
    //       stats: {
    //         ...this.state.stats,
    //         isLoadingOpenOrder: false,
    //       }
    //     });
    //   });


    // CustomerService.getCustomerKPITotalInvoiced(this.props.navigation.state.params.supplierID,  this.props.company.selectedCompany.Key)
    //   .then(res => {
    //     this.setState({
    //       stats: {
    //         ...this.state.stats,
    //         isLoadingTotalInvoiced: false,
    //         isLoadingOutstanding: false,
    //         totalInvoiced: res.data.Data && res.data.Data.length > 0 ? res.data.Data[0].SumInvoicedExVatCurrency : '',
    //         outstanding: res.data.Data && res.data.Data.length > 0 ? res.data.Data[0].SumDueInvoicesRestAmountCurrency : '',
    //         numberOfDueInvoices: res.data.Data && res.data.Data.length > 0 ? res.data.Data[0].NumberOfDueInvoices : '',
    //       }
    //     });
    //   })
    //   .catch(err => {
    //     this.setState({
    //       stats: {
    //         ...this.state.stats,
    //         isLoadingTotalInvoiced: false,
    //         isLoadingOutstanding: false,
    //       }
    //     });
    //   });
  }

  handleSupplierErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SupplierDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false;
    }
    return true;
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
          {/* <View style={styles.kpiContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{`${this.state.supplierDetails.Info && this.state.supplierDetails.Info.Name ? this.state.supplierDetails.Info.Name : i18n.t('OrderList.OrderListRow.unknown')} - ${this.state.supplierDetails.SupplierNumber ? this.state.supplierDetails.SupplierNumber : ''} `}</Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoTileLeft}>
                <View style={styles.infoItemContainer}>
                  <Text style={styles.infoTileField}>{i18n.t('SupplierDetails.index.openOrder')}</Text>
                  {this.state.stats.isLoadingOpenOrder ?
                    <ActivityIndicator
                      animating={this.state.stats.isLoadingOpenOrder}
                      color={theme.PRIMARY_COLOR}
                      size="small"
                      style={styles.spinnerLeft}
                    /> :
                    <Text>
                      <Text style={this.state.stats.openOrder !== '' ? styles.infoTileValue : styles.infoTileField}>{this.state.stats.openOrder !== '' ? FormatNumber(this.state.stats.openOrder, i18n.language) : i18n.t('SupplierDetails.index.notSpecified')}</Text>
                      <Text style={[styles.currencyCode, { fontSize: 12 }]}> {this.props.company.selectedCompany.BaseCurrencyCode && this.state.stats.openOrder !== '' ? this.props.company.selectedCompany.BaseCurrencyCode :  ''}</Text>
                    </Text>
                  }
                </View>
                <View style={styles.infoItemContainerLeft}>
                  <Text style={styles.infoTileField}>{i18n.t('SupplierDetails.index.totalInvoiced')}</Text>
                  {this.state.stats.isLoadingTotalInvoiced ?
                    <ActivityIndicator
                      animating={this.state.stats.isLoadingTotalInvoiced}
                      color={theme.PRIMARY_COLOR}
                      size="small"
                      style={styles.spinnerRight}
                    /> :
                    <Text>
                      <Text style={this.state.stats.totalInvoiced !== '' ? styles.infoTileValue : styles.infoTileField}>{this.state.stats.totalInvoiced !== '' ? FormatNumber(this.state.stats.totalInvoiced, i18n.language) : i18n.t('SupplierDetails.index.notSpecified')}</Text>
                      <Text style={[styles.currencyCode, { fontSize: 12 }]}> {this.props.company.selectedCompany.BaseCurrencyCode && this.state.stats.totalInvoiced !== '' ? this.props.company.selectedCompany.BaseCurrencyCode : ''}</Text>
                    </Text>
                  }
                </View>
              </View>
              <View style={styles.infoTileRight}>
                <Text style={styles.infoAmountTileField}>{`${i18n.t('SupplierDetails.index.outstanding')}${this.state.stats.numberOfDueInvoices && !this.state.stats.isLoadingOutstanding ? ` (${this.state.stats.numberOfDueInvoices} ${i18n.t('SupplierDetails.index.dueInvoices')})` : ''}`}</Text>
                {this.state.stats.isLoadingOutstanding ?
                  <ActivityIndicator
                    animating={this.state.stats.isLoadingOutstanding}
                    color={theme.PRIMARY_COLOR}
                    size="small"
                    style={styles.spinnerLeft}
                  /> :
                  <Text>
                    <Text style={this.state.stats.outstanding !== '' ? styles.infoTileValueOutstanding : styles.infoTileField}>{this.state.stats.outstanding !== '' ? FormatNumber(this.state.stats.outstanding, i18n.language) : i18n.t('SupplierDetails.index.notSpecified')}</Text>
                    <Text style={styles.currencyCode}> {this.props.company.selectedCompany.BaseCurrencyCode && this.state.stats.outstanding !== '' ? this.props.company.selectedCompany.BaseCurrencyCode : ''}</Text>
                  </Text>
                }
              </View>
            </View>
          </View> */}

          <View style={styles.detailsContainer}>
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.name')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info && this.state.supplierDetails.Info.Name ? this.state.supplierDetails.Info.Name : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.supplierNo')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.SupplierNumber ? this.state.supplierDetails.SupplierNumber.toString() : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.billingAddress')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info && this.state.supplierDetails.Info.InvoiceAddress ? this.processAddress(this.state.supplierDetails.Info.InvoiceAddress) : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.deliveryAddress')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info && this.state.supplierDetails.Info.ShippingAddress ? this.processAddress(this.state.supplierDetails.Info.ShippingAddress) : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.BankAccount')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info.BankAccounts.length != 0 ? (!this.isEmpty(this.state.supplierDetails.Info.DefaultBankAccount) ? `${this.state.supplierDetails.Info.DefaultBankAccount.AccountNumber} - (${this.state.supplierDetails.Info.BankAccounts.length})` : `(${this.state.supplierDetails.Info.BankAccounts.length})`) : ''}
            />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.organization')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.OrgNumber ? this.state.supplierDetails.OrgNumber.toString() : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.email')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info && this.state.supplierDetails.Info.DefaultEmail && this.state.supplierDetails.Info.DefaultEmail.EmailAddress ? this.state.supplierDetails.Info.DefaultEmail.EmailAddress : ''}
            />
            <View style={styles.lineSpacer} />
            <InlineValidationInputField
              title={i18n.t('SupplierDetails.index.phone')}
              placeHolder={i18n.t('SupplierDetails.index.notSpecified')}
              isKeyboardInput={true}
              editable={false}
              value={this.state.supplierDetails.Info && this.state.supplierDetails.Info.DefaultPhone && this.state.supplierDetails.Info.DefaultPhone.Number ? this.state.supplierDetails.Info.DefaultPhone.Number : ''}
            />
          </View>

        </ScrollView>

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          <GenericButton text={i18n.t('SupplierDetails.index.edit')} buttonStyle={styles.actionButton} onPress={this.editSupplierDetails} />
        </FloatingBottomContainer>
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(SupplierDetails);

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: 15,
    marginVertical: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR,
  },
  leftInfoContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: 15,
    flexDirection: 'column',
  },
  infoTileRight: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
  },
  infoTileLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  infoTileField: {
    color: theme.DISABLED_ITEM_COLOR,
    fontSize: 13,
  },
  infoTileValue: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '500',
  },
  infoTileValueOutstanding: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 18,
    fontWeight: '700',
  },
  infoItemContainer: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
  },
  infoItemContainerLeft: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 10,
    alignItems: 'flex-end'
  },
  infoAmountTileField: {
    color: theme.SCREEN_COLOR_LIGHT_RED,
    fontSize: 13,
    marginBottom: 2,
  },
  actionButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  detailsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    paddingTop: 5,
  },
  lineSpacer: {
    height: 5,
  },
  kpiContainer: {
    paddingVertical: 25,
  },
  spinnerLeft: {
    alignSelf: 'flex-start',
  },
  spinnerRight: {
    alignSelf: 'flex-end',
  },
  currencyCode: {
    fontSize: 13,
    color: theme.PRIMARY_TEXT_COLOR,
  },
});
