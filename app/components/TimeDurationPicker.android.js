import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TimePickerAndroid
} from 'react-native';
import moment from 'moment';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import i18n from '../i18n/i18nConfig';
import { theme } from '../styles';

export default class TimeDurationPicker extends Component {

    constructor(props) {
        super(props);
        this.state = {
            startTime: moment(props.startTime),
            endTime: moment(props.endTime),
            lunchInMinutes: props.lunchInMinutes
        }
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            startTime: moment(newProps.startTime),
            endTime: moment(newProps.endTime),
            lunchInMinutes: newProps.lunchInMinutes
        });
    }

    _showDateTimePicker() {
        const { startTime, endTime, lunchInMinutes } = this.state;
        endTime.add(lunchInMinutes, 'm');
        this.showPicker({
            hour: endTime.diff(startTime, 'h'),
            minute: endTime.diff(startTime, 'm') % 60,
            minuteInterval: 15,
            is24Hour: true,
            type: 'toTime'
        });
    }

    formatDigits(digits) {
        let formattedString = `${digits}`;
        if (digits < 10 & digits >= 0) {
            formattedString = `0${digits}`;
        } else if (digits >= 10) {
            formattedString = `${digits}`;
        }
        return formattedString;
    }

    async showPicker(options) {
        try {
            const { action, minute, hour } = await TimePickerAndroid.open(options);
            if (action === TimePickerAndroid.timeSetAction) {
                let dateToUpdate = moment(this.state.startTime).add(hour, 'h').add(minute, 'm');
                this.props.durationSelectedCallback('toTime', dateToUpdate.toDate());
            }
        } catch ({ code, message }) {
        }
    }

    render() {
        const { startTime, endTime, lunchInMinutes } = this.state;
        endTime.subtract(lunchInMinutes, 'm');
        return (
            <React.Fragment>
                {!this.props.disabled ?
                    <Touchable onPress={() => this._showDateTimePicker()}>
                        <Text style={styles.timeDurationLabel}>{i18n.t(`TimeSelector.duration`)}</Text>
                        {this.state.hours < 0 || this.state.minutes < 0
                            ?
                            <View style={styles.mainContainer}>
                                <Text style={styles.falseTime}>{i18n.t(`AddNewWorkLog.index.durationNotRight`)}</Text>
                            </View>
                            :
                            <View style={styles.mainContainer}>
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.digitStyle}>{this.formatDigits(endTime.diff(startTime, 'h'))}</Text>
                                    <Text style={styles.unitStyle}>h</Text>
                                </View>
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.digitStyle}>{this.formatDigits(endTime.diff(startTime, 'm') % 60)}</Text>
                                    <Text style={styles.unitStyle}>m</Text>
                                </View>
                            </View>
                        }
                    </Touchable >
                    :
                    <React.Fragment>
                        <Text style={styles.timeDurationLabel}>{i18n.t(`TimeSelector.duration`)}</Text>
                            {this.state.hours < 0 || this.state.minutes < 0
                                ?
                                <View style={styles.mainContainer}>
                                    <Text style={styles.falseTime}>{i18n.t(`AddNewWorkLog.index.durationNotRight`)}</Text>
                                </View>
                                :
                                <View style={styles.mainContainer}>
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.digitStyle}>{this.formatDigits(endTime.diff(startTime, 'h'))}</Text>
                                        <Text style={styles.unitStyle}>h</Text>
                                    </View>
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.digitStyle}>{this.formatDigits(endTime.diff(startTime, 'm') % 60)}</Text>
                                        <Text style={styles.unitStyle}>m</Text>
                                    </View>
                                </View>
                    }
                    </React.Fragment>
                }
        </React.Fragment>
        );
    }
}


const styles = StyleSheet.create({
    mainContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 5,
        alignItems: 'center',
    },
    sectionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        alignItems: 'flex-end',
    },
    digitStyle: {
        color: theme.PRIMARY_COLOR,
        fontWeight: '600',
        fontSize: 35,
    },
    unitStyle: {
        color: theme.PRIMARY_COLOR,
        marginBottom: 5,
        paddingLeft: 1,
        fontWeight: '600',
        fontSize: 15,
    },
    timeDurationLabel: {
        color: theme.PRIMARY_COLOR,
        fontWeight: '500',
        fontSize: 16,
        paddingLeft: 5,
        paddingRight: 5,
        alignSelf: 'center',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    falseTime: {
        color: theme.PRIMARY_COLOR,
        fontWeight: '600',
        fontSize: 18,
        paddingLeft: 5,
        paddingRight: 5,
        alignSelf: 'center',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 5
    },
});
