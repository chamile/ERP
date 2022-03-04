import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import moment from 'moment';

export default class StopwatchInline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeElapsed: null,
      running: false,
      startTime: null,
    }
    this.handleStartTimer = this.handleStartTimer.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.handleStartTimer();
    }, 100);
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

  render() {
    const duration = moment.duration(this.state.timeElapsed);
    return (
      <Text style={styles.text}>{("0" + (duration.hours() + (duration.days() * 24))).slice(-2) + ':' + ("0" + duration.minutes()).slice(-2)}</Text>
    )
  }

  handleUnmounting() {
    if (this.state.running) {
      clearInterval(this.interval);
    }
  }

  handleStartTimer() {
    this.setState(() => {
      return {
        startTime: this.props.startTime,
      }
    }, () => {
      this.interval = setInterval(() => {
        this.setState({
          timeElapsed: new Date() - this.state.startTime,
          running: true,
        });
      }, 30);
    })
  }

}

const styles = StyleSheet.create({
  text: {
    color: '#000',
    fontSize: 16,
  },
});
