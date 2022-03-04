// @flow
import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../../components/CustomIcon';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';

const WIDTH = Dimensions.get('window').width;

const EnvSelector = ({ onChange, selected, height }) => {
  return (
    <View style={[styles.selectorContainer, height ? { height } : {}]}>
      <TouchableOpacity onPress={() => onChange('test')} onLongPress={() => onChange('dev')}>
        <View style={[styles.boxView, { marginRight: 30 }, selected === 'test' ? { borderWidth : 1 } : selected === 'dev' ? {  borderWidth : 1, borderColor: theme.SCREEN_COLOR_ORANGE } : {}]}>
          <Icon name="ios-list" size={Platform.OS === 'ios' ? 30 : 20} color={selected === 'test' ? theme.SYSTEM_COLOR_LIGHT_BLUE : selected === 'dev' ? theme.SCREEN_COLOR_ORANGE : theme.SYSTEM_COLOR_LIGHT_GRAY_4} />
          <Text style={[styles.text, selected === 'test' ? { color: theme.SYSTEM_COLOR_LIGHT_BLUE } : {  color: theme.SYSTEM_COLOR_LIGHT_GRAY_4 }, selected === 'dev' ? {  color: theme.SCREEN_COLOR_ORANGE } : {}]}>{selected === 'dev' ? i18n.t('Login.EnvSelector.devEnv') : i18n.t('Login.EnvSelector.testEnv')}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange('pilot')}>
        <View style={[styles.boxView, selected === 'pilot' ? { borderWidth : 1 } : {}]}>
          <Icon name={Platform.OS === 'ios' ? 'ios-appstore-outline' : 'logo-google'} size={Platform.OS === 'ios' ? 30 : 20} color={selected === 'pilot' ? theme.SYSTEM_COLOR_LIGHT_BLUE : theme.SYSTEM_COLOR_LIGHT_GRAY_4} />
          <Text style={[styles.text, selected === 'pilot' ? { color: theme.SYSTEM_COLOR_LIGHT_BLUE } : { color: theme.SYSTEM_COLOR_LIGHT_GRAY_4 }]}>{i18n.t('Login.EnvSelector.pilotEnv')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

EnvSelector.propTypes = {
  onChange: PropTypes.func.isRequired
};

export default EnvSelector;

const styles = StyleSheet.create({
  selectorContainer:{
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'android' ? 35 : 0,
  },
  text: {
    fontSize: 13,
    textAlign: 'center',
  },
  boxView: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 3,
    borderColor: theme.SYSTEM_COLOR_LIGHT_BLUE,
    width: WIDTH * 4 / 11,
    height: WIDTH * 3 / 10,
  },
});
