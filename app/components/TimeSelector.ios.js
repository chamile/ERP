import React, { Component } from 'react';
import {
  DatePickerIOS,
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';

import i18n from '../i18n/i18nConfig';

const width = Dimensions.get('window').width;
export default class TimeSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fromDate: props.fromDate ? props.fromDate : new Date(),
      toDate: props.toDate ? props.toDate : new Date()
    }
  }

  componentDidMount() {
    this.setState({ minInterval: 5 });
  }

  componentWillReceiveProps(props) {
    this.setState({
      fromDate: props.fromDate,
      toDate: props.toDate
    })
  }

  onFromDateChange = (date) => {
    this.setState({ fromDate: date });
    this.props.timeSelectedCallback('fromTime', date);
  };

  onToDateChange = (date) => {
    this.setState({ toDate: date });
    this.props.timeSelectedCallback('toTime', date);
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.infoCard}>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>{i18n.t('TimeSelector.from')}</Text>
            <DatePickerIOS
              date={this.state.fromDate}
              mode="time"
              onDateChange={this.onFromDateChange}
              minuteInterval={this.state.minInterval}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>{i18n.t('TimeSelector.to')}</Text>
            <DatePickerIOS
              date={this.state.toDate}
              mode="time"
              onDateChange={this.onToDateChange}
              minuteInterval={this.state.minInterval}
            />
          </View>
        </View>

      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
  },
  infoCard: {
    flexDirection: 'row',
    flex: 1,
    alignSelf: 'center'
  },
  timerBox: {
    width: 160
  },
  spacer: {
    backgroundColor: '#aeaeae',
    marginTop: 70,
    marginBottom: 24,
    width: 0.5
  },
  timerLabel: {
    color: '#0084BB',
    fontWeight: '400',
    fontSize: 16,
    paddingTop: 14,
    paddingLeft: 20,
  },
  infoTitleBox: {
    width: 100,
    justifyContent: 'center'
  },
  infoTextBox: {
    flex: 1,
    paddingRight: 15,
    justifyContent: 'center'
  },
  infoTitleText: {
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: 16,
    fontWeight: '500',
    color: '#000'
  },
  infoText: {
    margin: 0,
    padding: 0,
    fontSize: 16,
    color: '#8E8D93'
  }
});
