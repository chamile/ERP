import React, { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import moment from 'moment';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import DateTimePicker from 'react-native-modal-datetime-picker';

import i18n from '../i18n/i18nConfig';
import InlineValidationInputField from '../components/InputFieldWithValidation';
import { theme } from '../styles';

const width = Dimensions.get('window').width;
export default class TimePicker extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fromDate: props.fromDate ? props.fromDate : new Date(),
      toDate: props.toDate ? props.toDate : new Date(),
      isDateTimePickerVisible: false,
      minuteInterval: 1,
    };
    this.selectedDate = new Date();
    this.selectedHandler = () => { };
    this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
    this._handleFromDate = this._handleFromDate.bind(this);
    this._handleToDate = this._handleToDate.bind(this);
    this.changeStartTime = this.changeStartTime.bind(this);
  }

  componentWillReceiveProps(props) {
    this.setState({
      fromDate: props.fromDate,
      toDate: props.toDate
    });
  }

  changeStartTime(type) {
    this.selectedHandler = type === 'fromTime' ? this._handleFromDate : this._handleToDate;
    this.selectedDate = type === 'fromTime' ? this.state.fromDate : this.state.toDate;
    this.setState({
      isDateTimePickerVisible: true
    });
    setTimeout(() => this.setState({ minuteInterval: 5 }), 0);
  }

  _hideDateTimePicker() {
    this.setState({
      isDateTimePickerVisible: false
    });
    setTimeout(() => this.setState({ minuteInterval: 1 }), 0);
  }

  _handleFromDate(time) {
    // ############## this code block is commented out since PO asked to enable all fields editable on time selector. Incase if requirements changed uncomment this and revert back to earlier logic.
    // const { fromDate, toDate } = this.state;
    // if (moment(time).isAfter(moment(toDate)) || (moment.duration(moment(toDate).diff(moment(time))).asMinutes() !== moment.duration(moment(toDate).diff(moment(fromDate))).asMinutes())) {
    //   const hourDiff = moment(toDate).diff(moment(fromDate), 'hours');
    //   const minuteDiff = moment(toDate).diff(moment(fromDate), 'minutes') % 60;
    //   let newToDate = moment(time).add(hourDiff, 'h').add(minuteDiff, 'm');
    //   this.props.multipleTimeChangesHandler({ fromTime: time, toTime: newToDate.toDate() });
    //   this.setState({ fromDate: time, toDate: newToDate.toDate(), isDateTimePickerVisible: false });
    // } else {
    //   this.props.timeSelectedCallback('fromTime', time);
    //   this.setState({ fromDate: time, isDateTimePickerVisible: false });
    // }

    this.props.timeSelectedCallback('fromTime', time);
    this.setState({ fromDate: time, isDateTimePickerVisible: false });
  }

  _handleToDate(time) {
    this.setState({ toDate: time, isDateTimePickerVisible: false });
    this.props.timeSelectedCallback('toTime', time);
  }


  render() {
    return (
      <View>
        {!this.props.disabled ?
        <React.Fragment>
          <Touchable disabled={this.props.fromTimeDisabled} onPress={() => this.changeStartTime('fromTime')}>
            <View pointerEvents='none'>
              <InlineValidationInputField
                title={i18n.t('TimeSelector.from')}
                placeHolder={'00:00'}
                editable={false}
                isKeyboardInput={true}
                textInputStyle={this.props.fromTimeDisabled ? styles.disabledText : null}
                titleStyle={this.props.fromTimeDisabled ? styles.disabledText : null}
                value={this.state.fromDate ? moment(this.state.fromDate).format('HH:mm') : null}
              />
            </View>
          </Touchable>
          <Touchable disabled={this.props.toTimeDisabled} onPress={() => this.changeStartTime('toTime')}>
            <View pointerEvents='none'>
              <InlineValidationInputField
                title={i18n.t('TimeSelector.to')}
                placeHolder={'00:00'}
                textInputStyle={this.props.toTimeDisabled ? styles.disabledText : null}
                titleStyle={this.props.toTimeDisabled ? styles.disabledText : null}
                editable={false}
                isKeyboardInput={true}
                value={this.state.toDate ? moment(this.state.toDate).format('HH:mm') : null}
              />
            </View>
          </Touchable>
        </React.Fragment>
        :
        <React.Fragment>
          <View pointerEvents='none'>
            <InlineValidationInputField
              title={i18n.t('TimeSelector.from')}
              placeHolder={'00:00'}
              editable={false}
              isKeyboardInput={true}
              textInputStyle={this.props.fromTimeDisabled ? styles.disabledText : null}
              titleStyle={this.props.fromTimeDisabled ? styles.disabledText : null}
              value={this.state.fromDate ? moment(this.state.fromDate).format('HH:mm') : null}
            />
          </View>
          <View pointerEvents='none'>
            <InlineValidationInputField
              title={i18n.t('TimeSelector.to')}
              placeHolder={'00:00'}
              textInputStyle={this.props.toTimeDisabled ? styles.disabledText : null}
              titleStyle={this.props.toTimeDisabled ? styles.disabledText : null}
              editable={false}
              isKeyboardInput={true}
              value={this.state.toDate ? moment(this.state.toDate).format('HH:mm') : null}
            />
          </View>
        </React.Fragment>
        }
        <DateTimePicker
          mode={'time'}
          date={this.selectedDate}
          is24Hour={true}
          titleIOS={i18n.t('TimeSelector.pickTime')}
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this.selectedHandler}
          onCancel={this._hideDateTimePicker}
          minuteInterval={this.state.minuteInterval}
        />
      </View>
    );
  }
}


const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    height: 50,
    flex: 1,
  },
  disabledText: {
    color: theme.DISABLED_ITEM_COLOR
  },
  infoTitleBox: {
    width: 90,
    justifyContent: 'center',
  },
  infoTextBox: {
    flex: 1,
    paddingRight: 15,
    justifyContent: 'center',
  },
  infoTitleText: {
    fontWeight: '500',
    color: theme.PRIMARY_TEXT_COLOR,
  },
  infoText: {
    color: theme.SECONDARY_TEXT_COLOR,
  },
});
