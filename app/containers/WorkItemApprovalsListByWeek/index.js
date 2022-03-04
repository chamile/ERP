/* eslint-disable class-methods-use-this */
// @flow
import React, { Component } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
  RefreshControl,
} from 'react-native';
import SwipeableFlatList from 'react-native/Libraries/Experimental/SwipeableRow/SwipeableFlatList';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';

import { theme } from '../../styles';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { MonthSpinner } from '../../components/MonthSpinner';
import { ItemByWeek } from './ItemByWeek';
import { ActionButtons } from './ActionButtons';
import ViewWrapper from '../../components/ViewWrapper';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { TimesheetWorkflow } from '../../constants/TimesheetConstants';
import WorkItemApprovalService from '../../services/WorkItemApprovalService';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

class WorkItemApprovalsListByWeek extends Component {
    static navigationOptions = ({ navigation }) => {
      return {
        title: i18n.t('WorkItemApprovalsListByWeek.index.title'),
        headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
        headerTintColor: theme.TEXT_COLOR_INVERT,
        headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      };
    };

    constructor(props) {
      super(props);
      this.state = {
        isLoading: false,
        refreshing: false,
        selectedDate: moment(props.navigation.state.params.selectedDate.day),
        weeks: [],
        workerRelationID: props.navigation.state.params.workerRelationID || null,
      };
      this.fetchWorkItemsForMonth = this.fetchWorkItemsForMonth.bind(this);
      this.generateStatsFromWeeklyDataItems = this.generateStatsFromWeeklyDataItems.bind(this);
      this.gotToDetailsView = this.gotToDetailsView.bind(this);
      this.goToSummaryView = this.goToSummaryView.bind(this);
      this.fetchPendingHoursIfStatusIsPartialAssign = this.fetchPendingHoursIfStatusIsPartialAssign.bind(this);
    }

    componentDidMount() {
      this.fetchWorkItemsForMonth();
    }

    getWeeksDetailsForAMonth(date) {
      if (date == null) {
        return [];
      }
      const weekArry = [];
      let startDate = moment(date.clone().startOf('month').startOf('isoWeek').format('YYYY-MM-DD'));
      weekArry.push({
        weekNo: startDate.isoWeek(),
        startDate,
        endDate: moment(startDate.clone().add(6, 'days').format('YYYY-MM-DD')),
      });
      while (date.month() === startDate.clone().add(1, 'week').month()) {
        weekArry.push({
          weekNo: startDate.clone().add(1, 'week').isoWeek(),
          startDate: moment(startDate.clone().add(1, 'week').format('YYYY-MM-DD')),
          endDate: moment(startDate.clone().add(1, 'week').add(6, 'days').format('YYYY-MM-DD')),
        });
        startDate = moment(startDate.clone().add(1, 'week').format('YYYY-MM-DD'));
      }
      return weekArry;
    }

    generateStatsFromWeeklyDataItems(items = [], skipWeekends = false) {
      const totalExpectedTime = _.sumBy(items, item => (skipWeekends && item.IsWeekend ? 0 : item.ExpectedTime));
      const totalValidTime = _.sumBy(items, item => (skipWeekends && item.IsWeekend ? 0 : item.ValidTime));
      const isTotalTimeLTExpected = totalValidTime < totalExpectedTime;
      const status = items.reduce((accumulator, currentValue) => {
        if (!currentValue.Workflow) {
          return accumulator;
        }
        return this.calcFlow(accumulator, currentValue.Workflow);
      }, 0);

      return {
        totalExpectedTime,
        totalValidTime,
        isTotalTimeLTExpected,
        status,
        pendingHours: 0,
      };
    }

