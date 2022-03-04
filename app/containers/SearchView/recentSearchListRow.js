// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

export const RecentSearchListRow = ({ item, index, onSelect }) => {

  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
     <View style={styles.container}>
         <Text style={styles.itemText}>{item}</Text>
         </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
 container: {
     flex: 1,
     paddingVertical: 10,
     paddingHorizontal: 15
 },
 itemText: {
     fontSize: 15
 }
});
