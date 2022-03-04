// @flow
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import { theme } from '../../styles';

export const CompanySelectRow =  ({ item, index, onSelect }) => {
  return (
    <Touchable onPress={() => onSelect(item)} key={item.Key} style={styles.button}>
      <View style={styles.infoRow}>
        <Text style={styles.infoTitle} numberOfLines={3}>{ item.Name }</Text>
        <Text style={styles.infoSub}>{ item.ID }</Text>
      </View>
      <View style={styles.carrotIconBox}>
        <Image style={styles.carrotIcon} source={require('../../images/CompanySelect/rightArrow.png')} />
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    height: 80,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)'
  },
  infoRow: {
    flex: 3,
    justifyContent: 'center'
  },
  infoTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR
  },
  infoSub: {
    color: theme.SECONDARY_TEXT_COLOR,
    marginTop: 5
  },
  carrotIconBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  carrotIcon: {
    height: 20,
    width: 20
  }
});
