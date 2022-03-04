// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
  ActivityIndicator,
  Easing
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import Analytics from 'appcenter-analytics';

import CompanyService from '../../services/CompanyService';
import AuthService from '../../services/AuthService';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import {
  resetToTabs, resetToSignIn, setCompaniesForRecentData, userLogout, clearCompaniesForRecentData, setSelectedCompany, setSelectedCompanyPermissions, resetSelectedCompanyPermissions, setSelectedCompanyBaseCurrencyData, setAvailableCompanyList
} from '../../actions/companySelectActions';
import { updateUnreadNotificationCount } from '../../actions/notificationActions';
import { setCurrentUserDetails } from '../../actions/userActions';
import { updatePendingApprovalCount } from '../../actions/approvalActions';
import { setCompaniesForTimer, clearCompaniesForTimer } from '../../actions/timerActions';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { CompanySelectRow } from './CompanySelectRow';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import { ifIphoneX, getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { getFirstTabWithPermission } from '../../helpers/CompanySwitchHelper';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

class CompanySelect extends Component {

  static navigationOptions = () => {
    return {
      title: i18n.t('CompanySelect.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerLeft: null,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      userCompanies: [],
      moveAnimation: new Animated.Value(0),
    };

    this.fetchCompanies = this.fetchCompanies.bind(this);
    this.refreshCompanies = this.refreshCompanies.bind(this);
    this.setCurrentUserDetails = this.setCurrentUserDetails.bind(this);
    this.logout = this.logout.bind(this);
    this.onCompanySelect = this.onCompanySelect.bind(this);
  }

  componentDidMount() {
    this.fetchCompanies();
  }

  onCompanySelect(company) {
    this.startAnimation(true);

    CompanyService.getCompanyBaseCurrency(company.Key, company.Name)
      .then(res => {
        this.props.setSelectedCompanyBaseCurrencyData(res.data[0].BaseCurrencyCodeID, res.data[0].BaseCurrencyCode);
        company.CustomerCreditDays = res.data[0].CustomerCreditDays;
      })
      .catch(err => {
        this.props.setSelectedCompanyBaseCurrencyData('', '');
      });

    const _onCompanySelect = (selectedTab) => {
      this.props.setSelectedCompany(company);
      this.props.updateUnreadNotificationCount(company.Key);
      this.props.updatePendingApprovalCount(company.Key);
      this.setCurrentUserDetails(company.Key).then(() => {
        this.props.resetToTabs(selectedTab);
        this.startAnimation(false);
      });
    };

    AuthService.getCurrentSession(company.Key)
      .then((response) => {
        const firstTabWithPermission = getFirstTabWithPermission(response.data.Permissions);
        this.props.setSelectedCompanyPermissions(response.data.Permissions ? response.data.Permissions : []);
        Platform.OS === 'ios' ? _onCompanySelect(firstTabWithPermission) : setTimeout(_onCompanySelect.bind(null, firstTabWithPermission), 25); // give some time to display the native touch animation
      }).catch((error) => {
        this.props.resetSelectedCompanyPermissions();
        this.startAnimation(false);
        ApiErrorHandler.handleGenericErrors({ problem: error.problem, caller: null, userErrorMessage: i18n.t('CompanySelect.index.somethingWrong') });
      });
  }

  async setCurrentUserDetails(companyKey) {
    const response = await AuthService.getCurrentSession(companyKey);
    this.props.setCurrentUserDetails(response.data);
  }

  fetchCompanies() {
    this.setState({ isLoading: true });
    this.fetchUserCompanies(this.fetchCompanies);
  }

  refreshCompanies() {
    this.setState({ isRefreshing: true });
    this.fetchUserCompanies(this.refreshCompanies);
  }

  fetchUserCompanies(caller) {
    CompanyService.getUserCompanies()
      .then((response) => {
        if (response.ok) {
          const data = response.data ? response.data : [];
          this.setState({ isLoading: false, isRefreshing: false, userCompanies: [...data] });
          let companies = [];
          let existingCompanies = Object.keys(this.props.recentData.companies) || [];
          data.forEach(company => {
            if (!existingCompanies.includes(company.Key)) {
              companies[company.Key] = {};
            }
          });
          this.props.setCompaniesForRecentData(companies);
          this.props.setAvailableCompanyList([...data]);

          companies = [];
          existingCompanies = Object.keys(this.props.timer.companies) || [];
          data.forEach(company => {
            if (!existingCompanies.includes(company.Key)) {
              companies[company.Key] = {
                isActive: false,
                timeLog: {
                  startTime: null,
                  endTime: null,
                  project: {
                    name: null,
                    id: null
                  },
                  department: {
                    name: null,
                    id: null
                  },
                  workType: {
                    name: null,
                    id: null
                  },
                  order: {
                    id: null,
                    number: null,
                    company: null
                  },
                  description: null,
                  lunchInMinutes: 0
                }
              };
            }
          });
          this.props.setCompaniesForTimer(companies);
        } else {
          this.handleCompanyFetchErrors(response.problem, caller, i18n.t('CompanySelect.index.fetchCompaniesError'));
        }
      })
      .catch((err) => {
        this.handleCompanyFetchErrors(err.problem, caller, i18n.t('CompanySelect.index.fetchCompaniesError'));
      });
  }

  handleCompanyFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('CompanySelect.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  logout() {
    AuthService.revokeToken(this.props.token.authProvider, this.props.token.refreshToken, this.props.token.accessToken)
      .then((res) => {
        if (res.ok) {
          Analytics.trackEvent(AnalyticalEventNames.LOGOUT, { From: 'Company select' });
          this.props.userLogout();
          this.props.resetToSignIn();
          setTimeout(() => {
            this.props.clearCompaniesForRecentData();
            this.props.clearCompaniesForTimer();
          }, 1000);
        }
      })
      .catch(() => {});
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: !reverse ? 0 : 1,
        duration: 300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/CompanySelect/noCompanyIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('CompanySelect.index.noAccess')}</Text>
      </View>
    )
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} loaderPosition={'nav'} useNoSafeAreaView>
        <StatusBar backgroundColor={theme.PRIMARY_STATUS_BAR_COLOR} />

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
          <ActivityIndicator
            animating={true}
            size="small"
            color={theme.PRIMARY_COLOR}
          />
          <Text style={styles.animatedPanelText}>{`${i18n.t('CompanySelect.index.checkingPermissions')} ....`}</Text>
        </Animated.View>

        <FlatList
          keyExtractor={(item, index) => item.Key}
          data={this.state.userCompanies}
          renderItem={props => <CompanySelectRow {...props} onSelect={this.onCompanySelect} />}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshCompanies}
              tintColor={theme.PRIMARY_COLOR}
            />
          }
          ListHeaderComponent={() => <ListPaddingComponent height={10} />}
          ListFooterComponent={() => <ListPaddingComponent height={10} />}
        />

        {!this.state.isLoading && this.state.userCompanies.length === 0 ? this.renderPlaceholder() : null}

        <View style={styles.logoutBar}>
          <TouchableOpacity onPress={this.logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>{i18n.t('CompanySelect.index.logout')}</Text>
            <Icon name="md-log-out" size={25} color={theme.SECONDARY_TEXT_COLOR} />
          </TouchableOpacity>
        </View>
      </ViewWrapperAsync>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    timer: state.timer,
    recentData: state.recentData,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetToTabs: selectedTab => dispatch(resetToTabs(selectedTab)),
    resetToSignIn: () => dispatch(resetToSignIn()),
    clearCompaniesForRecentData: () => dispatch(clearCompaniesForRecentData()),
    clearCompaniesForTimer: () => dispatch(clearCompaniesForTimer()),
    setCompaniesForRecentData: companies => dispatch(setCompaniesForRecentData(companies)),
    setCompaniesForTimer: companies => dispatch(setCompaniesForTimer(companies)),
    userLogout: () => dispatch(userLogout()),
    setCurrentUserDetails: user => dispatch(setCurrentUserDetails(user)),
    setSelectedCompany: company => dispatch(setSelectedCompany(company)),
    updateUnreadNotificationCount: companyKey => dispatch(updateUnreadNotificationCount(companyKey)),
    updatePendingApprovalCount: companyKey => dispatch(updatePendingApprovalCount(companyKey)),
    resetSelectedCompanyPermissions: () => dispatch(resetSelectedCompanyPermissions()),
    setSelectedCompanyPermissions: permissionList => dispatch(setSelectedCompanyPermissions(permissionList)),
    setSelectedCompanyBaseCurrencyData: (BaseCurrencyCodeID, BaseCurrencyCode) => dispatch(setSelectedCompanyBaseCurrencyData(BaseCurrencyCodeID, BaseCurrencyCode)),
    setAvailableCompanyList: list => dispatch(setAvailableCompanyList(list)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CompanySelect);

const styles = StyleSheet.create({
  paragraph: {
    width: 250,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: HEIGHT / 14,
    fontSize: 15,
    lineHeight: 25,
  },
  animationContainer: {
    width: 220,
    height: 220,
    marginTop: 20,
    alignSelf: 'center',
  },
  animation: {
    width: 220,
    height: 220,
  },
  textTop: {
    color: theme.PRIMARY_TEXT_COLOR,
  },
  textBottom: {
    color: theme.SECONDARY_TEXT_COLOR,
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -60,
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
  logoutBar: {
    height: ifIphoneX(75, 60),
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  logoutButton: {
    width: 130,
    height: 60,
    paddingBottom: ifIphoneX(10, 4),
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    marginRight: 10,
    color: theme.SECONDARY_TEXT_COLOR,
    fontWeight: '500',
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 60,
    width: WIDTH,
    backgroundColor: 'rgba(255,255,255,0.95)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedPanelText: {
    justifyContent: 'center',
    paddingLeft: 10,
    color: theme.SECONDARY_TEXT_COLOR,
  },
});
