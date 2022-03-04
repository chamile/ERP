// @flow
import React, { Component } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import InvoiceSummary from './InvoiceSummary';
import QuickCommentsView from './QuickCommentsView';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';

class QuickViewInvoice extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('QuickView.index.title'),
      headerRight: <HeaderTextButton isActionComplete={navigation.state.params.isActionComplete} navigate={navigation.navigate} onPress={navigation.state.params.onDoneTap} text={i18n.t(`QuickView.index.done`)} position="right" />,
      headerLeft: null,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR },
    };
  };

  constructor() {
    super();
    this.state = {
    };
    this.isActionComplete = false;
    this.onDoneTap = this.onDoneTap.bind(this);
    this.onDetailViewTap = this.onDetailViewTap.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ onDoneTap: this.onDoneTap });
  }

  onDoneTap() {
    this.isActionComplete = true;
    this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    this.props.navigation.goBack();
  }

  onDetailViewTap(data) {
    const _navigateToInvoiceDetail = () => {
      this.props.navigation.navigate('InvoiceDetails', { ...data, tabTitle: i18n.t('QuickView.index.notifications'), tabIcon: 'Notifications' });
    };
    Platform.OS === 'ios' ? _navigateToInvoiceDetail() : setTimeout(_navigateToInvoiceDetail, 25);
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle}>
        <StatusBar backgroundColor={theme.SECONDARY_STATUS_BAR_COLOR} />
        {this.props.navigation.state.params.displayInvoiceSummary ?
          <InvoiceSummary invoiceData={this.props.navigation.state.params} fileServerToken={this.props.token.fileServerToken} fileServerTokenUpdatedTimeStamp={this.props.token.fileServerTokenUpdatedTimeStamp} onDetailViewTap={this.onDetailViewTap} />
          : null}
        <QuickCommentsView entityData={{ EntityID: this.props.navigation.state.params.EntityID, EntityType: this.props.navigation.state.params.EntityType, CompanyKey:  this.props.company.selectedCompany.Key }} />
      </ViewWrapper>
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
)(QuickViewInvoice);

const styles = StyleSheet.create({
  fromBackgroundStyle: {
    backgroundColor: '#FFF'
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF'
  }
});
