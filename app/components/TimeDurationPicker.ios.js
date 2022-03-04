import React, { Component } from 'react';
import {
    StyleSheet,
    PickerIOS,
    Text,
    View
} from 'react-native';
import { range } from 'lodash';
import { theme } from '../styles';
import i18n from '../i18n/i18nConfig';
import moment from 'moment';

export default class TimeDurationPicker extends Component {
    constructor(props) {
        super(props)
        this.state = {
            startTime: moment(props.startTime),
            endTime: moment(props.endTime),
            lunchInMinutes: props.lunchInMinutes
        }
        this.onHoursChange = this.onHoursChange.bind(this);
        this.onMinutesChange = this.onMinutesChange.bind(this);
        this.updateRecentDate = this.updateRecentDate.bind(this);
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            startTime: moment(newProps.startTime),
            endTime: moment(newProps.endTime),
            lunchInMinutes: newProps.lunchInMinutes
        });
    }

    onHoursChange = (hours) => {
        if (!this.props.disabled) {
            this.updateRecentDate('hours', hours);
        }
    };
    onMinutesChange = (minutes) => {
        if (!this.props.disabled) {
            this.updateRecentDate('mins', minutes);
        }
    };

    updateRecentDate(type, units) {
        const { startTime, endTime } = this.state;
        const _hours = type === 'hours' ? units : endTime.diff(startTime, 'h');
        const _minutes = type === 'mins' ? units : endTime.diff(startTime, 'm') % 60;
        let dateToUpdate = startTime.add(_hours, 'h').add(_minutes, 'm');
        this.props.durationSelectedCallback('toTime', dateToUpdate.toDate());
    }

    formatDigits(digits) {
        let formattedString;
        if (digits < 10 & digits >= 0) {
            formattedString = `0${digits}`;
        } else if (digits > 9) {
            formattedString = `${digits}`;
        }
        return formattedString;
    }

    render() {
        const { startTime, endTime, lunchInMinutes } = this.state;
        endTime.subtract(lunchInMinutes, 'm');
        const hours = endTime.diff(startTime, 'h');
        const minutes = endTime.diff(startTime, 'm') % 60;
        return (
            <View>
                <Text style={styles.timeDurationLabel}>{i18n.t(`TimeSelector.duration`)}</Text>
                {hours < 0 || minutes < 0
                    ?
                    <View style={styles.mainContainer}>
                        <Text style={styles.falseTime}>{i18n.t(`AddNewWorkLog.index.durationNotRight`)}</Text>
                    </View>
                    :
                    <View style={styles.mainContainer}>
                        <View style={styles.sectionContainer}>
                            <PickerIOS selectedValue={`${hours}`} onValueChange={this.onHoursChange} style={styles.pickerStyle} itemStyle={styles.digitStyle}>
                                {
                                    range(24).map(item => <PickerIOS.Item key={item} value={`${item}`} label={this.formatDigits(item)} />)
                                }
                            </PickerIOS>
                            <Text style={styles.unitStyle}>h</Text>
                        </View>
                        <View style={styles.sectionContainer}>
                            <PickerIOS selectedValue={`${minutes}`} onValueChange={this.onMinutesChange} style={styles.pickerStyle} itemStyle={styles.digitStyle}>
                                {
                                    range(0, 60, 5).map(item => <PickerIOS.Item key={item} value={`${item}`} label={this.formatDigits(item)} />)
                                }
                            </PickerIOS>
                            <Text style={styles.unitStyle}>m</Text>
                        </View>
                    </View>
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        marginBottom: 5,
        alignItems: 'center',
    },
    sectionContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingLeft: 10,
        paddingRight: 10,
        alignItems: 'center',
    },
    digitStyle: {
        color: theme.PRIMARY_COLOR,
        fontWeight: '600',
        fontSize: 35,
    },
    pickerStyle: {
        width: 50,
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
    unitStyle: {
        color: theme.PRIMARY_COLOR,
        marginTop: 13,
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
    },
});