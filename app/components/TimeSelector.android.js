import React, { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  TimePickerAndroid
} from 'react-native';
import moment from 'moment';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import i18n from '../i18n/i18nConfig';
import InlineValidationInputField from '../components/InputFieldWithValidation';
import { theme } from '../styles';

const width = Dimensions.get('window').width;
export default class TimeSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fromDate: props.fromDate ? props.fromDate : new Date(),
      toDate: props.toDate ? props.toDate : new Date()
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      fromDate: props.fromDate,
      toDate: props.toDate
    });
  }

  _showDateTimePicker(type) {
    if (type === 'fromTime') {
      this.showPicker({
        hour: this.state.fromDate.getHours(),
        minute: this.state.fromDate.getMinutes(),
        minuteInterval: 15,
        type
      });
    }
    else {
      this.showPicker({
        hour: this.state.toDate.getHours(),
        minute: this.state.toDate.getMinutes(),
        minuteInterval: 15,
        type
      });
    }
  }

  async showPicker(options) {
    try {
      const { action, minute, hour } = await TimePickerAndroid.open(options);
      if (action === TimePickerAndroid.timeSetAction) {
        let dateToUpdate;
        if (options.type === 'fromTime') {
          dateToUpdate = this.state.fromDate;
          dateToUpdate.setHours(hour);
          dateToUpdate.setMinutes(minute);
          this.setState({ fromDate: dateToUpdate });

          this.props.timeSelectedCallback('fromTime', dateToUpdate);
        }
        else {
          dateToUpdate = this.state.toDate;
          dateToUpdate.setHours(hour);
          dateToUpdate.setMinutes(minute);
          this.setState({ toDate: dateToUpdate });

          this.props.timeSelectedCallback('toTime', dateToUpdate);
        }
      }
    } catch ({ code, message }) {
    }
  }

  render() {
    return (
      <View>
        <Touchable disabled={this.props.fromTimeDisabled} onPress={() => this._showDateTimePicker('fromTime')}>
          <InlineValidationInputField
            title={i18n.t('TimeSelector.from')}
            placeHolder={'00:00'}           
            editable={false}
            isKeyboardInput={true}
            value={this.state.fromDate ? moment(this.state.fromDate).format('HH:mm') : null}
          />
        </Touchable>
        <Touchable disabled={this.props.toTimeDisabled} onPress={() => this._showDateTimePicker('toTime')}>
          <InlineValidationInputField
            title={i18n.t('TimeSelector.to')}
            placeHolder={'00:00'}            
            editable={false}
            isKeyboardInput={true}
            value={this.state.toDate ? moment(this.state.toDate).format('HH:mm') : null}
          />
        </Touchable>
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
