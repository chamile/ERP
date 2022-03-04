// @flow
import React, { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import * as jwtDecode from 'jwt-decode';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import OnBoardView from './OnBoardView';
import { completeOnboarding, resetToCompanySelect } from '../../actions/onboardActions';
import NotificationService from '../../services/NotificationService';
import { getHeaderStyle } from '../../helpers/UIHelper';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import i18n from '../../i18n/i18nConfig';

const HEIGHT: number = Dimensions.get('window').height;
class OnBoard extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('OnBoard.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle()
    };
  };

  constructor() {
    super();
    this.state = {};
    this.registerDevice = this.registerDevice.bind(this);
    this.skip = this.skip.bind(this);
  }

  registerDevice(deviceId) {
    const decodedToken = jwtDecode.default(this.props.token.accessToken);
    NotificationService.registerForNotifications(deviceId, decodedToken.sub)
      .then((response) => {
        if (response.ok) {
          this.props.completeOnboarding();
          setTimeout(() => this.props.resetToCompanySelect(), 1000);
        } else {
          this.handleRegisterDeviceErrors(i18n.t('OnBoard.index.errorNotificationRegister'), this.registerDevice.bind(null, deviceId), i18n.t('OnBoard.index.errorNotificationRegister'), () => {
            setTimeout(() => {
              this.props.completeOnboarding();
              this.props.resetToCompanySelect();
            }, 1000);
          });
        }
      })
      .catch((error) => {
        this.handleRegisterDeviceErrors(error.problem, this.registerDevice.bind(null, deviceId), i18n.t('OnBoard.index.errorNotificationRegister'), () => {
          setTimeout(() => {
            this.props.completeOnboarding();
            this.props.resetToCompanySelect();
          }, 1000);
        });
      });
  }

  handleRegisterDeviceErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('OnBoard.index.errorNotificationRegister'), onCancel = () => { }) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage, onCancel });
  }

  skip() {
    this.props.completeOnboarding();
    this.props.resetToCompanySelect();
  }

  render() {
    return (
      <ViewWrapper showProgress withFade={true} withMove={true} fromBackgroundStyle={{ backgroundColor: theme.PRIMARY_COLOR }} toBackgroundStyle={{ backgroundColor: '#FFF' }}>
        <OnBoardView onRegisterDevice={this.registerDevice} onSkip={this.skip} />
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
    completeOnboarding: () => dispatch(completeOnboarding()),
    resetToCompanySelect: () => dispatch(resetToCompanySelect())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OnBoard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  paragraph: {
    width: 250,
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 15,
    lineHeight: 25
  },
  imageContainer: {
    marginTop: 20,
    alignSelf: 'center'
  },
  image: {
    width: 200,
    height: 150,
    alignSelf: 'center'
  },
  textTop: {
    marginTop: HEIGHT / 14,
    marginBottom: 10,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  textBottom: {
    marginTop: 10,
    color: theme.SECONDARY_TEXT_COLOR
  },
  textSkip: {
    marginTop: 25,
    color: theme.SECONDARY_TEXT_COLOR
  }
});