// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import TimeAgo from 'react-native-timeago';
import { decode } from 'he';

import { theme } from '../../styles';

export const CommentsListRow =  ({ item, index }) => {
  return (
    <Touchable key={item.ID} style={styles.button}>
      <View style={styles.commentsRowContainer}>
        <View style={styles.commentAuthorBox}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitials}>{decode(item.Author.DisplayName && item.Author.DisplayName.match(/\b(\w)/g) ? item.Author.DisplayName.match(/\b(\w)/g).join('').substring(0, 2).toUpperCase() : '')}</Text>
          </View>
        </View>
        <View style={styles.commentContentBox}>
          <View style={styles.commentInfoBox}>
            <View style={styles.authorNameBox}>
              <Text style={styles.authorNameText}>{decode(item.Author.DisplayName)}</Text>
            </View>
            <View style={styles.commentDateBox}>
              <Text style={styles.commentDateText}><TimeAgo time={item.CreatedAt} /></Text>
            </View>
          </View>
          <Text style={styles.commentText}>{decode(item.Text)}</Text>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(200,200,200,0.1)'
  },
  commentsRowContainer: {
    padding: 5,
    flexDirection: 'row'
  },
  commentAuthorBox: {
    width: 50
  },
  authorAvatar: {
    margin: 5,
    height: 40,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9486CC'
  },
  authorInitials: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20
  },
  commentContentBox: {
    flex: 1,
    paddingLeft: 5,
    margin: 5
  },
  commentInfoBox: {
    height: 15,
    flexDirection: 'row'
  },
  authorNameBox: {
    flex: 3
  },
  authorNameText: {
    color: theme.HINT_TEXT_COLOR,
    fontSize: 12
  },
  commentDateBox: {
    flex: 2,
    alignItems: 'flex-end'
  },
  commentDateText: {
    fontSize: 12,
    color: theme.SECONDARY_TEXT_COLOR
  },
  commentText: {
    marginTop: 5,
    color: theme.PRIMARY_TEXT_COLOR,
    lineHeight: 20,
    fontSize: 13
  },
});
