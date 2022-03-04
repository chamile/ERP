// @flow
import React, { Component } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import { theme } from '../../styles';
import ViewWrapper from '../../components/ViewWrapper';
import i18n from '../../i18n/i18nConfig';

class CompanySwitch extends Component {
  static navigationOptions = () => {
    return {
      header: null,
    };
  };

  render() {
    return (
      <ViewWrapper withFade={false} withMove={false} fromBackgroundStyle={styles.wrapperToBackground}>
        <StatusBar backgroundColor="#0175aa" />
        <View style={styles.container}>
          <View style={styles.innerContainer}>
            <Image style={styles.icon} source={require('../../images/CompanySelect/noCompanyIcon.png')} />
            <Text style={styles.textStyle}>
              {i18n.t('CompanySwitch.index.switchingCompany')}
              {this.props.navigation.state.params && this.props.navigation.state.params.companyName ? <Text> {i18n.t('CompanySwitch.index.to')}{'\n'}<Text style={{ fontWeight: '600' }}>{this.props.navigation.state.params.companyName}</Text></Text> : '...'}
            </Text>
            <ActivityIndicator size="small" color={theme.SYSTEM_COLOR_LIGHT_BLUE}  animating={true} />
          </View>
        </View>
      </ViewWrapper>
    );
  }
}

export default CompanySwitch;

const styles = StyleSheet.create({
  wrapperToBackground: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 50
  },
  textStyle: {
    color: theme.SYSTEM_COLOR_LIGHT_GRAY_4,
    marginVertical: 10,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22
  },
  icon: {
    height: 60,
    width: 60,
    opacity: 0.6,
  }
});
