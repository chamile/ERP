// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from '../../components/CustomIcon';
import TimeAgo from 'react-native-timeago';
import { connect } from 'react-redux';

import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import ViewWrapper from '../../components/ViewWrapper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import ApprovalService from '../../services/ApprovalService';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

export class ApprovalItemDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('ApprovalItemDetails.index.title'),
      tabBarLabel: i18n.t('CustomDrawer.approvals'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerRight: null,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };
  constructor() {
    super();

    this.handleApprovalTap = this.handleApprovalTap.bind(this);
    this.handleRejectTap = this.handleRejectTap.bind(this);
  }

  handleApprovalDetailsErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ApprovalsList.index.errorGeneric')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  handleApprovalTap(title, message, btnText_1, btnText_2, approvalID) {
    AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalConfirm.bind(this, approvalID), null, btnText_1, btnText_2);
  }

  handleRejectTap(title, message, btnText_1, btnText_2, approvalID) {
    AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalReject.bind(this, approvalID), null, btnText_1, btnText_2);
  }

  async onApprovalConfirm(approvalID) {
    try {
      const approvalResponse = await ApprovalService.approveApproval(approvalID,  this.props.company.selectedCompany.Key);
      if (approvalResponse.data && approvalResponse.data.Message === 'Transition is not valid') {
        Alert.alert(i18n.t('ApprovalsList.ApprovalListRowBack.approved'));
      }
      this.props.navigation.state.params.refreshApprovalList ? this.props.navigation.state.params.refreshApprovalList() : null;
      this.props.navigation.goBack();
      this.refreshApprovals();
    } catch (error) {
      this.handleApprovalDetailsErrors(error.problem, null, i18n.t('ApprovalsList.index.approvalConfirmError'));
    }
  }

  async onApprovalReject(approvalID) {
    try {
      const approvalResponse = await ApprovalService.rejectApproval(approvalID,  this.props.company.selectedCompany.Key);
      if (approvalResponse.data && approvalResponse.data.Message === 'Transition is not valid') {
        Alert.alert(i18n.t('ApprovalsList.ApprovalListRowBack.rejected'));
      }
      this.props.navigation.state.params.refreshApprovalList ? this.props.navigation.state.params.refreshApprovalList() : null;
      this.props.navigation.goBack();
    } catch (error) {
      this.handleApprovalDetailsErrors(error.problem, null, i18n.t('ApprovalsList.index.approvalRejectError'));
    }
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-sad-outline" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderText}>{i18n.t('ApprovalItemDetails.index.noDetails')}</Text>
      </View>
    );
  }

  render() {
    const item = this.props.navigation.state.params.item ? this.props.navigation.state.params.item.Task : null;
    return (
      <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR}>
        <ScrollView
          scrollEventThrottle={200}
          onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
        >
          {item ?
            <View>
              <View style={styles.titleBox}>
                <Text style={styles.titleText}>{item.Title || 'Title'}</Text>
              </View>
              <View style={styles.subContainer}>
                <View style={styles.row}>
                  <View style={styles.leftContainer}>
                    <Text style={styles.subTitleText}>{i18n.t('ApprovalItemDetails.index.awardedBy')}</Text>
                  </View>
                  <View style={styles.rightContainer}>
                    <Text style={styles.timestampLabel}><TimeAgo time={item.CreatedAt} /></Text>
                  </View>
                </View>
                <View>
                  <InlineValidationInputField
                    title={i18n.t('ApprovalItemDetails.index.name')}
                    placeHolder={i18n.t('ApprovalItemDetails.index.notSpecified')}
                    isKeyboardInput={true}
                    editable={false}
                    value={item.User ? item.User.DisplayName : null}
                  />
                  <InlineValidationInputField
                    title={i18n.t('ApprovalItemDetails.index.email')}
                    placeHolder={i18n.t('ApprovalItemDetails.index.notSpecified')}
                    isKeyboardInput={true}
                    editable={false}
                    value={item.User ? item.User.Email : null}
                  />
                  <InlineValidationInputField
                    title={i18n.t('ApprovalItemDetails.index.phone')}
                    placeHolder={i18n.t('ApprovalItemDetails.index.notSpecified')}
                    isKeyboardInput={true}
                    editable={false}
                    value={item.User ? item.User.PhoneNumber : null}
                  />
                </View>
              </View>
            </View>
            : this.renderPlaceholder()}
        </ScrollView>
        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
            <GenericButton
              text={i18n.t('ApprovalItemDetails.index.reject')}
              textStyle={styles.addNewItemButtonText}
              buttonStyle={styles.addNewItemButton}
              onPress={() => this.handleRejectTap(
                i18n.t('ApprovalsList.ApprovalListRowBack.confirm'),
                i18n.t('ApprovalsList.ApprovalListRowBack.sure'),
                i18n.t('ApprovalsList.ApprovalListRowBack.reject'),
                i18n.t('ApprovalsList.ApprovalListRowBack.cancel'),
                item.ID
              )}
            />
            <GenericButton
              text={i18n.t('ApprovalItemDetails.index.approve')}
              buttonStyle={styles.actionButton}
              onPress={() => this.handleApprovalTap(
                i18n.t('ApprovalsList.ApprovalListRowBack.confirm'),
                i18n.t('ApprovalsList.ApprovalListRowBack.sure'),
                i18n.t('ApprovalsList.ApprovalListRowBack.approve'),
                i18n.t('ApprovalsList.ApprovalListRowBack.cancel'),
                item.ID
              )}
            />
        </FloatingBottomContainer>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company
  };
};

export default connect(
  mapStateToProps,
)(ApprovalItemDetails);

const styles = StyleSheet.create({
  titleBox: {
    marginTop: 30,
    paddingHorizontal: 15,
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 10,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  titleText: {
    fontSize: 16,
    color: theme.PRIMARY_COLOR,
    fontWeight: '600'
  },
  subContainer: {
    marginTop: 25,
  },
  subTitleText: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '700',
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
  },
  subInfoText: {
    paddingBottom: 15,
    fontSize: 13,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  actionButton: {
    height: 35,
    flex: 1,
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
    marginHorizontal: 15,
  },
  addNewItemButton: {
    height: 35,
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
  },
  addNewItemButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400'
  },
  row: {
    flexDirection: 'row',
  },
  timestampLabel: {
    fontSize: 12,
    color: theme.SECONDARY_TEXT_COLOR,
    paddingVertical: 15,
    paddingRight: 20.5,
    alignItems: 'flex-end',
    flex: 1,
  },
  leftContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  rightContainer: {
    alignItems: 'flex-end',
    flex: 1,
  }
});
