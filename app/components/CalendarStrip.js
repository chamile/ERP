import React, { Component } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import moment from 'moment';
import { capitalize } from 'lodash';

import WorkerService from '../services/WorkerService';
import i18n from '../i18n/i18nConfig';

const width = Dimensions.get('window').width;
export class CalendarStrip extends Component {
  constructor() {
    super();
    this.state = {
      ds: [],
      visibleWeekNumber: '',
      jumpedDate: null,
      loadedDays: [],
      firstVisibleDay: moment(),
      lastVisibleDay: moment(),
      selectedDayRowId: 17 // Since we load 35 days
    };

    this.workerID = null;
    this.workerRelationID = null;
    this.renderCalendarCell = this.renderCalendarCell.bind(this);
    this.updateTotalWorkHoursForDay = this.updateTotalWorkHoursForDay.bind(this);
    this.scrollEnded = this.scrollEnded.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.getTotalHours = this.getTotalHours.bind(this);
    this.getTotalHoursInitial = this.getTotalHoursInitial.bind(this);
  }

  getTotalHoursInitial(startDate, endDate) {
    const companyKey = this.props.parentProps.company.selectedCompany.Key;
    const userId = this.props.userId != null ? this.props.userId : this.props.parentProps.user.activeUser.userId;
    const companyName = this.props.parentProps.company.selectedCompany.Name;
    WorkerService.getOrCreateWorkerFromUser(companyKey, userId) // this is the userId of the logged in user
      .then(({ data }) => {
        const workerID = data.ID;
        this.workerID = workerID;
        return WorkerService.getRelationsForWorker(companyKey, workerID, companyName);
      })
      .then((workRelation) => {
        const workerRelationID = Array.isArray(workRelation.data) ? workRelation.data[0].ID : workRelation.data.ID;
        this.workerRelationID = workerRelationID;
        return WorkerService.getTotalLoggedTime(companyKey, workerRelationID, startDate.day.format('YYYY-MM-DD'), endDate.day.format('YYYY-MM-DD'));
      })
      .then(({ data }) => {
        const _loadedDates = this._mergeArraysByDate([...this.state.loadedDays], data.Data);
        this.setState({
          loadedDays: [..._loadedDates],
          ds: [...this.updateLoadedDatesWithSelectedDate(_loadedDates)]
        });
      })
      .catch(() => {
        Alert.alert(i18n.t('CalendarStrip.errorHours'));
      });
  }

  getTotalHours(startDate, endDate) {
    const companyKey = this.props.parentProps.company.selectedCompany.Key;
    WorkerService.getTotalLoggedTime(companyKey, this.workerRelationID, startDate.day.format('YYYY-MM-DD'), endDate.day.format('YYYY-MM-DD'))
      .then(({ data }) => {
        const _loadedDates = this._mergeArraysByDate([...this.state.loadedDays], data.Data);
        this.setState({
          loadedDays: [..._loadedDates],
          ds: [...this.updateLoadedDatesWithSelectedDate(_loadedDates)]
        });
      }).catch(() => { });
  }

