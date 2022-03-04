/* eslint-disable class-methods-use-this */
/* eslint-disable react/sort-comp */
/* eslint-disable import/prefer-default-export */
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import moment from 'moment';
import Icon from '../components/CustomIcon';
import { theme } from '../styles';

const width = Dimensions.get('window').width;

export class MonthSpinner extends Component {
  constructor() {
    super();
    this.state = {
      ds: [],
      selectedDate: moment(),
      selectedDateIndex: null,
    };

    this.onEndReached = this.onEndReached.bind(this);
    this.loadNextMonths = this.loadNextMonths.bind(this);
    this.loadPreviousMonths = this.loadPreviousMonths.bind(this);
    this.scrollEnded = this.scrollEnded.bind(this);
    this.scrollToBack = this.scrollToBack.bind(this);
    this.scrollToForward = this.scrollToForward.bind(this);
  }

  componentDidMount() {
    this.loadInitialMonths(this.props.selectedDate);
  }

  loadInitialMonths(selectedDate = moment()) {
    const initialMonths = [moment(selectedDate).subtract(2, 'M'), moment(selectedDate).subtract(1, 'M'), moment(selectedDate), moment(selectedDate).add(1, 'M'), moment(selectedDate).add(2, 'M')];
    this.setState({
      ds: [...initialMonths],
      selectedDate,
      selectedDateIndex: 2,
    }, () => {
      setTimeout(() => {
        this.flatListRef.scrollToOffset({ offset: ((width - 100) * 2), animated: false });
      }, 0);
      this.props.onMonthChanged && !this.props.disableInitalCallback ? this.props.onMonthChanged(moment(selectedDate)) : null;
    });
  }

  loadNextMonths(lastLoadedMonth) {
    this.setState({
      ds: [...this.state.ds, moment(lastLoadedMonth).add(1, 'M'), moment(lastLoadedMonth).add(2, 'M')]
    });
  }

  loadPreviousMonths(firstLoadedMonth) {
    this.setState({
      ds: [moment(firstLoadedMonth).subtract(2, 'M'), moment(firstLoadedMonth).subtract(1, 'M'), ...this.state.ds],
    },
    () => {
      this.flatListRef.getScrollResponder().scrollTo({ x: 2 * (width - 100), y: 0, animated: false });
      this.setState({ selectedDate: firstLoadedMonth, selectedDateIndex: this.state.selectedDateIndex + 2 });
    });
  }

  onEndReached() {
    if (this.state.ds.length > 0) {
      this.loadNextMonths(this.state.ds[this.state.ds.length - 1]);
    }
  }

  scrollEnded(event) {
    let visibleItemIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 100));
    if (this.state.selectedDate != this.state.ds[visibleItemIndex] && visibleItemIndex < this.state.ds.length) {
      this.setState({
        selectedDate: this.state.ds[visibleItemIndex],
        selectedDateIndex: visibleItemIndex,
      });
      this.props.onMonthChanged ? this.props.onMonthChanged(this.state.ds[visibleItemIndex]) : null;
    }
    if (event.nativeEvent.contentOffset.x === 0) {
      this.loadPreviousMonths(this.state.ds[0]);
    }
  }

  scrollToForward() {
    if (this.state.selectedDateIndex !=  null && this.state.selectedDateIndex < this.state.ds.length && !this.props.lockScroll)  {
      if (Platform.OS === 'android') {
        if ((this.state.selectedDateIndex) > (this.state.ds.length - 3)) {
          this.loadNextMonths(this.state.ds[this.state.ds.length - 1]);
        }
        this.flatListRef.scrollToIndex({ index: this.state.selectedDateIndex + 1 });
        this.setState({
          selectedDate: this.state.ds[this.state.selectedDateIndex + 1],
          selectedDateIndex: this.state.selectedDateIndex + 1,
        });
        this.props.onMonthChanged ? this.props.onMonthChanged(this.state.ds[this.state.selectedDateIndex + 1]) : null;
      }
      else {
        this.flatListRef.scrollToIndex({ index: this.state.selectedDateIndex + 1 });
      }
    }
  }

  scrollToBack() {
    if (this.state.selectedDateIndex !=  null && this.state.selectedDateIndex > 0 && !this.props.lockScroll)  {
      if (Platform.OS === 'android') {
        if ((this.state.selectedDateIndex - 1) === 0) {
          this.loadPreviousMonths(this.state.ds[0]);
        }
        this.flatListRef.scrollToIndex({ index: this.state.selectedDateIndex - 1 });
        this.setState({
          selectedDate: this.state.ds[this.state.selectedDateIndex - 1],
          selectedDateIndex: this.state.selectedDateIndex - 1,
        });
        this.props.onMonthChanged ? this.props.onMonthChanged(this.state.ds[this.state.selectedDateIndex - 1]) : null;
      }
      else {
        this.flatListRef.scrollToIndex({ index: this.state.selectedDateIndex - 1 });
      }
    }
  }

  renderItem({ item }) {
    return (
      <View style={styles.item}>
        <Text style={{ color: theme.SCREEN_COLOR_DARK_GREY, fontSize: 17, fontWeight: '500' }}>{item.format('MMMM YYYY')}</Text>
      </View>
    );
  }


  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.scrollToBack} style={styles.buttons}>
          <Icon name="ios-arrow-back" size={32} color={theme.COLOR_GRAY} />
        </TouchableOpacity>
        <FlatList
          showsHorizontalScrollIndicator={false}
          viewabilityConfig={this.viewabilityConfig}
          horizontal
          pagingEnabled
          scrollEnabled={!this.props.lockScroll}
          keyExtractor={item => item.format('YYYY-MM-DD')}
          data={this.state.ds}
          ref={(ref) => { this.flatListRef = ref; }}
          renderItem={this.renderItem}
          onMomentumScrollEnd={this.scrollEnded}
          scrollEventThrottle={500}
          onEndReached={this.onEndReached}
          onEndReachedThreshold={1}
        />
        <TouchableOpacity onPress={this.scrollToForward} style={styles.buttons}>
          <Icon name="ios-arrow-forward" size={32} color={theme.COLOR_GRAY} />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.PRIMARY_BACKGROUND_COLOR,
  },
  buttons: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    width: width - 100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
