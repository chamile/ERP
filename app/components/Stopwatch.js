import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import moment from 'moment';

export default class Stopwatch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeElapsed: null,
      running: false,
      startTime: null,
    };
    this.handleStartTimer = this.handleStartTimer.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.handleStartTimer();
    }, 200);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.startTime && this.props.startTime !== newProps.startTime) {
      this.setState({
        startTime: newProps.startTime
      });
    }
  }

  componentWillUnmount() {
    this.handleUnmounting();
  }

  handleUnmounting() {
    if (this.state.running) {
      clearInterval(this.interval);
    }
  }

  handleStartTimer() {
    this.setState(() => {
      return {
        startTime: new Date(this.props.startTime),
      };
    }, () => {
      this.interval = setInterval(() => {
        this.setState({
          timeElapsed: new Date() - this.state.startTime,
          running: true,
        });
      }, 30);
    });
  }

  render() {
    const duration = moment.duration(this.state.timeElapsed);
    return (
      <View style={styles.container}>
        <View style={styles.timerBlock}>
          <Text style={styles.timeTextHours}>{("0" + (duration.hours() + (duration.days() * 24))).slice(-2) + ':'}</Text>
        </View>
        <View style={styles.timerBlock}>
          <Text style={styles.timeTextMins}>{("0" + duration.minutes()).slice(-2) + ':'}</Text>
        </View>
        <View style={styles.timerBlock}>
          <Text style={styles.timeTextSecs}>{("0" + duration.seconds()).slice(-2) + ' '}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: 250,
    marginLeft: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  timerBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  timeTextHours: {
    fontWeight: '600',
    fontSize: 52,
    color: '#000',
    alignSelf: 'flex-end',
  },
  timeTextMins: {
    fontWeight: '600',
    fontSize: 52,
    color: '#000',
    alignSelf: 'center',
  },
  timeTextSecs: {
    fontWeight: '300',
    fontSize: 52,
    color: '#000',
    alignSelf: 'flex-start',
  },
});
