// @flow
import React, { Component } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  Animated,
  Easing,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import ActionSheet from 'react-native-actionsheet';
import Icon from '../../components/CustomIcon';
import _ from 'lodash';

import { getHeaderStyle } from '../../helpers/UIHelper';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ApprovalService from '../../services/ApprovalService';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { ApprovalStatusCodes } from '../../constants/ApprovalConstants';
import WorkItemApprovalService from '../../services/WorkItemApprovalService';

const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

class HoursApproval extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('HoursApproval.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
    };
  };

  constructor() {
    super();
    this.state = {
      approvalId: null,
      isRefreshing: false,
      isLoading: false,
      actionList: [],
      moveAnimation: new Animated.Value(0),
      actionMessage: '',
      error: false,
      sun_Obj: null,
      mon_Obj: null,
      tue_Obj: null,
      wed_Obj: null,
      thu_Obj: null,
      fri_Obj: null,
      sat_Obj: null,
      sum_time: 0,
      weekNo: 0,
      weekStartDate: '',
      weekEndDate: '',
      displayName: '',
      taskItem: null,
      showRejectionMessage: false,
      description: i18n.t('HoursApproval.index.weekTimeInfo'),
    };
    this.fetchData = this.fetchData.bind(this);
    this.getButtonActions = this.getButtonActions.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.fetchWorklogItemGroup = this.fetchWorklogItemGroup.bind(this);
    this.calculateSum = this.calculateSum.bind(this);
    this.getWeekDetails = this.getWeekDetails.bind(this);
    this.populateData = this.populateData.bind(this);
    this.navigateToWorkLog = this.navigateToWorkLog.bind(this);
    this.handleRejectTap = this.handleRejectTap.bind(this);
    this.handleApprovalTap = this.handleApprovalTap.bind(this);
    this.getSumforDisplay = this.getSumforDisplay.bind(this);
    this.addCommentToWorkGroup = this.addCommentToWorkGroup.bind(this);
    this.onWorkItemGroupReject = this.onWorkItemGroupReject.bind(this);
    this.navigateToRejectionReason = this.navigateToRejectionReason.bind(this);
  }

  populateData() {
    this.getButtonActions();
    this.fetchData();
  }

  componentDidMount() {
    const taskItemID = this.props.navigation.state.params.itemID;
    const generateShowRejectionMessageBool = !!this.props.navigation.state.params.showRejectionMessage;
    const companyKey = this.props.company.selectedCompany.Key;
    const { userId } = this.props.user.activeUser;
    ApprovalService.getAllApprovalById(taskItemID, userId, companyKey)
      .then((response) => {
        if (response.ok) {
          this.setState({ taskItem: response.data, showRejectionMessage:  (generateShowRejectionMessageBool && (response.data.StatusCode === ApprovalStatusCodes.REJECTED)) }, () => { this.populateData(); });
        }
        else {
          this.setState({ error: true });
        }
      })
      .catch(() => {
        this.setState({ error: true });
      });
  }

  getButtonActions() {
    const actionList = [];
    actionList.push({ action: 'approve', display: i18n.t('HoursApproval.index.approve') });
    actionList.push({ action: 'reject', display: i18n.t('HoursApproval.index.reject') });
    this.setState({ actionList });
  }

  showActionSheet() {
    this.ButtonActionSheet.show();
  }

  handleRejectTap(title, message, btnText_1, btnText_2, approvalID) {
    if (this.state.taskItem.Task.Model.Name == "WorkItemGroup")
      this.onWorkItemGroupReject(approvalID)
    else
      AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalReject.bind(this, approvalID), null, btnText_1, btnText_2);
  }

  handleApprovalTap(title, message, btnText_1, btnText_2, approvalID) {
    AlertService.showSimpleAlert(title, message, AlertType.CONFIRMATION, this.onApprovalConfirm.bind(this, approvalID), null, btnText_1, btnText_2);
  }

  handleActionItemPress(index) {
    switch (index) {
      case 1:
        this.handleApprovalTap(i18n.t('HoursApproval.index.confirm'), i18n.t('HoursApproval.index.sure'), i18n.t('HoursApproval.index.approve'), i18n.t('HoursApproval.index.cancel'), this.state.approvalId);
        break;
      case 2:
        this.handleRejectTap(i18n.t('HoursApproval.index.confirm'), i18n.t('HoursApproval.index.sure'), i18n.t('HoursApproval.index.reject'), i18n.t('HoursApproval.index.cancel'), this.state.approvalId);
        break;
    }
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: reverse ? 0 : 1,
        duration: 250,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  calculateSum(approvalId) {
    const sum = (this.state.sat_Obj == null ? 0 : this.state.sat_Obj.sat_time)
      + (this.state.sun_Obj == null ? 0 : this.state.sun_Obj.sun_time)
      + (this.state.mon_Obj == null ? 0 : this.state.mon_Obj.mon_time)
      + (this.state.tue_Obj == null ? 0 : this.state.tue_Obj.tue_time)
      + (this.state.wed_Obj == null ? 0 : this.state.wed_Obj.wed_time)
      + (this.state.thu_Obj == null ? 0 : this.state.thu_Obj.thu_time)
      + (this.state.fri_Obj == null ? 0 : this.state.fri_Obj.fri_time);
    this.setState({ sum_time: sum }, () => {
      this.setState({ isLoading: true, approvalId });
    });
  }

  calculateReportedTime(workItems) {
    if (workItems.length == 0) {
      return 0;
    }
    else if (workItems.length == 1) {
      return (workItems[0].Minutes);
    }
    else if (workItems.length > 1) {
      let time = 0;
      workItems.forEach((item) => {
        time = time + item.Minutes;
      });
      return time;
    }
  }

  calculateReportedTime(workItems) {
    if (workItems.length == 0) {
      return 0;
    }
    else if (workItems.length == 1) {
      return (workItems[0].Minutes);
    }
    else if (workItems.length > 1) {
      let time = 0;
      workItems.forEach((item) => {
        time = time + item.Minutes;
      });
      return time;
    }
  }

  async fetchWorklogItemGroup() {
    const companyKey =  this.props.company.selectedCompany.Key;
    let approvalId = this.state.taskItem.ID;
    let entityID = this.state.taskItem.Task.EntityID;
    let displayName = this.state.taskItem.Task.User.DisplayName;
    this.setState({ displayName });

    WorkItemApprovalService.getWorkItemGroup(companyKey, entityID).then((workItemGroup) => {
      this.getWeekDetails(workItemGroup);
      const groupedWorkItemsByDay = _.groupBy(workItemGroup.data.Items, item => moment(item.Date).format('YYYY-MM-DD'));
        
      const result = _.map(groupedWorkItemsByDay, (value, key) => {
        return { date: key, day: moment(key).format('dddd').toUpperCase(), workItems: value };
      });
      const daysInWeek = moment.weekdays(false);
      result.forEach((item) => {
        switch (item.day) {
          case daysInWeek[0].toUpperCase():
            // SUNDAY
            this.setState({ sun_Obj: { sun_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[1].toUpperCase():
            // MONDAY
            this.setState({ mon_Obj: { mon_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[2].toUpperCase():
            // TUESDAY
            this.setState({ tue_Obj: { tue_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[3].toUpperCase():
            // WEDNSDAY
            this.setState({ wed_Obj: { wed_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[4].toUpperCase():
            // THURSDAY
            this.setState({ thu_Obj: { thu_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[5].toUpperCase():
            // FRIDAY
            this.setState({ fri_Obj: { fri_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          case daysInWeek[6].toUpperCase():
            // SATURDAY
            this.setState({ sat_Obj: { sat_time: this.calculateReportedTime(item.workItems), selectedDate: item.date, workerRelationID: item.workItems[0].WorkRelationID } });
            break;
          default:
                    // code block
        }
      });
      this.calculateSum(approvalId);
    }).catch((error) => {
      if (error.status !== 404)
      {
        this.setState({ isLoading: true, error: true });
        // this.handleErrors(error.problem, null, i18n.t('HoursApproval.index.somethingWrong'));
      }
      else
      {
        this.setState({ isLoading: true, error: true });
      }
    });
  }

  async getWeekDetails(workItemGroup) {
    const weekNo = moment(workItemGroup.data.Items[0].Date).format('WW');
    const weekStartDate = moment(workItemGroup.data.Items[0].Date).startOf('isoWeek').format('DD MMM');
    const weekEndDate = moment(workItemGroup.data.Items[0].Date).startOf('isoWeek').add(6, 'days').format('DD MMM');
    const description = workItemGroup.data.WorkRelation && workItemGroup.data.WorkRelation.Description ? workItemGroup.data.WorkRelation.Description : i18n.t('HoursApproval.index.weekTimeInfo');
    this.setState({ weekNo, weekStartDate, weekEndDate, description ,selectedItem: workItemGroup.data.Items[0]});
  }

  fetchData() {
    this.fetchWorklogItemGroup();
    this.setState({ isLoading: false });
  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('HoursApproval.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  getSumforDisplay() {
    return (this.state.sum_time / 60);
  }

  // ------------------------------ APPROVE/REJECT methods ----------------------------------------

  async onApprovalConfirm(approvalID) {
    this.setState({ actionMessage: i18n.t('HoursApproval.index.approving') });
    this.startAnimation();
    const companyKey = this.props.company.selectedCompany.Key;
    try {
      const approvalResponse = await ApprovalService.approveApproval(approvalID, companyKey);
      if (approvalResponse.data == null) {
        this.props.navigation.goBack();
        this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null;
        this.startAnimation(true);
      }
    } catch (error) {
      this.startAnimation(true);
      this.handleErrors(error.problem, null, i18n.t('HoursApproval.index.approvalConfirmError'));
    }
  }


  async addCommentToWorkGroup(comment) {
    const companyKey = this.props.company.selectedCompany.Key;
    let entityID = this.state.taskItem.Task.EntityID;
    try {
      const approvalResponse = await ApprovalService.addCommentAtRejection(comment, entityID, companyKey);
    } catch (error) {
      throw error;
    }
  }

  async onWorkItemGroupReject(approvalID) {
    this.props.navigation.navigate({
      key: 'HoursRejectView',
      routeName: 'HoursRejectView',
      params: {
        disableActionButton: false,
        approvalID: approvalID,
        taskItem: this.state.taskItem,
        refreshApprovals: () => { this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null; },
        goBack: () => { this.props.navigation.goBack() },
        parent: 'HOURS_APPROVAL'
      },
    });
  }


  async onApprovalReject(approvalID) {
    this.setState({ actionMessage: i18n.t('HoursApproval.index.rejecting') });
    this.startAnimation();
    const companyKey = this.props.company.selectedCompany.Key;
    try {
      const approvalResponse = await ApprovalService.rejectApproval(approvalID, companyKey);
      if (approvalResponse.data == null) {
        this.setState({ isLoading: true });
        this.props.navigation.goBack();
        this.startAnimation(true);
        this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null;
      }
    } catch (error) {
      this.startAnimation(true);
      this.handleErrors(error.problem, null, i18n.t('HoursApproval.index.approvalRejectError'));
    }
  }

  // ------------------------------ APPROVE/REJECT methods ----------------------------------------

  navigateToWorkLog(selectedDate, workerRelationID) {
    this.props.navigation.navigate({
      key: 'WorkItemGroupDetails',
      routeName: 'WorkItemGroupDetails',
      params: { selectedDate, workerRelationID, navigateFrom: 'HOURS_APPROVALS', userId: this.state.taskItem.Task.User.ID, disabled: true, isViewOnly: true },
    });
  }

  navigateToRejectionReason() {
    this.props.navigation.navigate('HoursRejectionMessage', {
      selectedDate: moment(moment(this.state.selectedItem.Date).format('YYYY-MM-DD')),
      workerRelationID: this.state.selectedItem.WorkRelationID,
      WorkItemGroupID: null,
      successCallback: null,
      isViewOnly: true,
    });
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name={'ios-sad-outline'} size={40} color={theme.SECONDARY_TEXT_COLOR} />
        <Text style={styles.placeholderText} >{i18n.t('HoursApproval.index.approvalFetchingFailed')}</Text>
      </View>
    );
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'} toBackgroundStyle={{ backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2 }}>
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
            <View style={styles.animatedPanelText}>
              <Text>{`${this.state.actionMessage} ...`}</Text>
            </View>
          </View>
        </Animated.View>
        {this.state.error ? this.renderPlaceholder() : null}
        <ScrollView
          refreshControl={(
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={() => { this.fetchWorklogItemGroup(); }}
            />
          )}
          scrollEventThrottle={200}
          onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
        >
          {this.state.error ? null :
            <View style={styles.detailsContainer}>
             {this.state.showRejectionMessage ? (
                <TouchableOpacity style={styles.rejectionMsgContainer} onPress={this.navigateToRejectionReason}>
                  <Text style={styles.rejectedText}>{i18n.t('WorkItemGroupDetails.index.rejected')}</Text>
                  <View style={styles.rightContainer}><Text style={styles.rejectedReasonText}>{i18n.t('WorkItemGroupDetails.index.showReason')}</Text><Icon name={'ios-arrow-forward-outline'} color={theme.SCREEN_COLOR_LIGHT_GREY_2} size={20} style={styles.arrowIcon} /></View>
                </TouchableOpacity>
              ) : null}
              <View style={styles.userInfo}>
                <View style={styles.userInfo_top}>
                  <Text style={styles.workerName}>{_.startCase(this.state.displayName)}</Text>
                  <Text style={styles.workerSummery}>{_.capitalize(this.state.description)}</Text>
                </View>
                <View style={styles.userInfo_bottom}>
                  <View style={styles.userInfo_bottom_left}>
                    <View style={{
                      height: 80,
                      justifyContent: 'center',
                      paddingLeft: 30
                    }}
                    >
                      <Text style={{ color: theme.SYSTEM_COLOR_LIGHT_GRAY_3, fontWeight: '400', fontSize: 15 }}>{i18n.t('HoursApproval.index.week')} {this.state.weekNo} </Text>
                      <Text style={{ paddingTop: 10, fontWeight: '500', fontSize: 17 }}>
                        <Icon name="ios-calendar-outline" size={22} />{'  ' + this.state.weekStartDate + ' - ' + this.state.weekEndDate} </Text>
                    </View>
                  </View>
                  <View style={styles.userInfo_bottom_right}>
                    <View style={{
                      height: 80,
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      paddingRight: 30
                    }}
                    >
                      <Text style={{ color: theme.SYSTEM_COLOR_LIGHT_GRAY_3, fontWeight: '400', fontSize: 15 }}>{i18n.t('HoursApproval.index.sum')}</Text>
                      <Text style={this.getSumforDisplay() < 37.5 ? styles.lessTime : styles.plusTime}>{this.getSumforDisplay().toFixed(1).replace(".", ",")} {i18n.t('App.hour')}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.details}>
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.monday')}
                  placeHolder={'-'}
                  isKeyboardInput={false}
                  value={this.state.mon_Obj == null ? '0' : (this.state.mon_Obj.mon_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.mon_Obj != null ? this.navigateToWorkLog(this.state.mon_Obj.selectedDate, this.state.mon_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.mon_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.tuesday')}
                  placeHolder={'-'}
                  isKeyboardInput={false}
                  value={this.state.tue_Obj == null ? '0' : (this.state.tue_Obj.tue_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.tue_Obj != null ? this.navigateToWorkLog(this.state.tue_Obj.selectedDate, this.state.tue_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.tue_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.wednesday')}
                  placeHolder={'-'}
                  isKeyboardInput={false}
                  value={this.state.wed_Obj == null ? '0' : (this.state.wed_Obj.wed_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.wed_Obj != null ? this.navigateToWorkLog(this.state.wed_Obj.selectedDate, this.state.wed_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.wed_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.thursday')}
                  placeHolder={'-'}
                  isKeyboardInput={false}
                  value={this.state.thu_Obj == null ? '0' : (this.state.thu_Obj.thu_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.thu_Obj != null ? this.navigateToWorkLog(this.state.thu_Obj.selectedDate, this.state.thu_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.thu_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.friday')}
                  placeHolder={'-'}
                  isKeyboardInput={false}
                  value={this.state.fri_Obj == null ? '0' : (this.state.fri_Obj.fri_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.fri_Obj != null ? this.navigateToWorkLog(this.state.fri_Obj.selectedDate, this.state.fri_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.fri_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.saturday')}
                  placeHolder={''}
                  isKeyboardInput={false}
                  value={this.state.sat_Obj == null ? null : (this.state.sat_Obj.sat_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.sat_Obj != null ? this.navigateToWorkLog(this.state.sat_Obj.selectedDate, this.state.sat_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.sat_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
                <InlineValidationInputField
                  title={i18n.t('HoursApproval.index.sunday')}
                  placeHolder={''}
                  isKeyboardInput={false}
                  value={this.state.sun_Obj == null ? null : (this.state.sun_Obj.sun_time / 60).toFixed(1).replace(".", ",")}
                  onPress={() => { this.state.sun_Obj != null ? this.navigateToWorkLog(this.state.sun_Obj.selectedDate, this.state.sun_Obj.workerRelationID) : null; }}
                  error={null}
                  textInputStyle={this.state.sun_Obj == null ? styles.zeroTime : null}
                  textInputBgColor={styles.whiteBgColor}
                />
              </View>
              <View style={{ height: 120 }} />
            </View>
          }
          </ScrollView>

          <ActionSheet
            ref={actionSheet => this.ButtonActionSheet = actionSheet}
            options={[
              i18n.t('HoursApproval.index.cancel'),
              ...this.state.actionList.map(actionItem => actionItem.display),
            ]
                    }
            destructiveButtonIndex={_.findIndex(this.state.actionList, actionItem => actionItem.action === 'reject') + 1}
            cancelButtonIndex={0}
            onPress={this.handleActionItemPress}
          />
          {
                    (this.state.taskItem != null && (this.state.taskItem.StatusCode != ApprovalStatusCodes.APPROVED) && (this.state.taskItem.StatusCode == ApprovalStatusCodes.ACTIVE)
                        && (this.state.taskItem.StatusCode != ApprovalStatusCodes.REJECTED)) ? (
                          <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
                            <GenericButton text={i18n.t('HoursApproval.index.actions')} buttonStyle={styles.actionButton} onPress={this.showActionSheet} />
                          </FloatingBottomContainer>
                      )
                      : null
                }
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

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HoursApproval);

const styles = StyleSheet.create({
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  actionButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  userInfo: {
    height: 185,
    alignItems: 'stretch',
  },
  userInfo_top: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo_bottom: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.PRIMARY_BACKGROUND_COLOR,
    flexDirection: 'row'
  },
  userInfo_bottom_left: {
    flex: 2,
    height: 80,
  },
  userInfo_bottom_right: {
    flex: 1,
    height: 80,
  },
  workerName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.HINT_TEXT_COLOR
  },
  workerSummery: {
    paddingTop: 5,
    color: theme.HINT_TEXT_COLOR
  },
  details: {
    flex: 1
  },
  scrollView: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 59,
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
    alignItems: 'center',
    flexDirection: 'row'
  },
  animatedPanelText: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  zeroTime: {
    color: 'red'
  },
  whiteBgColor: {
    backgroundColor: theme.SYSTEM_COLOR_WHITE
  },
  lessTime: {
    paddingTop: 10,
    fontWeight: '400',
    fontSize: 20,
    color: theme.SYSTEM_COLOR_LIGHT_RED
  },
  plusTime: {
    paddingTop: 10,
    fontWeight: '400',
    fontSize: 20,
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 5,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  rejectionMsgContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    height: 40,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  rejectedText: {
    color: theme.SYSTEM_COLOR_LIGHT_RED,
    fontSize: 14,
    flex: 1,
  },
  rejectedReasonText: {
    color: theme.SCREEN_COLOR_LIGHT_GREY_2,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 5,
    fontWeight: '300',
  },
  rightContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    opacity: 0.8,
    marginTop: 2,
  },
});
