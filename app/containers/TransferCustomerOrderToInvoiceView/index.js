import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import { theme } from '../../styles';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import OrderService from '../../services/OrderService';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ItemListRow } from './itemListRow';
import ViewWrapper from '../../components/ViewWrapper';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { CustomerOrderItemStatusCodes } from '../../constants/CustomerOrderItemConstants';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import CustomerService from '../../services/CustomerService';

const HEIGHT = Dimensions.get('window').height;
class TransferCustomerOrderToInvoiceView extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('TransferCustomerOrderToInvoiceView.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton isActionComplete={navigation.state.params.isActionComplete || navigation.state.params.disableCancel} navigate={navigation.navigate} onPress={() => navigation.state.params.transferToInvoice(navigation.state.params.transferToInvoice)} text={i18n.t('TransferCustomerOrderToInvoiceView.index.transfer')} position="right" />,
      headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.goBack()} text={i18n.t('TransferCustomerOrderToInvoiceView.index.cancel')} position="left" isActionComplete={navigation.state.params.disableCancel} />,
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      moveAnimation: new Animated.Value(0),
      items: this.props.navigation.state.params.orderData.Items.filter(item => item.StatusCode === CustomerOrderItemStatusCodes.DRAFT).map((item) => { return { ...item, isChecked: true }; }),
    };
    this.transferToInvoice = this.transferToInvoice.bind(this);
    this.onItemSelect = this.onItemSelect.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams({ transferToInvoice: this.transferToInvoice, isActionComplete: false });
  }

  onItemSelect(item) {
    const items = this.state.items.map((itemData) => {
      if (item.ID === itemData.ID) {
        itemData.isChecked = !itemData.isChecked;
      }
      return itemData;
    });
    this.setState({ items });
    if (items.filter(ele => ele.isChecked).length > 0) {
      this.props.navigation.setParams({ isActionComplete: false });
    }
    else {
      this.props.navigation.setParams({ isActionComplete: true });
    }
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: reverse ? 0 : 1,
        duration: 300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }
  async updateInvoiceDueDate(response) {
    if (this.props.navigation.state.params.orderData.CreditDays !== null && this.props.navigation.state.params.orderData.CreditDays > 0) {
      response.data.PaymentDueDate = moment().add('days', this.props.navigation.state.params.orderData.CreditDays).format('YYYY-MM-DD');
    }
    else {
      response.data.PaymentDueDate = moment().add('days', this.props.company.selectedCompany.CustomerCreditDays).format('YYYY-MM-DD');
    }

    await CustomerInvoiceService.editCustomerInvoiceDetails( this.props.company.selectedCompany.Key, response.data.ID, response.data).then((result) => {
      this.goToCustomerInvoiceDetails(response);
    }).catch((error) => {
      this.goToCustomerInvoiceDetails(response);
    });


  }
  goToCustomerInvoiceDetails(response) {
    this.startAnimation(true);
    this.props.navigation.setParams({ disableCancel: false });
    this.props.navigation.replace('CustomerInvoiceDetails', {
      customerInvoiceID: response.data.ID,
      EntityType: 'customerinvoice',
      CompanyKey:  this.props.company.selectedCompany.Key,
    });
    this.props.navigation.state.params.refreshData ? this.props.navigation.state.params.refreshData() : null;
  }

  transferToInvoice(caller) {
    this.startAnimation();
    this.props.navigation.setParams({ disableCancel: true });
    const order = this.props.navigation.state.params.orderData;
    order.DeliveryDate = moment().add('days', 7).format('YYYY-MM-DD');
    order.Items = this.state.items.filter(ele => ele.isChecked).map((ele) => { delete ele.isChecked; return ele; });
    OrderService.transferToInvoice(this.props.navigation.state.params.orderData.ID, order,  this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) {
          this.updateInvoiceDueDate(response);
        }
      })
      .catch((error) => {
        this.startAnimation(true);
        this.props.navigation.setParams({ disableCancel: false });
        this.handleTransferToInvoiceErrors(error.problem, caller, i18n.t('TransferCustomerOrderToInvoiceView.index.transferError'));
      });
  }

  handleTransferToInvoiceErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('TransferCustomerOrderToInvoiceView.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Order/noItems.png')} />
        <Text style={styles.placeholderText}>{i18n.t('TransferCustomerOrderToInvoiceView.index.noItems')}</Text>
      </View>
    );
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} >
        <Animated.View
          style={[styles.animatedPanel, {
            transform: [
              {
                translateY: this.state.moveAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 0],
                })
              }
            ]
          }]}
        >
          <View style={styles.animatedPanelLoader}>
            <ActivityIndicator
              animating={true}
              style={[{ height: 80 }]}
              size="small"
            />
          </View>
          <View style={styles.animatedPanelText}>
            <Text>{i18n.t('TransferCustomerOrderToInvoiceView.index.transferring')}</Text>
          </View>
        </Animated.View>

        {this.state.items.length > 0 ?
          <FlatList
            keyExtractor={(item, index) => item.ID}
            data={this.state.items}
            renderItem={props => <ItemListRow {...props} onSelect={this.onItemSelect} />}
            ListHeaderComponent={() => <ListPaddingComponent height={10} />}
            ListFooterComponent={() => <ListPaddingComponent height={50} />}
          />
          :
          this.renderPlaceholder()
        }
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    company: state.company
  };
};

export default connect(
  mapStateToProps
)(TransferCustomerOrderToInvoiceView);

const styles = StyleSheet.create({
  placeholderContainer: {
    marginTop: HEIGHT / 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 80,
    width: 80,
  },
  placeholderText: {
    marginTop: 12,
    color: '#8f8d94',
    textAlign: 'center',
    lineHeight: 23
  },
  placeholderTextMain: {
    marginTop: 20,
    color: '#8f8d94',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 23,
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  animatedPanelLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  animatedPanelText: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: 10,
  },
});
