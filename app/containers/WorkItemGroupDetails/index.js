// @flow
import React, { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
  InteractionManager,
  Platform,
  View,
  Animated,
  Easing,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import Analytics from 'appcenter-analytics';
import ActionSheet from 'react-native-actionsheet';
import Icon from '../../components/CustomIcon';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import WorkerService from '../../services/WorkerService';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';
import { CalendarStrip } from '../../components/CalendarStrip';
import { WorkLogs } from '../HoursList/WorkLogs';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { changeTimerInfo } from '../../actions/timerActions';
import WorkItemApprovalService from '../../services/WorkItemApprovalService';

const WIDTH: number = Dimensions.get('window').width;

// should send selectedDate as moment obj or string with navigation params
class WorkItemGroupDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: `${i18n.t('WorkItemGroupDetails.index.week')} ${navigation.state.params.selectedDate ? moment.isMoment(navigation.state.params.selectedDate) ? navigation.state.params.selectedDate.isoWeek() : moment(navigation.state.params.selectedDate).isoWeek() : '1'} ${i18n.t('WorkItemGroupDetails.index.details')}`,
      headerLeft: <HeaderBackButton onPress={() => { navigation.state.params.disabled ? null : navigation.goBack(); }} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      isReady: false,
      workerId: null,
      workerRelationID: null,
      workLogTimeStamp: new Date(), // to keep track whether hours list should updates if newer changes available
      isWeekRejected: false,
      moveAnimation: new Animated.Value(0),
      actionMessage: i18n.t('WorkItemGroupDetails.index.unlockWeekForEditing')
    };

    this.fetchWorker = this.fetchWorker.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.updateCalendarTotalCell = this.updateCalendarTotalCell.bind(this);
    this.addNewWorkLog = this.addNewWorkLog.bind(this);
    this.updateCalendar = this.updateCalendar.bind(this);
    this.fetchWorkerRelations = this.fetchWorkerRelations.bind(this);
    this.updateWorkLogTimeStamp = this.updateWorkLogTimeStamp.bind(this);
    this.onChangeSuccess = this.onChangeSuccess.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
    this.unlockWeek = this.unlockWeek.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.navigateToRejectionReason = this.navigateToRejectionReason.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({
      disabled: true
    });
    this.fetchWorker();
    this.setState({ isWeekRejected: !!this.props.navigation.state.params.isWeekRejected });
  }

  fetchWorker() {
    const companyKey = this.props.company.selectedCompany.Key;
    WorkerService.getOrCreateWorkerFromUser(companyKey, this.props.navigation.state.params.navigateFrom != null ? this.props.navigation.state.params.userId : this.props.user.activeUser.userId)
      .then(res => res.data)
      .then((worker) => {
        const today = this.props.navigation.state.params.selectedDate ? moment.isMoment(this.props.navigation.state.params.selectedDate) ? this.props.navigation.state.params.selectedDate : moment(this.props.navigation.state.params.selectedDate) : moment();
        this.setState({
          workerId: worker.ID,
          isReady: true,
          selectedDate: { day: today }
        });
        this.props.navigation.setParams({
          disabled: false
        });
        this.fetchWorkerRelations();
        InteractionManager.runAfterInteractions(() => {
          this.calendar ? this.calendar.jumpToDate(today) : null;
        });
      })
      .catch((error) => {
        this.props.navigation.setParams({
          disabled: false
        });
        this.handleErrors(error.problem, this.fetchWorker, i18n.t('WorkItemGroupDetails.index.getCurrentUserError'));
      });
  }

  fetchWorkerRelations() {
    const companyKey = this.props.company.selectedCompany.Key;
    const companyName = this.props.company.selectedCompany.Name;
    const { workerId } = this.state;
    WorkerService.getRelationsForWorker(companyKey, workerId, companyName)
      // get the first WorkRelation entity
      .then(workRelation => this.setState({ workerRelationID: Array.isArray(workRelation.data) ? workRelation.data[0].ID : workRelation.data.ID }))
      .catch(error => this.handleErrors(error.problem, this.fetchWorkerRelations, i18n.t('WorkItemGroupDetails.index.fetchRelationsForWorkerError')));
  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('WorkItemGroupDetails.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  updateCalendarTotalCell(totalMins, selectedDate) {
    if (this.calendar) {
      this.calendar.updateTotalWorkHoursForDay(totalMins, selectedDate);
    }
  }

  updateWorkLogTimeStamp() {
    this.setState({ workLogTimeStamp: new Date() });
  }

  addNewWorkLog(timeLog) {
    const companyKey = this.props.company.selectedCompany.Key;
    const data = this._getWorkItemFromTimeLog(timeLog);
    WorkerService.createWorkLog(companyKey, data)
      .then((response) => {
        if (!response.ok) {
          this.handleErrors(response.problem, this.addNewWorkLog.bind(null, timeLog), i18n.t('WorkItemGroupDetails.index.addNewWorkLogError'));
        }
        this.stopTimer();
        this.fetchCalendarTotalHoursForDay(this.state.selectedDate);
        this.updateWorkLogTimeStamp();
        this.onChangeSuccess();
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.addNewWorkLog.bind(null, timeLog), i18n.t('WorkItemGroupDetails.index.addNewWorkLogError'));
      });
    Analytics.trackEvent(AnalyticalEventNames.ADD_NEW_WORKLOG, {
      From: 'Timer',
    });
  }

  stopTimer() {
    const companyKey = this.props.company.selectedCompany.Key;
    const companies = this.props.timer.companies;
    companies[companyKey] = {
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
    this.props.changeTimerInfo(companies);
  }

  fetchCalendarTotalHoursForDay(selectedDate) {
    const companyKey = this.props.company.selectedCompany.Key;
    const { workerRelationID } = this.state;
    WorkerService.getTotalLoggedTime(companyKey, workerRelationID, selectedDate.day.format('YYYY-MM-DD'), selectedDate.day.format('YYYY-MM-DD'))
      .then(({ data, ok, problem }) => {
        if (!ok) {
          this.handleErrors(problem, this.fetchCalendarTotalHoursForDay.bind(null, selectedDate), i18n.t('WorkItemGroupDetails.index.getTotalLoggedTimeError'));
        }
        if (data.Data.length) {
          this.updateCalendarTotalCell(data.Data[0].summinutes, selectedDate);
        }
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.fetchCalendarTotalHoursForDay.bind(null, selectedDate), i18n.t('WorkItemGroupDetails.index.getTotalLoggedTimeError'));
      });
  }

  _getWorkItemFromTimeLog(timeLog) {
    const workItem = {
      WorkRelationID: this.state.workerRelationID,
      Date: this.state.selectedDate.day.toISOString().substring(0, 10) + 'T00:00:00.000Z',
      StartTime: new Date(timeLog.startTime).toISOString(),
      EndTime: new Date(timeLog.endTime).toISOString(),
      WorkTypeID: timeLog.workType.id,
      Dimensions: { ProjectID: timeLog.project.id, DepartmentID: timeLog.department.id },
      CustomerOrderID: timeLog.order.id,
      LunchInMinutes: Number(timeLog.lunchInMinutes),
      Description: timeLog.description
    };
    return workItem;
  }

  updateCalendar(day) {
    if (this.calendar) {
      this.calendar.jumpToDate(day);
      this.setState({ selectedDate: { day } });
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

  unlockWeek() {
    this.startAnimation();
    WorkItemApprovalService.getDraftWorkItemGroupsForEditWeek(this.props.company.selectedCompany.Key, this.state.workerRelationID, moment(this.state.selectedDate.day).startOf('W').format('YYYY-MM-DD'), moment(this.state.selectedDate.day).endOf('W').format('YYYY-MM-DD'))
      .then((res) => {
        if (res.ok) {
          if (res.data.Data.length > 0 ) {
            Promise.all([...res.data.Data.map(e => WorkItemApprovalService.deleteWorkItemGroup(this.props.company.selectedCompany.Key, e.ID))])
              .then((responses) => {
                this.startAnimation(true);
                this.setState({ isReady: false, isWeekRejected: false });
                this.props.navigation.state.params.refreshList ? this.props.navigation.state.params.refreshList() : null;
                this.fetchWorker();
              });
          }
          else {
            this.setState({ isWeekRejected: false });
            this.props.navigation.state.params.refreshList ? this.props.navigation.state.params.refreshList() : null;
            this.startAnimation(true);
          }
        }
        else {
          this.startAnimation(true);
          this.handleErrors('CLIENT_ERROR', null, i18n.t('WorkItemGroupDetails.index.enablingEditWeekFailed'));
        }
      })
      .catch((e) => {
        this.startAnimation(true);
        this.handleErrors(e.problem, null, i18n.t('WorkItemGroupDetails.index.enablingEditWeekFailed'));
      });
  }

  onChangeSuccess() {
    this.props.navigation.state.params.refreshList ? this.props.navigation.state.params.refreshList() : null;
  }

  showActionSheet() {
    this.ButtonActionSheet.show();
  }

  handleActionItemPress(index) {
    switch (index) {
      case 2:
        this.unlockWeek();
        break;
      case 1:
        this.props.navigation.navigate('AddNewWorkLog',
          {
            isEditMode: false,
            workerRelationID: this.state.workerRelationID,
            selectedDate: this.state.selectedDate,
            updateCalendar: this.updateCalendar,
            updateWorkLogTimeStamp: this.updateWorkLogTimeStamp.bind(this),
            onChangeSuccess: this.onChangeSuccess,
          });
        break;
    }
  }

  navigateToRejectionReason() {
    this.props.navigation.navigate('HoursRejectionMessage', {
      selectedDate: this.state.selectedDate.day ? moment(this.state.selectedDate.day) : moment(),
      workerRelationID: this.state.workerRelationID,
      WorkItemGroupID: null,
      successCallback: () => { 
        this.updateWorkLogTimeStamp();
        this.setState({ isWeekRejected: false });
        this.onChangeSuccess();
      },
    });
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={this.state.isReady} loaderPosition={'nav'}>
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
              style={[{ height: 80, }]}
              size="small"
            />
            <View style={styles.animatedPanelText}>
              <Text>{`${this.state.actionMessage} ...`}</Text>
            </View>
          </View>
        </Animated.View>
        {this.state.isWeekRejected ? (
          <TouchableOpacity style={styles.rejectionMsgContainer} onPress={this.navigateToRejectionReason}>
            <Text style={styles.rejectedText}>{i18n.t('WorkItemGroupDetails.index.rejected')}</Text>
            <View style={styles.rightContainer}><Text style={styles.rejectedReasonText}>{i18n.t('WorkItemGroupDetails.index.showReason')}</Text><Icon name={'ios-arrow-forward-outline'} color={theme.SCREEN_COLOR_LIGHT_GREY_2} size={20} style={styles.arrowIcon} /></View>
          </TouchableOpacity>
        ) : null}
        <CalendarStrip
          ref={ref => this.calendar = ref}
          daysInRow={7}
          parentProps={this.props} // accessing token and company key from parent props
          dateSelectedCallback={(selectedDate) => {
            this.setState({ selectedDate, isLoadingEvents: true });
          }}
          showWeekNumber={true}
          loadSelectedWeekOnly={true}
          userId={this.props.navigation.state.params.userId}
          disabled={(this.props.navigation.state.params && this.props.navigation.state.params.calendarDisabled) ? this.props.navigation.state.params.calendarDisabled : false}
        />

        <WorkLogs
          addNewWorkLog={this.addNewWorkLog}
          stopTimer={this.stopTimer}
          timer={this.props.timer.companies[this.props.company.selectedCompany.Key]}
          navigation={this.props.navigation}
          ref={ref => this.workLogsList = ref}
          parentProps={this.props}
          workerRelationID={this.state.workerRelationID}
          selectedDate={this.state.selectedDate}
          timeStamp={this.state.workLogTimeStamp}
          updateWorkLogTimeStamp={this.updateWorkLogTimeStamp}
          updateCalendar={this.updateCalendar}
          updateCalendarTotalCell={this.updateCalendarTotalCell}
          scrollEventThrottle={200}
          onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
          onChangeSuccess={this.onChangeSuccess}
          disableTimer={true}
          ListFooterComponent={() => <View style={{ height: 80 }} />}
          editDisabled={(this.props.navigation.state.params && this.props.navigation.state.params.isViewOnly)}
        />

        {this.props.navigation.state.params.navigateFrom == null ? (
          <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref} height={55}>
            {this.state.isWeekRejected ? (
              <GenericButton
                text={i18n.t('WorkItemGroupDetails.index.editHours')}
                buttonStyle={styles.addButton}
                textStyle={styles.addNewWorklogButtonText}
                onPress={this.showActionSheet}
              />
            ): (
              <GenericButton
                text={i18n.t('WorkItemGroupDetails.index.addHours')}
                buttonStyle={styles.addButton}
                textStyle={styles.addNewWorklogButtonText}
                onPress={() => {
                  this.props.navigation.navigate('AddNewWorkLog',
                    {
                      isEditMode: false,
                      workerRelationID: this.state.workerRelationID,
                      selectedDate: this.state.selectedDate,
                      updateCalendar: this.updateCalendar,
                      updateWorkLogTimeStamp: this.updateWorkLogTimeStamp.bind(this),
                      onChangeSuccess: this.onChangeSuccess,
                    });
                }}
              />
            )}
          </FloatingBottomContainer>
        ) : null}
        <ActionSheet
          ref={actionSheet => this.ButtonActionSheet = actionSheet}
          options={[
            i18n.t('WorkItemGroupDetails.index.cancel'),
            i18n.t('WorkItemGroupDetails.index.addMoreHours'),
            i18n.t('WorkItemGroupDetails.index.editWeek'),
          ]}
          cancelButtonIndex={0}
          onPress={this.handleActionItemPress}
        />
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    timer: state.timer
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeTimerInfo: timeLog => dispatch(changeTimerInfo(timeLog)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkItemGroupDetails);

const styles = StyleSheet.create({
  addButton: {
    height: 35,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    width: 3 * (WIDTH / 4),
  },
  addNewWorklogButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
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
  rejectionMsgContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    maxHeight: 40,
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
