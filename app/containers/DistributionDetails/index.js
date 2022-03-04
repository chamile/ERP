// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const getInvoiceSharingType = (sharingType) => {
  let sType;
  switch (sharingType) {
    case 0:
      sType = i18n.t('CustomerInvoiceDetails.index.unknown');
      break;
    case 1:
      sType = i18n.t('CustomerInvoiceDetails.index.print');
      break;
    case 2:
      sType = i18n.t('CustomerInvoiceDetails.index.email');
      break;
    case 3:
      sType = i18n.t('CustomerInvoiceDetails.index.ap');
      break;
    case 4:
      sType = i18n.t('CustomerInvoiceDetails.index.vipps');
      break;
    case 5:
      sType = i18n.t('CustomerInvoiceDetails.index.export');
      break;
    case 6:
      sType = i18n.t('CustomerInvoiceDetails.index.invoicePrint');
      break;
    case 7:
      sType = i18n.t('CustomerInvoiceDetails.index.efaktura');
      break;
    case 8:
      sType = i18n.t('Custo merInvoiceDetails.index.avtalegiro');
      break;
    case 9:
      sType = i18n.t('CustomerInvoiceDetails.index.factoring');
      break;
    default:
      sType = i18n.t('CustomerInvoiceDetails.index.undefined');
  }
  return sType;
};

const getInvoiceStatus = (statusCode) => {
  let status;
  if (statusCode >= 70003) {
    status = i18n.t('CustomerInvoiceDetails.index.finished');
  }
  else if (statusCode == 70002) {
    status = i18n.t('CustomerInvoiceDetails.index.noDistrbPlan');
  }
  else if (statusCode == 70001) {
    status = i18n.t('CustomerInvoiceDetails.index.inProgress');
  }
  else if (statusCode == 70004) {
    status = i18n.t('CustomerInvoiceDetails.index.canceled');
  }
  else if (statusCode == 7000) {
    status = i18n.t('CustomerInvoiceDetails.index.pending');
  }
  else {
    status = '';
  }
  return status;
};

class DistributionDetails extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    return {
      title: i18n.t('CustomerInvoiceDetails.index.distributionDetails'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      SharingCreatedAt: '',
      SharingExternalMessage: '',
      SharingType: '',
      SharingStatus: '',
      SharingTo: '',
      UserDisplayName: ''

    };

    this.showMessage = this.showMessage.bind(this);
    this.truncateMessage = this.truncateMessage.bind(this);

  }

  componentDidMount() {
    this.setState({
      UserDisplayName: this.props.navigation.state.params.data.UserDisplayName,
      SharingTo: this.props.navigation.state.params.data.SharingTo,
      SharingExternalMessage: this.props.navigation.state.params.data.SharingExternalMessage,
      SharingCreatedAt: moment(this.props.navigation.state.params.data.SharingCreatedAt).format('YYYY-MM-DD HH:MM'),
      SharingType: getInvoiceSharingType(this.props.navigation.state.params.data.SharingType),
      SharingStatus: getInvoiceStatus(this.props.navigation.state.params.data.SharingStatusCode)
    }, this.truncateMessage(this.props.navigation.state.params.data.SharingExternalMessage));

  }

  showMessage() {
    if (this.state.SharingExternalMessage != null) {
      this.props.navigation.navigate({
        key: 'MessageView', routeName: 'MessageView', params: { message: this.state.SharingExternalMessage }
      });
    }

  }

  truncateMessage(message) {
    let truncMsg = '';
    if (message != null) {
      if (message.length > 20)
        truncMsg = `${message.substring(0, 20)}...`
      else
        truncMsg = message;
    }
    this.setState({ ...this.state, SharingExternalMessageDisplay: `${truncMsg}` })
  }
  render() {
    return (
      <View style={styles.mainView}>
        <ScrollView
          scrollEventThrottle={200}
        >
          <View style={styles.lineSpacer} />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.date')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={true}
            editable={false}
            value={this.state.SharingCreatedAt}
          />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.distrType')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={true}
            editable={false}
            value={this.state.SharingType}
          />
          <View style={styles.lineSpacer} />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.sharedBy')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={true}
            editable={false}
            value={this.state.UserDisplayName}
          />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.to')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={true}
            editable={false}
            value={this.state.SharingTo}
          />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.message')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={false}
            value={this.state.SharingExternalMessageDisplay}
            onPress={this.showMessage}
          />
          <InlineValidationInputField
            title={i18n.t('CustomerInvoiceDetails.index.status')}
            placeHolder={i18n.t('CustomerInvoiceDetails.index.notSpecified')}
            isKeyboardInput={true}
            editable={false}
            value={this.state.SharingStatus}
          />

        </ScrollView>
      </View>
    );
  }
}


export default connect(
)(DistributionDetails);

const styles = StyleSheet.create({

  mainView: {
    backgroundColor: 'white', flex: 1
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR,
  },
  lineSpacer: {
    height: 5,
  },

});

