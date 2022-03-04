// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { theme } from '../../styles';
import InvoiceService from '../../services/InvoiceService';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import i18n from '../../i18n/i18nConfig';
import { getImageLink } from '../../helpers/APIUtil';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

class InvoiceSummary extends React.PureComponent {
  static propTypes = {
    invoiceData: PropTypes.shape({
      CompanyKey: PropTypes.string,
      EntityID: PropTypes.number
    }).isRequired,
    fileServerToken: PropTypes.string.isRequired,
    onDetailViewTap: PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      invoiceDetails: {},
    };
    this.refreshInvoiceSummary =    this.refreshInvoiceSummary.bind(this);
  }

  componentWillMount() {
    this.fetchInvoiceDetails();
  }

  refreshInvoiceSummary() {
    this.fetchInvoiceDetails(this.refreshInvoiceSummary);
  }

  fetchInvoiceDetails(caller) {
    InvoiceService.getInvoiceSummary(this.props.invoiceData.EntityID, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          const invoiceDetails = response.data.Data[0] ? response.data.Data[0] : {};
          this.setState({
            isLoading: false,
            invoiceDetails,
          });
        } else {
          this.handleInvoiceDetailFetchErrors(response.problem, caller, i18n.t('QuickView.InvoiceSummary.fetchInvoiceSummaryError'));
        }
      })
      .catch((error) => {
        this.handleInvoiceDetailFetchErrors(error.problem, caller, i18n.t('QuickView.InvoiceSummary.fetchInvoiceSummaryError'));
      });
  }

  handleInvoiceDetailFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('QuickView.InvoiceSummary.errorGeneric')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  render() {
    return (
      <View style={styles.invoicePreview}>
        {!this.state.isLoading ?
          (<TouchableHighlight style={styles.invoicePreviewButton} underlayColor={theme.SCREEN_COLOR_LIGHT_GREY} onPress={() => this.props.onDetailViewTap({ invoiceID: this.props.invoiceData.EntityID, EntityType: 'supplierinvoice', CompanyKey: this.props.company.selectedCompany.Key, refreshInvoiceSummary:this.refreshInvoiceSummary, fileID: this.state.invoiceDetails.fileID })}>
            <View style={styles.invoiceCard}>
              <Text style={styles.companyName}>{this.props.invoiceData.CompanyName}</Text>
              <View style={styles.invoiceCardInner}>

                <View style={styles.invoiceCardDetails}>
                  <Text ellipsizeMode={'tail'} numberOfLines={1} style={[styles.detailsTextMain, styles.detailsTextBold]}>{this.state.invoiceDetails ? this.state.invoiceDetails.SupplierName : i18n.t('QuickView.InvoiceSummary.noSupplier')}</Text>
                  <Text style={styles.detailsTextMain}>{i18n.t('QuickView.InvoiceSummary.invoiceNo')}{this.state.invoiceDetails ? this.state.invoiceDetails.ID : i18n.t('QuickView.InvoiceSummary.noId')}</Text>
                  <Text>
                    <Text style={styles.detailsTextSub}>{i18n.t('QuickView.InvoiceSummary.amount')}{this.state.invoiceDetails ? FormatNumber(this.state.invoiceDetails.Amount) : i18n.t('QuickView.InvoiceSummary.noAmount')}</Text>
                    <Text style={styles.currencyCode}> {this.state.invoiceDetails ? this.state.invoiceDetails.CurrencyCode : ''}</Text>
                  </Text>
                  <Text style={styles.detailsTextSub}>{i18n.t('QuickView.InvoiceSummary.documentNo')}{this.state.invoiceDetails ? this.state.invoiceDetails.fileID : i18n.t('QuickView.InvoiceSummary.noFileId')}</Text>
                </View>

                <View style={styles.detailsImage}>
                  <Image style={styles.infoThumbnail} source={getImageLink(this.state.invoiceDetails.fileRef, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, true)} />
                </View>
                <View style={styles.carrotBox}>
                  <Image resizeMode={'contain'} style={styles.carrot} source={require('../../images/QuickView/rightArrow.png')} />
                </View>
              </View>
            </View>
          </TouchableHighlight>) :
          (<View style={styles.loaderContainer}>
            <ActivityIndicator
              animating={true}
              color={theme.SECONDARY_COLOR}
              size="small"
            />
          </View>)}

      </View>
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

  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InvoiceSummary);

const styles = StyleSheet.create({
  container: {
    marginBottom: -5,
    backgroundColor: theme.PRIMARY_BACKGROUND_COLOR
  },
  loaderContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center'
  },
  // preview
  invoicePreview: {
    borderBottomWidth: 0.5,
    backgroundColor: theme.PRIMARY_BACKGROUND_COLOR,
    borderBottomColor: theme.TABLE_BOARDER_COLOR,
    height: 115,
  },
  invoicePreviewButton: {
    flex: 1
  },
  invoiceCard: {
    flex: 1, paddingRight: 15, paddingLeft: 15, paddingTop: 10, paddingBottom: 10
  },
  companyName: {
    fontSize: 10, color: theme.HINT_TEXT_COLOR
  },
  invoiceCardInner: {
    flex: 1, flexDirection: 'row',
  },
  invoiceCardDetails: {
    flex: 1, paddingTop: 5, justifyContent: 'space-between', paddingRight: 5
  },
  detailsTextMain: {
    fontSize: 15, color: theme.PRIMARY_TEXT_COLOR
  },
  detailsTextBold: {
    fontWeight: '500'
  },
  detailsTextSub: {
    fontSize: 15, color: theme.SECONDARY_TEXT_COLOR
  },
  detailsImage: {
    width: 80, backgroundColor: 'rgba(200,200,200,0.1)'
  },
  carrotBox: {
    width: 20, justifyContent: 'center', alignItems: 'flex-end'
  },
  carrot: {
    height: 15, width: 15
  },
  infoThumbnail: {
    width: 70,
    height: 80,
    alignSelf: 'center'
  },
  currencyCode: {
    fontSize: 13,
    color: theme.SECONDARY_TEXT_COLOR,
  },
});
