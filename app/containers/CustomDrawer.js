import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import Analytics from 'appcenter-analytics';

import { theme } from '../styles';
import { ifIphoneX, isSmallerThanIphone6 } from '../helpers/UIHelper';
import { resetSelectedCompanyPermissions, userLogout } from '../actions/companySelectActions';
import i18n from '../i18n/i18nConfig';
import { AnalyticalEventNames } from '../constants/AnalyticalEventNames';

const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;

class CustomDrawer extends Component {
  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }
  logout() {
    Analytics.trackEvent(AnalyticalEventNames.LOGOUT, { From: 'Drawer' });
    this.props.closeDrawer();
    this.props.navigation.navigate('Logout');
  }

  render() {
    return (
      <View style={styles.mainDrawer}>
        <View style={styles.leftContainer}>
          <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.topSpacer} />
            <View style={sectionTitleStyle}>
              <Text style={styles.sectionTitleText}>{i18n.t('CustomDrawer.accounting')}</Text>
            </View>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('InvoiceList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.supplierInvoice')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('SupplierList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.suppliers')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('InboxList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.inbox')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('ProjectList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.projects')}</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />

            <View style={sectionTitleStyle}>
              <Text style={styles.sectionTitleText}>{i18n.t('CustomDrawer.sales')}</Text>
            </View>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('CustomerInvoiceList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.customerInvoice')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('OrderList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.orders')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('QuoteList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.quotes')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('CustomerList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.customers')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('ProductList')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.products')}</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />

            <View style={sectionTitleStyle}>
              <Text style={styles.sectionTitleText}>{i18n.t('CustomDrawer.timeTracking')}</Text>
            </View>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('HoursTab')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.myTimeSheet')}</Text>
            </TouchableOpacity>

            <View style={styles.spacer} />

            <TouchableOpacity onPress={() => this.props.navigation.navigate('ApprovalsTab')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.approvals')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('NotificationsTab')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.notifications')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('FeedbackView')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('CustomDrawer.feedback')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.props.navigation.navigate('AboutView')} style={sectionItemStyle}>
              <Text style={styles.listItemText}>{i18n.t('About.index.title')}</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.bottomContainer}>
            <Image resizeMode={'contain'} source={require('../images/Drawer/uniEconomyLogo.png')} />
          </View>
        </View>

        <View style={styles.rightContainer}>
          <TouchableOpacity onPress={() => { this.props.closeDrawer(); this.props.resetSelectedCompanyPermissions(); this.props.navigation.navigate('CompanySelect'); }} style={styles.companyDetailsContainer}>
            <View style={styles.rowContainer}>
              <Text style={styles.companyNameText} numberOfLines={2}>{this.props.company.selectedCompany.Name}</Text>
              <Image resizeMode={'contain'} style={styles.arrowIcon} source={require('../images/QuickView/rightArrow.png')} />
            </View>
            <Text style={styles.companyIDText}>{this.props.company.selectedCompany.ID}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{i18n.t('CompanySelect.index.logout')}</Text>
          </TouchableOpacity>
          <View style={styles.blueBackground} />
        </View>
      </View>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    resetSelectedCompanyPermissions: () => dispatch(resetSelectedCompanyPermissions()),
    userLogout: () => dispatch(userLogout()),
    closeDrawer: () => dispatch({ type: 'Navigation/NAVIGATE', routeName: 'DrawerClose' })
  };
};

const mapStateToProps = (state, ownProps) => {
  return {
    company: state.company
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomDrawer);

const styles = StyleSheet.create({
  spacer: {
    height: 15,
  },
  topSpacer: {
    height: isSmallerThanIphone6() ? 40 : 50,
  },
  logoutText: {
    fontSize: 12,
    color: theme.SECONDARY_BACKGROUND_COLOR,
    fontWeight: '500',
  },
  logoutButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.SECONDARY_BACKGROUND_COLOR,
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: ifIphoneX(8, 4),
    bottom: ifIphoneX(WIDTH / 15, WIDTH / 20),
    right: isSmallerThanIphone6() ? WIDTH / 60 : WIDTH / 40,
    position: 'absolute',
    zIndex: 2,
  },
  sectionTitle: {
    height: 35,
    justifyContent: 'center',
  },
  sectionTitleSmall: {
    height: 28,
    justifyContent: 'center',
  },
  sectionItem: {
    height: 33,
    justifyContent: 'center',
  },
  sectionItemSmall: {
    height: 28,
    justifyContent: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemText: {
    color: theme.DISABLED_ITEM_COLOR,
    fontSize: isSmallerThanIphone6() ? 14 : 15,
  },
  sectionTitleText: {
    color: theme.PRIMARY_COLOR,
    fontSize: isSmallerThanIphone6() ? 14 : 15,
  },
  mainDrawer: {
    flex: 1,
    flexDirection: 'row'
  },
  arrowIcon: {
    marginTop: 2,
    marginLeft: 10,
    height: 12,
    width: 12,
    transform: [
      { rotate: '90deg' }
    ],
  },
  companyNameText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    color: theme.HINT_TEXT_COLOR,
    width: Platform.OS === 'ios' ? WIDTH / 4 : WIDTH / 5,
    paddingLeft: Platform.OS === 'ios' ? 0 : 15,
  },
  companyIDText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
    marginRight: 21,
    color: theme.SECONDARY_TEXT_COLOR,
  },
  companyDetailsContainer: {
    position: 'absolute',
    right: WIDTH / 20,
    top: ifIphoneX(HEIGHT / 15, HEIGHT / 20),
    zIndex: 2,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  blueBackground: {
    flex: 1,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: (2 * WIDTH) / 7,
    borderTopWidth: HEIGHT,
    borderRightColor: theme.HINT_COLOR,
    borderTopColor: 'transparent',
    borderRadius: 0.000001,
  },
  rightContainer: {
    flex: 4,
    backgroundColor: 'white',
  },
  leftContainer: {
    padding: 15,
    paddingTop: ifIphoneX(44, 25),
    paddingBottom: ifIphoneX(25, 15),
    justifyContent: 'space-between',
    flex: 5,
  },
  scrollView: {
    paddingBottom: 50,
  }
});

const sectionItemStyle = isSmallerThanIphone6() ? styles.sectionItemSmall : styles.sectionItem;
const sectionTitleStyle = isSmallerThanIphone6() ? styles.sectionTitleSmall : styles.sectionTitle;
