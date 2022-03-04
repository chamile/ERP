// @flow
import React, { Component } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { connect } from 'react-redux';

import { theme } from '../../styles';
import ViewWrapper from '../../components/ViewWrapper';
import { resetToSignIn, userLogout, clearCompaniesForRecentData, } from '../../actions/companySelectActions';
import { clearCompaniesForTimer } from '../../actions/timerActions';
import i18n from '../../i18n/i18nConfig';
import AuthService from '../../services/AuthService';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

class Logout extends Component {

  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.logout();
    }, 1000);
  }

  logout() {
    AuthService.revokeToken(this.props.token.authProvider, this.props.token.refreshToken, this.props.token.accessToken)
      .then((res) => {
        if (res.ok) {
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

  render() {
    return (
      <ViewWrapper withFade={false} withMove={false} fromBackgroundStyle={styles.wrapperToBackground}>
        <StatusBar backgroundColor={'#0175aa'} />
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <ActivityIndicator size="large" color={theme.SYSTEM_COLOR_LIGHT_BLUE} />
            <Text style={styles.textStyle}>{`${i18n.t('CompanySelect.index.logginOut')}...`}</Text>
          </View>
        </View>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetToSignIn: () => dispatch(resetToSignIn()),
    userLogout: () => dispatch(userLogout()),
    clearCompaniesForRecentData: () => dispatch(clearCompaniesForRecentData()),
    clearCompaniesForTimer: () => dispatch(clearCompaniesForTimer()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Logout);

const styles = StyleSheet.create({
  wrapperToBackground: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  textStyle: {
    color: theme.SYSTEM_COLOR_LIGHT_GRAY_4,
    marginTop: 10,
    fontSize: 17,
  },
});