  jumpToDate(date, disabled) {
    const _firstMondayThisWeek = moment(date).startOf('isoWeek');
    const initialDays = [];
    let selectedIndex = null;

    if (this.props.loadSelectedWeekOnly) {
      const _firstDay = moment(_firstMondayThisWeek);
      for (let i = 0; i < this.props.daysInRow; i++) {
        const day = moment(_firstDay).add(i, 'days');
        day.isSame(date, 'day') ? selectedIndex = i : null;
        initialDays.push({ day });
      }
    }
    else {
      const _firstDay = moment(_firstMondayThisWeek).subtract((this.props.daysInRow * 2), 'd');
      for (let i = 0; i < this.props.daysInRow * 5; i++) {
        const day = moment(_firstDay).add(i, 'days');
        day.isSame(date, 'day') ? selectedIndex = i : null;
        initialDays.push({ day });
      }
    }

    !disabled ? this.getTotalHoursInitial(initialDays[0], initialDays[initialDays.length - 1]) : null;

    this.setState({
      jumpedDate: date,
      loadedDays: [...initialDays],
      selectedDayRowId: selectedIndex
    }, () => {
      this.setState({ ds: [...this.updateLoadedDatesWithSelectedDate(initialDays)] });
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          if (this._calendar) {
            this._calendar.scrollToOffset({ offset: (this.props.loadSelectedWeekOnly ? 0 : width * 2), animated: true });
            this.setState({
              firstVisibleDay: initialDays[this.props.loadSelectedWeekOnly ? 0 : (this.props.daysInRow * 2)].day,
              lastVisibleDay: initialDays[this.props.loadSelectedWeekOnly ? 6 : ((this.props.daysInRow * 2) + 6)].day,
              visibleWeekNumber: initialDays[this.props.loadSelectedWeekOnly ? 0 : (this.props.daysInRow * 2)].day.isoWeek()
            });
          }
        }, 700);
      });
    });

  }

  _mergeArraysByDate(array1 = [], array2 = []) {
    const hash = new Map();
    array1.concat(array2).forEach((obj) => {
      const day = obj.day ? obj.day.format('YYYY-MM-DD') : moment(obj.WorkItemDate).format('YYYY-MM-DD');
      hash.set(day, Object.assign(hash.get(day) || {}, obj));
    });
    return Array.from(hash.values());
  }

  loadNextWeek(nextDay) {
    const days = [];
    for (let i = 1; i <= this.props.daysInRow; i++) {
      days.push({ day: nextDay.day.clone().add(i, 'days') });
    }

    this.getTotalHours(days[0], days[days.length - 1]);
    this.setState({
      ds: [...this.updateLoadedDatesWithSelectedDate(this.state.loadedDays), ...days],
      loadedDays: [...this.state.loadedDays, ...days]
    });
  }

  loadPreviousWeek(nextDay) {
    const days = [];
    for (let i = this.props.daysInRow; i >= 1; i--) {
      days.push({ day: nextDay.day.clone().subtract(i, 'days') });
    }
    this.getTotalHours(days[0], days[days.length - 1]);
    this.setState(() => ({
      ds: [...days, ...this.updateLoadedDatesWithSelectedDate(this.state.loadedDays)],
      loadedDays: [...days, ...this.state.loadedDays],
      selectedDayRowId: this.state.selectedDayRowId + days.length
    }),
      () => {
        this._calendar ? this._calendar.getScrollResponder().scrollTo({ x: width, y: 0, animated: false }) : null;
      });
  }

  onSelectDate(index) {
    const _loadedDates = this.state.loadedDays.slice();
    _loadedDates[index] = {
      ..._loadedDates[index],
      isSelected: true
    };

    this.setState({
      jumpedDate: null,
      selectedDayRowId: index,
      ds: [..._loadedDates],
    });
  }

  updateTotalWorkHoursForDay(totalMins, selectedDate) {
    const _loadedDates = [...this.state.loadedDays];
    const _loadedDates_selected = [...this.state.loadedDays];
    const selectedDayIndex = _loadedDates.findIndex(item => item.day.isSame(selectedDate.day, 'day'));

    _loadedDates[selectedDayIndex] = {
      ..._loadedDates[selectedDayIndex],
      summinutes: totalMins
    };

    _loadedDates_selected[selectedDayIndex] = {
      ..._loadedDates_selected[selectedDayIndex],
      summinutes: totalMins,
      isSelected: true
    };

    this.setState({
      loadedDays: _loadedDates,
      ds: [..._loadedDates_selected],
    });
  }

  updateLoadedDatesWithSelectedDate(loadedDays) {
    let _loadedDates = [...loadedDays];
    _loadedDates[this.state.selectedDayRowId] = {
      ..._loadedDates[this.state.selectedDayRowId],
      isSelected: true
    };
    return _loadedDates;
  }

  renderCalendarCell({ item, index }) {
    const _isToday = item.day.isSame(this.state.jumpedDate, 'day');
    const _getStyles = (isToday, isSelected) => {
      return {
        fontWeight: _isToday ? '500' : (isSelected ? '500' : '400'),
        color: isSelected ? ACTIVE_TEXT_COLOR : NORMAL_TEXT_COLOR
      };
    };

    return (
      <TouchableOpacity
        disabled={this.props.disabled}
        key={item.day.format('DDMMYYYY')}
        underlayColor="#008b8b"
        style={[styles.cell, {
          backgroundColor: item.isSelected ? 'rgba(0,100,255,0.1 )'
            : (item.day.isSame(new Date(), 'day') ? '#E6FBE7' : null)
        },]}
        onPress={() => {
          this.onSelectDate(index);
          this.props.dateSelectedCallback(item);
        }}
      >
        <Text style={[styles.cellTextSmall, _getStyles(_isToday, item.isSelected)]}>
          {capitalize(item.day.format('ddd'))}
        </Text>
        <Text style={[styles.cellTextBig, _getStyles(_isToday, item.isSelected)
        ]}>
          {item.day.format('D')}
        </Text>
        <Text style={[styles.cellTextSmall, _getStyles(_isToday, item.isSelected)]}>
          {item.summinutes ? `${(item.summinutes / 60).toFixed(1)}h` : '-'}
        </Text>
      </TouchableOpacity>
    );
  }

  renderCalendarHeader(firstVisibleDay, lastVisibleDay, weekNo, showWeekNumber) {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTextLeft}>
          {`${capitalize(firstVisibleDay.format('MMMM'))}${firstVisibleDay.format('MMMM') !== lastVisibleDay.format('MMMM') ? ` | ${capitalize(lastVisibleDay.format('MMMM'))}` : ''} ${firstVisibleDay.month() == 11 ? lastVisibleDay.format('YYYY') : firstVisibleDay.format('YYYY')}`}
        </Text>
        {showWeekNumber ? <Text style={styles.headerTextRight}>
          {`${i18n.t('CalendarStrip.week')} ${weekNo}`}
        </Text>
          : null}
      </View>
    );
  }


  render() {
    return (
      <View style={styles.container}>
        {this.renderCalendarHeader(this.state.firstVisibleDay, this.state.lastVisibleDay, this.state.visibleWeekNumber, this.props.showWeekNumber)}
        <FlatList
          ref={calendar => this._calendar = calendar}
          keyExtractor={(ele) => ele.day.format('DD-MM-YYYY')}
          scrollEnabled={!this.props.disabled}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          automaticallyAdjustContentInsets
          onMomentumScrollEnd={this.scrollEnded}
          scrollEventThrottle={500}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={1}
          data={this.state.ds}
          renderItem={this.renderCalendarCell}
        />
      </View>
    );
  }

  scrollEnded(event) {
    let firstVisibleRowID = Math.round(event.nativeEvent.contentOffset.x * 7 / width);    //This id is calculated using pixels of a calender cell
    if (this.state.firstVisibleDay != this.state.loadedDays[firstVisibleRowID].day && firstVisibleRowID < this.state.loadedDays.length) {
      this.setState({
        firstVisibleDay: this.state.loadedDays[firstVisibleRowID].day,
        lastVisibleDay: this.state.loadedDays[firstVisibleRowID + 6].day,
        visibleWeekNumber: this.state.loadedDays[firstVisibleRowID].day.isoWeek(),
      });
    }
    if (event.nativeEvent.contentOffset.x === 0 && !this.props.loadSelectedWeekOnly) {
      this.loadPreviousWeek(this.state.loadedDays[0]);
    }
  }

  onEndReached() {
    if (this.state.loadedDays.length > 0 && !this.props.loadSelectedWeekOnly) {
      const lastDayInList = this.state.loadedDays[this.state.loadedDays.length - 1];
      this.loadNextWeek(lastDayInList);
    }
  }
}

const ACTIVE_TEXT_COLOR = '#0082C0';
const NORMAL_TEXT_COLOR = '#8B8A90';
const styles = StyleSheet.create({
  container: {
    height: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  cell: {
    width: width / 7,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellTextSmall: {
    fontWeight: '400',
    fontSize: 10,
    marginBottom: 2
  },
  cellTextBig: {
    fontWeight: '400',
    fontSize: 18
  },
  header: {
    height: 35,
    width,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  headerTextLeft: {
    color: '#0082C0',
    fontSize: 12,
    flex: 1,
  },
  headerTextRight: {
    color: '#0082C0',
    fontSize: 12,
    flex: 1,
    textAlign: 'right'
  }
});
