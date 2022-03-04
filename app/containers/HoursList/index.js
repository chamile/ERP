// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import Icon from '../../components/CustomIcon';
import Analytics from 'appcenter-analytics';
import ActionSheet from 'react-native-actionsheet';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import WorkerService from '../../services/WorkerService';
import { DrawerIcon } from '../../components/DrawerIcon';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { CalendarStrip } from '../../components/CalendarStrip';
import AngleHeader from '../../components/AngleHeader';
import { StatisticsIcon } from '../../components/StatisticsIcon';
import { WorkLogs } from './WorkLogs';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import PermissionChecker from '../../helpers/PermissionChecker';
import { changeTimerInfo } from '../../actions/timerActions';
import { PermissionType } from '../../constants/PermissionTypes';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import GenericButton from '../../components/GenericButton';

class HoursList extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('HoursList.index.title'),
      headerLeft: <DrawerIcon />,
      headerRight: <StatisticsIcon navigate={navigation.navigate} disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isReady: false,
      workerId: null,
      workerRelationID: null,
      moveAnimation: new Animated.Value(0),
      workLogTimeStamp: new Date(), // to keep track whether hours list should updates if newer changes available
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_TIMETRACKING),
      rightButtonactionList: [],
    };

    this.fetchWorker = this.fetchWorker.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.updateCalendarTotalCell = this.updateCalendarTotalCell.bind(this);
    this.addNewWorkLog = this.addNewWorkLog.bind(this);
    this.updateCalendar = this.updateCalendar.bind(this);
    this.fetchWorkerRelations = this.fetchWorkerRelations.bind(this);
    this.updateWorkLogTimeStamp = this.updateWorkLogTimeStamp.bind(this);
    this.getRightButtonActions = this.getRightButtonActions.bind(this);
    this.showRightButtonActionSheet = this.showRightButtonActionSheet.bind(this);
    this.handleRightActionItemPress = this.handleRightActionItemPress.bind(this);
    this.resetActionsList = this.resetActionsList.bind(this);
  }

  componentDidMount() {
    this.getRightButtonActions();
    this.state.hasPermissionToModule
      ? this.fetchWorker()
      : InteractionManager.runAfterInteractions(() => {
        this.setState({ isReady: true }, () => {
          this.calendar ? this.calendar.jumpToDate(moment(), true) : null;
          this.props.navigation.setParams({
            isActionButtonDisabled: true
          });
        });
      });
  }

  fetchWorker() {
    const companyKey = this.props.company.selectedCompany.Key;
    WorkerService.getOrCreateWorkerFromUser(companyKey, this.props.user.activeUser.userId)
      .then(res => res.data)
      .then(worker => {
        const today = moment();
        this.setState({
          workerId: worker.ID,
          isReady: true,
          selectedDate: { day: today }
        });
        this.fetchWorkerRelations();
        InteractionManager.runAfterInteractions(() => {
          this.calendar ? this.calendar.jumpToDate(today) : null;
        });
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.fetchWorker, i18n.t('HoursList.index.getCurrentUserError'));
      });
  }

  fetchWorkerRelations() {
    const companyKey = this.props.company.selectedCompany.Key;
    const companyName = this.props.company.selectedCompany.Name;
    const { workerId } = this.state;
    WorkerService.getRelationsForWorker(companyKey, workerId, companyName)
      // get the first WorkRelation entity
      .then(workRelation => this.setState({ workerRelationID: Array.isArray(workRelation.data) ? workRelation.data[0].ID : workRelation.data.ID }))
      .catch(error => this.handleErrors(error.problem, this.fetchWorkerRelations, i18n.t('HoursList.index.fetchRelationsForWorkerError')));
  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('HoursList.index.somethingWrong')) {
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

  startAnimation(isReverse = false) {
    Animated.spring(this.state.moveAnimation, {
      duration: 100,
      toValue: isReverse ? 0 : 1,
      friction: 6,
      useNativeDriver: true
    }).start();
  }

  handleButtons(selectedDate) {
    const _isToday = selectedDate.day.isSame(new Date(), 'day');
    if (_isToday) {
      this.startAnimation(true);
    } else {
      this.startAnimation();
    }
  }

  addNewWorkLog(timeLog) {
    const companyKey = this.props.company.selectedCompany.Key;
    const data = this._getWorkItemFromTimeLog(timeLog);
    WorkerService.createWorkLog(companyKey, data)
      .then((response) => {
        if (!response.ok) {
          this.handleErrors(response.problem, this.addNewWorkLog.bind(null, timeLog), i18n.t('HoursList.index.addNewWorkLogError'));
        }
        this.stopTimer();
        this.fetchCalendarTotalHoursForDay(this.state.selectedDate);
        this.updateWorkLogTimeStamp();
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.addNewWorkLog.bind(null, timeLog), i18n.t('HoursList.index.addNewWorkLogError'));
      });
    Analytics.trackEvent(AnalyticalEventNames.ADD_NEW_WORKLOG, {
      From: 'Timer',
    });
  }

  stopTimer() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
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
          this.handleErrors(problem, this.fetchCalendarTotalHoursForDay.bind(null, selectedDate), i18n.t(`HoursList.index.getTotalLoggedTimeError`));
        }
        if (data.Data.length)
          this.updateCalendarTotalCell(data.Data[0].summinutes, selectedDate);
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.fetchCalendarTotalHoursForDay.bind(null, selectedDate), i18n.t(`HoursList.index.getTotalLoggedTimeError`));
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

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('HoursList.index.noAccessToHours')}</Text>
      </View>
    );
  }

  resetActionsList(selectedDate) {
    const rightButtonactionList = [];
    if (moment().isSame(selectedDate.day, 'day')) {
      rightButtonactionList.push({ action: 'goToApprovals', display: i18n.t('HoursList.index.sendForApprovals') });
      rightButtonactionList.push({ action: 'goTotimer', display: i18n.t('HoursList.index.startTimer') });
    }
    else {
      rightButtonactionList.push({ action: 'goToApprovals', display: i18n.t('HoursList.index.sendForApprovals') });
    }
    this.setState({ rightButtonactionList });
  }

  handleRightActionItemPress(index) {
    if (index === 0) {
      return;
    }
    switch (this.state.rightButtonactionList[index - 1].action) {
      case 'goTotimer':
        this.props.navigation.navigate('TimerView',
          { isStartFromData: false, addNewWorkLog: this.addNewWorkLog, updateWorkLogTimeStamp: this.updateWorkLogTimeStamp.bind(this) });
        break;
      case 'goToApprovals':
        this.props.navigation.navigate('WorkItemApprovalsListByWeek',
          { selectedDate: this.state.selectedDate, workerRelationID: this.state.workerRelationID });
        break;
    }
  }

  showRightButtonActionSheet() {
    this.rightButtonActionSheet.show();
  }

  getRightButtonActions() {
    const rightButtonactionList = [];
    rightButtonactionList.push({ action: 'goToApprovals', display: i18n.t('HoursList.index.sendForApprovals') });
    rightButtonactionList.push({ action: 'goTotimer', display: i18n.t('HoursList.index.startTimer') });
    this.setState({ rightButtonactionList });
  }


  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={this.state.isReady} loaderPosition={'nav'}>

        <CalendarStrip
          ref={ref => this.calendar = ref}
          daysInRow={7}
          parentProps={this.props} // accessing token and company key from parent props
          dateSelectedCallback={(selectedDate) => {
            this.setState({ selectedDate });
            this.handleButtons(selectedDate);
            this.resetActionsList(selectedDate);
          }}
          disabled={!this.state.hasPermissionToModule}
        />

        {this.state.hasPermissionToModule ? (
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
            ListFooterComponent={() => <View style={{ height: 80 }} />}
            enableLinkToWorkItemGroup={true}
          />
        ) : this.renderPlaceholderWithNoPermission()}
        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          <GenericButton
            text={i18n.t('HoursList.index.addHours')}
            textStyle={styles.floatingButtonTextLeft}
            buttonStyle={styles.floatingButtonLeft}
            disabled={!this.state.hasPermissionToModule}
            onPress={() => {
              this.props.navigation.navigate('AddNewWorkLog', {
                isEditMode: false,
                workerRelationID: this.state.workerRelationID,
                selectedDate: this.state.selectedDate,
                updateCalendar: this.updateCalendar,
                updateWorkLogTimeStamp: this.updateWorkLogTimeStamp.bind(this),
              });
            }}
          />
          <GenericButton
            text={i18n.t('HoursList.index.actionsList')}
            textStyle={styles.floatingButtonTextRight}
            buttonStyle={styles.floatingButtonRight}
            disabled={!this.state.hasPermissionToModule}
            onPress={this.showRightButtonActionSheet}
          />
        </FloatingBottomContainer>

        <ActionSheet
          ref={actionSheet => this.rightButtonActionSheet = actionSheet}
          options={[
            i18n.t('HoursList.index.cancel'),
            ...this.state.rightButtonactionList.map(actionItem => actionItem.display),
          ]
          }
          cancelButtonIndex={0}
          onPress={this.handleRightActionItemPress}
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
    changeTimerInfo: (timeLog) => dispatch(changeTimerInfo(timeLog)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HoursList);

const styles = StyleSheet.create({
  buttonSection: {
    height: 60,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  placeholderContainer: {
    flex: 1,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonLeft: {
    height: 35,
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
    marginRight: 15,
  },
  floatingButtonTextLeft: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400'
  },
  floatingButtonRight: {
    height: 35,
    flex: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginRight: 15,
  },
  floatingButtonTextRight: {
    color: theme.SYSTEM_COLOR_WHITE,
    fontWeight: '500'
  },
});
