// @flow
import React, { Component } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native';
import { Header } from 'react-navigation';

import { ifIphoneX } from '../helpers/UIHelper';

const WIDTH = Dimensions.get('window').width;

const AngleHeader = (props) => {
  return (
    <View>
      <Header {...props} />
      { Platform.OS === 'ios' ? <Image style={[StyleSheet.absoluteFillObject, { marginTop: ifIphoneX(85, 60), width:WIDTH }]} resizeMode={'cover'} source={require('../images/Shared/angledBar.png')} /> : null }
    </View>
  );
};

export default AngleHeader;

const styles = StyleSheet.create({
  buttonContainer: {
    borderWidth: 2,
    height: 40,
    borderRadius: 5,
    alignSelf: 'center',
  },
  button:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonTitle:{
    fontSize: 14 ,
    fontWeight: '500'
  }
});