    calcFlow(currentFlow, flow) {
      if (currentFlow === TimesheetWorkflow.NOTSET || currentFlow === flow) {
        return flow;
      } else {
        if (currentFlow < TimesheetWorkflow.PARTIAL_REJECT) {
          return TimesheetWorkflow.PARTIAL_ASSIGN;
        }
        if (currentFlow === TimesheetWorkflow.PARTIAL_REJECT || currentFlow === TimesheetWorkflow.REJECTED) {
          return TimesheetWorkflow.PARTIAL_REJECT;
        }
        return TimesheetWorkflow.PARTIAL_APPROVAL;
      }
    }

    mergeDataToWeeksArray(dataItems = [], weekItems = []) {
      const groupedDataByWeekNo =  _.groupBy(dataItems, item => item.WeekNumber);
      const weeks = weekItems.map((week) => {
        const dataItemsForAWeek = [...(groupedDataByWeekNo[week.weekNo] || [])];
        return {
          ...week,
          dataItems: dataItemsForAWeek,
          ...this.generateStatsFromWeeklyDataItems(dataItemsForAWeek),
        };
      });

      this.fetchPendingHoursIfStatusIsPartialAssign(weeks)
        .then((res) => {
          this.setState({
            isLoading: false,
            refreshing: false,
            weeks: res,
          });
        })
        .catch(() => {
          this.setState({
            isLoading: false,
            refreshing: false,
            weeks,
          });
        });
    }

    fetchPendingHoursIfStatusIsPartialAssign(weeks) {
      let partialAssignedWeeks = weeks.filter(ele => (ele.status === TimesheetWorkflow.PARTIAL_ASSIGN || ele.status === TimesheetWorkflow.PARTIAL_APPROVAL));
      return Promise.all([...partialAssignedWeeks.map(ele => WorkItemApprovalService.getAvailableWorkGroupItemsForTimeRange(this.props.company.selectedCompany.Key, ele.startDate.format('YYYY-MM-DD'), ele.endDate.format('YYYY-MM-DD'), this.state.workerRelationID))])
        .then((res) => {
          if (res && res.length > 0) {
            const tempWeeks = [...weeks];
            partialAssignedWeeks = partialAssignedWeeks.map((ele, index) => {
              const response = res[index];
              if (response && response.data && response.data.Data && response.data.Data.length > 0) {
                const totalAssignedTimeForWeek = Math.ceil((_.sumBy(response.data.Data, item => item.Minutes) / 60) * 10) / 10;
                const totalLoggedTimeForWeek = _.sumBy(ele.dataItems, item => item.TotalTime);
                const pendingHours = Math.abs(Math.round((totalLoggedTimeForWeek - totalAssignedTimeForWeek) * 10) / 10);
                return {
                  ...ele,
                  pendingHours
                };
              }
              else {
                return ele;
              }
            });
            partialAssignedWeeks.forEach((ele) => {
              const indexToUpdate = _.findIndex(tempWeeks, item => item.weekNo === ele.weekNo);
              if (indexToUpdate !== -1) {
                tempWeeks[indexToUpdate] = ele;
              }
            });
            return tempWeeks;
          }
          else {
            return weeks;
          }
        });
    }

    fetchWorkItemsForMonth(initFromListRefresh = false) {
      this.setState({ isLoading: true, refreshing: initFromListRefresh });
      const companyKey = this.props.company.selectedCompany.Key;
      const workerRelationID = this.state.workerRelationID;
      const weeksForTheMonth = this.getWeeksDetailsForAMonth(this.state.selectedDate);
      const durationStartDate = weeksForTheMonth.length > 0 ? weeksForTheMonth[0].startDate.format('YYYY-MM-DD') : moment(this.state.selectedDate).format('YYYY-MM-DD');
      const durationEndDate = weeksForTheMonth.length > 0 ? weeksForTheMonth[weeksForTheMonth.length - 1].endDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

      WorkItemApprovalService.getWorkLogsForMonth(companyKey, durationStartDate, durationEndDate, workerRelationID)
        .then((res) => {
          this.mergeDataToWeeksArray(res.data.Items, weeksForTheMonth);
        })
        .catch((error) => {
          this.setState({ isLoading: false, refreshing: false });
          this.handleErrors(error.problem, this.fetchWorker,  i18n.t('WorkItemApprovalsListByWeek.index.dataFetchError'));
        });
    }

    handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('WorkItemApprovalsListByWeek.index.somethingWrong')) {
      ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }

    gotToDetailsView(item) {
      this.swipeableList ? this.swipeableList._onClose() : null;
      this.props.navigation.navigate('WorkItemGroupDetails', { selectedDate: item.startDate, refreshList: this.fetchWorkItemsForMonth, workerRelationID: this.props.navigation.state.params.workerRelationID, isWeekRejected: (TimesheetWorkflow.REJECTED === item.status || TimesheetWorkflow.PARTIAL_REJECT === item.status) });
    }

    goToSummaryView(item) {
      this.swipeableList ? this.swipeableList._onClose() : null;
      if (TimesheetWorkflow.REJECTED === item.status || TimesheetWorkflow.PARTIAL_REJECT === item.status) {
        this.props.navigation.navigate('WorkItemGroupDetails', { selectedDate: item.startDate, refreshList: this.fetchWorkItemsForMonth, workerRelationID: this.props.navigation.state.params.workerRelationID, isWeekRejected: (TimesheetWorkflow.REJECTED === item.status || TimesheetWorkflow.PARTIAL_REJECT === item.status) });
      }
      else {
        this.props.navigation.navigate('SendForAppprovalWorkItemSummary', { item, workerRelationID: this.props.navigation.state.params.workerRelationID, refreshList: this.fetchWorkItemsForMonth, enableSendAction: (item.status === TimesheetWorkflow.DRAFT || item.status === TimesheetWorkflow.PARTIAL_ASSIGN || (item.status === TimesheetWorkflow.PARTIAL_APPROVAL && item.pendingHours > 0)) });
      }
    }

    render() {
      return (
        <ViewWrapper toBackgroundStyle={styles.container} withFade={true} withMove={true}>
          <MonthSpinner
            selectedDate={this.state.selectedDate}
            disableInitalCallback={true}
            lockScroll={false}
            onMonthChanged={(selectedDate) => {
              this.setState({ selectedDate: moment(selectedDate) },
                () => this.fetchWorkItemsForMonth());
            }}
          />
          <SwipeableFlatList
            ref={(ref) => {
              this.swipeableList = ref;
            }}
            refreshControl={(
              <RefreshControl
                onRefresh={() => this.fetchWorkItemsForMonth(true)}
                refreshing={this.state.refreshing}
                tintColor={theme.PRIMARY_COLOR}
              />
            )}
            keyExtractor={(item, index) => `${item.weekNo}`}
            data={this.state.isLoading ? [] : this.state.weeks}
            renderItem={props => <ItemByWeek {...props} onSelectSend={this.goToSummaryView} showCommentIcon={(TimesheetWorkflow.REJECTED === props.item.status || TimesheetWorkflow.PARTIAL_REJECT === props.item.status)} />}
            renderQuickActions={props => <ActionButtons {...props} onSelectDetails={this.gotToDetailsView} />}
            bounceFirstRowOnMount={false}
            maxSwipeDistance={WIDTH / 4}
            ListHeaderComponent={() => <ListPaddingComponent height={20} />}
            ListFooterComponent={() => <ListPaddingComponent height={80} />}
          />
          {this.state.isLoading && !this.state.refreshing
            ? (
              <View style={styles.loader}>
                <ActivityIndicator animating={true} size={'large'} color={theme.PRIMARY_COLOR} />
              </View>
            ) : null}
        </ViewWrapper>
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
  mapDispatchToProps,
)(WorkItemApprovalsListByWeek);

const styles = StyleSheet.create({
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    width: WIDTH,
    height: HEIGHT / 1.5,
    paddingTop: 0,
    position: 'absolute',
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
  },
});
