// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TouchableHighlight,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import moment from 'moment';
import Icon from '../../components/CustomIcon';

import { theme } from '../../styles';
import LoadingIndicator from '../../components/LoadingIndicator';
import WorkerService from '../../services/WorkerService';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import StopwatchInline from '../../components/StopwatchInline';
import i18n from '../../i18n/i18nConfig';
import { WorkItemGroupStatus } from '../../constants/WorkItemGroups';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
export class WorkLogs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDate: null,
      isLoading: true,
      isRefreshing: false,
      timeLogs: [],
      deletingRows: new Set()
    };

    this.workerRelationID = null;

    this.renderRow = this.renderRow.bind(this);
    this.renderHiddenRow = this.renderHiddenRow.bind(this);
    this.fetchWorklogs = this.fetchWorklogs.bind(this);
    this.deleteWorkLogItem = this.deleteWorkLogItem.bind(this);
    this.startNewTimerWithData = this.startNewTimerWithData.bind(this);
    this.navigateToRejectionMsg = this.navigateToRejectionMsg.bind(this);
  }

  componentDidMount() {
    if(this.props.selectedDate && this.props.workerRelationID) {
      this.fetchWorklogs(this.props.selectedDate, this.props.workerRelationID);
    }
    else {
      this.setState({ isLoading: false });
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.timeStamp !== this.props.timeStamp || (newProps.selectedDate && newProps.workerRelationID !== null && (newProps.selectedDate !== this.props.selectedDate || newProps.workerRelationID !== this.props.workerRelationID))) {
      this.fetchWorklogs(newProps.selectedDate, newProps.workerRelationID);
      this.fetchCalendarTotalHoursForDay(newProps.selectedDate);
    }
  }

  refreshWorkLogs(selectedDate, workerRelationID, fromExternalRefreshRequest = false) {
    this.setState({ isRefreshing: true });
    this.fetchWorklogs(selectedDate, workerRelationID, fromExternalRefreshRequest);
    this.fetchCalendarTotalHoursForDay(selectedDate);
  }

  _getDataFromTimeLog(timeLog) {
    const data = {};
    data.StartTime = timeLog.startTime;
    data.EndTime = timeLog.endDate;
    data.Dimensions = {
      Project: {
        Name: timeLog.project.name ? timeLog.project.name : null,
        ID: timeLog.project.id ? timeLog.project.id : null
      }
    };
    data.Worktype = {
      Name: timeLog.workType.name ? timeLog.workType.name : null,
      ID: timeLog.workType.id ? timeLog.workType.id : null
    };
    data.LunchInMinutes = timeLog.lunchInMinutes ? timeLog.lunchInMinutes : 0;
    data.Description = timeLog.description ? timeLog.description : null;
    return data;
  }

  fetchWorklogs(selectedDate, workerRelationID, withAnimation = true) {
    this.workerRelationID = workerRelationID;
    if (withAnimation)
      this.setState({ isLoading: withAnimation, timeLogs: [] });
    else
      this.setState({ isLoading: withAnimation });
    const plainSelectedDate = selectedDate.day.format('YYYY-MM-DD');
    WorkerService.getWorkLogsForDay(this.props.parentProps.company.selectedCompany.Key, workerRelationID, plainSelectedDate)
      .then(({ data, ok, problem }) => {
        if (!ok) {
          this.handleErrors(problem, this.fetchWorklogs.bind(null, selectedDate, workerRelationID, false), i18n.t('HoursList.WorkLogs.fetchWorkLogsError'));
        }
        if (this.props.timer.isActive && selectedDate.day.isSame(this.props.timer.timeLog.startTime, 'day')) { // there is a active timer for this day
          const _data = this._getDataFromTimeLog(this.props.timer.timeLog);
          _data.isActive = true;
          data.push(_data);
        }

        this.setState({
          isRefreshing: false,
          selectedDate: selectedDate,
          timeLogs: [...data],
          isLoading: false,
        });
      })
      .catch((error) => {
        this.setState({
          isRefreshing: false,
          isLoading: false,
          timeLogs: [],
        });
        this.handleErrors(error.problem, this.fetchWorklogs.bind(null, selectedDate, workerRelationID, false), i18n.t('HoursList.WorkLogs.fetchWorkLogsError'));
      });
  }

  fetchCalendarTotalHoursForDay(selectedDate) {
    WorkerService.getTotalLoggedTime(this.props.parentProps.company.selectedCompany.Key, this.workerRelationID, selectedDate.day.format('YYYY-MM-DD'), selectedDate.day.format('YYYY-MM-DD'))
      .then(({ ok, data, problem }) => {
        if (!ok) {
          this.handleErrors(problem, this.fetchCalendarTotalHoursForDay.bind(this, selectedDate), i18n.t('HoursList.WorkLogs.fetchTotalLoggedTimeError'));
        }

        if (data.Data.length)
          this.props.updateCalendarTotalCell(data.Data[0].summinutes, selectedDate);
        else
          this.props.updateCalendarTotalCell(0, selectedDate);
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.fetchCalendarTotalHoursForDay.bind(this, selectedDate), i18n.t('HoursList.WorkLogs.fetchTotalLoggedTimeError'));
      });
  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('HoursList.WorkLogs.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  handleListViewRowTap(rowData, isViewOnly) {
    if (rowData.isActive) {
      this.props.navigation.navigate('TimerView', { isStartFromData: false, addNewWorkLog: this.props.addNewWorkLog, updateWorkLogTimeStamp: this.props.updateWorkLogTimeStamp });
    } else {
      this.props.navigation.navigate('AddNewWorkLog', { isViewOnlyMode: isViewOnly, isEditMode: true, workerRelationID: this.props.workerRelationID, updateCalendar: this.props.updateCalendar, selectedDate: { day: moment(rowData.StartTime) }, data: { ...rowData }, updateWorkLogTimeStamp: this.props.updateWorkLogTimeStamp, onChangeSuccess: this.props.onChangeSuccess || null });
    }
  }

  startNewTimerWithData(rowData) {
    if (this.props.timer.isActive && rowData.isActive) { // stop active timer is pressed
      const timeLog = this.props.timer.timeLog;
      timeLog.endTime = new Date();
      this.props.addNewWorkLog(timeLog);
    } else if (this.props.timer.isActive) { // there is a active timer, cant start a new one
      alert(i18n.t('HoursList.WorkLogs.timerActive'));
    } else { // no active timer
      this.props.navigation.navigate('TimerView', { isStartFromData: true, addNewWorkLog: this.props.addNewWorkLog, data: { ...rowData }, updateWorkLogTimeStamp: this.props.updateWorkLogTimeStamp });
    }
  }

  deleteWorkLogItem(data, rowMap) {
    if (data.isActive) {
      this.props.stopTimer();
      return;
    }

    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(data.item.ID);

    this.setState({
      deletingRows: _deletingRows
    });

    WorkerService.deleteLoggedTime(this.props.parentProps.company.selectedCompany.Key, data.item.ID)
      .then(({ ok, problem }) => {
        if (!ok) {
          throw new Error(problem);
        }
        this.props.onChangeSuccess ? this.props.onChangeSuccess() : null;
        this.fetchCalendarTotalHoursForDay(this.state.selectedDate);
        _deletingRows.delete(data.item.ID);
        let _data = [...this.state.timeLogs];
        _data = _data.filter(item => item.ID !== data.item.ID);
        rowMap[data.item.ID].closeRow();
        this.setState({
          timeLogs: [..._data],
          deletingRows: _deletingRows
        });
      })
      .catch((error) => {
        const _deletingRows = new Set([...this.state.deletingRows]);
        _deletingRows.delete(data.item.ID);
        this.setState({
          deletingRows: _deletingRows
        });

        this.handleErrors(error.problem, this.deleteWorkLogItem.bind(this, data, rowMap), i18n.t('HoursList.WorkLogs.deleteWorkLogsError'));
      });
  }

  _getSecondaryLabelText = (rowData) => {
    if (rowData.Dimensions && rowData.Dimensions.Project && rowData.Dimensions.Project.ID) {
      return `${rowData.Dimensions.Project.ID} : ${rowData.Dimensions.Project.Name}`;
    }
    else if (rowData.Description) {
      return rowData.Worktype ? rowData.Worktype.Description : i18n.t('HoursList.WorkLogs.notSpecified');
    } else {
      return i18n.t('HoursList.WorkLogs.notSpecified');
    }
  };

  _getDescriptionLableText = (rowData) => {
    if (rowData.Description) {
      return rowData.Description;
    } else if (rowData.Worktype && rowData.Worktype.Description) {
      return rowData.Worktype.Description;
    } else if (rowData.Worktype && rowData.Worktype.Name) {
      return rowData.Worktype.Name;
    } else {
      return i18n.t('HoursList.WorkLogs.notSpecified');
    }
  };

  _hoursAndMins = (mins) => {
    const hours = Math.trunc(mins / 60);
    const minutes = mins % 60;
    return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
  };

  _clculateStatus = (data) => {
    const status = {
      statusText: i18n.t('HoursList.WorkLogs.draft'),
      icon: 'ios-brush-outline',
      iconColor: theme.SCREEN_COLOR_LIGHT_GREY_2,
      isBlocked: false,
    };
    if(!data.WorkItemGroup) {
      return status;
    }
    else {
      if(data.WorkItemGroup && data.WorkItemGroup.StatusCode === WorkItemGroupStatus.DRAFT) {
        return status;
      }
      else if(data.WorkItemGroup && data.WorkItemGroup.StatusCode === WorkItemGroupStatus.AWAITING_APPROVAL) {
        status.statusText = i18n.t('HoursList.WorkLogs.waitingForApproval');
        status.icon = 'ios-refresh-outline';
        status.iconColor = theme.SCREEN_COLOR_YELLOW;
        return status;
      }
      else if(data.WorkItemGroup && data.WorkItemGroup.StatusCode === WorkItemGroupStatus.REJECTED) {
        status.statusText = i18n.t('HoursList.WorkLogs.rejected');
        status.icon = 'ios-remove-circle';
        status.iconColor = theme.SCREEN_COLOR_LIGHT_RED;
        status.isBlocked = true;
        return status;
      }
      else if(data.WorkItemGroup && data.WorkItemGroup.StatusCode >= WorkItemGroupStatus.APPROVED) {
        status.statusText = i18n.t('HoursList.WorkLogs.approved');
        status.icon = 'ios-checkmark-circle';
        status.iconColor = theme.SCREEN_COLOR_LIGHT_GREEN_1;
        status.isBlocked = true;
        return status;
      }
    }
  }

  navigateToRejectionMsg(data, rowMap) {
    rowMap[data.item.ID].closeRow();
    this.props.navigation.navigate('HoursRejectionMessage', {
      selectedDate: this.state.selectedDate.day ? moment(this.state.selectedDate.day) : moment(),
      workerRelationID: this.workerRelationID,
      WorkItemGroupID: data.item.WorkItemGroupID ? data.item.WorkItemGroupID : null,
      successCallback: () => setTimeout(() => this.refreshWorkLogs(this.state.selectedDate, this.workerRelationID, false), 500),
    });
  }

  renderRow(rowData, rowMap) {
    const status = this._clculateStatus(rowData.item);
    const showEditWeek = !!(this.props.enableLinkToWorkItemGroup && rowData.item.WorkItemGroup && rowData.item.WorkItemGroup.StatusCode === WorkItemGroupStatus.REJECTED);
    return (
      <SwipeRow
        disableRightSwipe={true}
        leftOpenValue={75}
        rightOpenValue={-75}
        disableLeftSwipe={this.props.editDisabled ? true : showEditWeek ? false : status.isBlocked}
      >
        {this.renderHiddenRow(rowData, rowMap, showEditWeek)}
        <TouchableHighlight style={styles.rowInnerContainer} underlayColor={theme.SCREEN_COLOR_LIGHT_GREY} onPress={() => this.handleListViewRowTap(rowData.item, this.props.editDisabled || status.isBlocked)}>
          <View style={styles.rowOuterBox}>
            <View style={styles.rowInfoBox}>

              <View style={styles.infoBoxColumn}>
                <View style={styles.columnInnerLeft}>
                  <Text numberOfLines={1} style={styles.projectNameText}>
                    {this._getSecondaryLabelText(rowData.item)}
                  </Text>
                </View>
                <View style={styles.columnInnerRight}>
                  <Text style={[styles.startEndTimeText, styles.textRight]}>
                    {moment(rowData.item.StartTime).format('HH:mm')} - {rowData.item.EndTime ? moment(rowData.item.EndTime).format('HH:mm') : i18n.t('HoursList.WorkLogs.now')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoBoxColumn}>
                <View style={styles.columnInnerLeft}>
                  <Text numberOfLines={1} style={styles.descriptionText}>
                    {this._getDescriptionLableText(rowData.item)}
                  </Text>
                </View>
                <View style={[styles.columnInnerRight, styles.columnInnerRightBottom]}>
                  {
                    !!rowData.item.LunchInMinutes ?
                      <Image style={styles.lunchIcon} source={require('../../images/WorkLogs/lunch-icon.png')} /> : null
                  }
                  {
                    rowData.item.isActive ?
                      (<StopwatchInline startTime={new Date(this.props.timer.timeLog.startTime)} />) :
                      (<Text style={styles.workDurationText}>{this._hoursAndMins(rowData.item.Minutes)}</Text>)
                  }
                </View>
              </View>

              <View style={styles.infoBoxColumn}>
                <View style={styles.columnInnerLeft} >
                <Text numberOfLines={2} style={[styles.statusText]}>
                    <Icon name={status.icon} size={12} color={status.iconColor} /> {status.statusText}
                  </Text></View>
                <View style={[styles.columnInnerRight, styles.columnInnerRightBottom]} />
              </View>

            </View>
            {!(this.props.selectedDate && !this.props.selectedDate.day.isSame(new Date(), 'day')) ?
              this.props.disableTimer ?
              rowData.item.isActive ?
              <View style={styles.rowButtonBox}>
                <TouchableOpacity onPress={() => { this.startNewTimerWithData(rowData.item) }} style={styles.timerButton}>
                  <Image style={styles.timerIcon} source={require('../../images/WorkLogs/timer-stop-icon.png')} />
                </TouchableOpacity>
              </View>
              : null
                : <View style={styles.rowButtonBox}>
                <TouchableOpacity onPress={() => { this.startNewTimerWithData(rowData.item) }} style={styles.timerButton}>
                  {
                    rowData.item.isActive ?
                      (<Image style={styles.timerIcon} source={require('../../images/WorkLogs/timer-stop-icon.png')} />) :
                      (<Image style={styles.timerIcon} source={require('../../images/WorkLogs/timer-icon.png')} />)
                  }
                </TouchableOpacity>
              </View>
            : null}
          </View>
        </TouchableHighlight>
      </SwipeRow>
    );
  }

  renderHiddenRow(data, rowMap, showEditWeek) {
    return (
      <View style={styles.backrowContainer}>
        {showEditWeek ?
          <TouchableOpacity style={styles.editButton} onPress={() => this.navigateToRejectionMsg(data, rowMap)}>
          <Text style={styles.buttonInnerText}>{i18n.t('HoursList.WorkLogs.editHours')}</Text>
        </TouchableOpacity>
        : <TouchableOpacity style={styles.deleteButton} onPress={() => this.deleteWorkLogItem(data, rowMap)}>
          {this.state.deletingRows.has(data.item.ID) ? <ActivityIndicator animating={true} color="#fff" size="small" /> : <Icon name="md-close" size={20} color="#FFFFFF" />}
          <Text style={styles.buttonInnerText}>{i18n.t('HoursList.WorkLogs.delete')}</Text>
          </TouchableOpacity>
        }
      </View>
    );
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/WorkLogs/empty-list-icon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('HoursList.WorkLogs.noTimeLogs')} {(this.state.selectedDate ? this.state.selectedDate.day : moment()).calendar(null, i18n.language.includes('en-') ?
          {
            lastDay: '[yesterday]',
            sameDay: '[today]',
            nextDay: '[tomorrow]',
            lastWeek: '[last] dddd',
            nextWeek: 'dddd',
            sameElse: 'Do MMMM YYYY'
          } :
          {
            lastDay: '[i] [går]',
            sameDay: '[i] [dag]',
            nextDay: '[i] [morgen]',
            lastWeek: '[forrige] dddd',
            nextWeek: '[på] dddd',
            sameElse: '[den] Do MMMM YYYY'
          }).toLowerCase()}.
      </Text>
      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1}} key={'viewHolderKey'}>
        <SwipeListView
          {...this.props}
          useFlatList
          enableEmptySections={false}
          data={this.state.timeLogs}
          keyExtractor={(item) => `${item.ID}`}
          renderItem={this.renderRow}
          refreshControl={!this.state.isLoading ?
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={() => this.refreshWorkLogs(this.state.selectedDate, this.workerRelationID)}
              tintColor={theme.PRIMARY_COLOR}
            /> : null
          }
          previewRowKey={''}
        />
        {this.state.isLoading ? <LoadingIndicator isVisible={this.state.isLoading} position={'custom'} marginTop={150} color={theme.PRIMARY_COLOR} /> : null}
        {!this.state.isLoading && this.state.timeLogs.length === 0 ? this.renderPlaceholder() : null}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  rowOuterBox: {
    height: 80,
    paddingRight: 15,
    paddingLeft: 15,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  rowInfoBox: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  infoBoxColumn: {
    flex: 1,
    flexDirection: 'row',
  },
  columnInnerLeft: {
    flex: 2,
    justifyContent: 'center',
  },
  columnInnerRight: {
    flex: 1,
    justifyContent: 'center',
  },
  columnInnerRightBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rowButtonBox: {
    width: 50,
  },
  projectNameText: {
    color: '#0084BB',
    fontWeight: '400',
    fontSize: 12,
  },
  startEndTimeText: {
    color: '#8E8D93',
    fontWeight: '400',
    fontSize: 12,
  },
  textRight: {
    textAlign: 'right',
  },
  descriptionText: {
    color: '#000',
    fontWeight: '400',
    fontSize: 16,
  },
  lunchIcon: {
    width: 15,
    height: 15,
    marginRight: 10,
  },
  workDurationText: {
    color: '#000',
    fontWeight: '400',
    fontSize: 16,
  },
  timerButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 18,
  },
  timerIcon: {
    width: 20,
    height: 20,
  },
  backrowContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(200,200,100,0.1)',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: theme.SCREEN_COLOR_YELLOW,
    width: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInnerText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center'
  },
  rowInnerContainer: {
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 7,
    paddingRight: 7,
    flex: 1,
  },
  // placeholder styles
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    opacity: 0.4,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  statusText: {
    fontSize: 11,
    color: theme.SCREEN_COLOR_DARK_GREY,
    paddingTop: 8,
  }
});
