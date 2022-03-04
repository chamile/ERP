// @flow
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';

import { theme } from '../../styles';
import { getImageLink } from '../../helpers/APIUtil';
import i18n from '../../i18n/i18nConfig';

export const InboxListRowFront = ({ item, onSelect, fileServerToken, fileServerTokenUpdatedTimeStamp, companyKey }) => {

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  return (
    <TouchableHighlight onPress={() => onSelect(item.item)} >
      <View style={styles.button} >
        <View style={styles.infoLeft}>
          <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.item.Name) ? item.item.Name.trim() : i18n.t('InboxList.InboxListRowFront.unknown')}</Text>
          <Text style={styles.infoText} numberOfLines={2} ellipsizeMode={'tail'}>{item.item.Description ? item.item.Description.trim() : i18n.t('InboxList.InboxListRowFront.notSpecified')}</Text>
          <View style={styles.row}>
            <Text style={styles.infoTextSub}>{formatBytes(item.item.Size)}</Text>
            <Text style={styles.infoTextSub}>{`${item.item.TagName ? ' - ' : ''}${item.item.TagName}`}</Text>
          </View>
        </View>
        <View style={styles.infoRight}>
          <Image style={styles.infoThumbnail} source={getImageLink(item.item.StorageReference, companyKey, fileServerToken, fileServerTokenUpdatedTimeStamp, true)} />
        </View>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 100,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: 'white',
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around',
    paddingTop: 3,
    paddingBottom: 3,
  },
  infoRight: {
    width: 90,
    backgroundColor: 'rgba(200,200,200,0.1)',
    padding: 5,
  },
  infoThumbnail: {
    width: 80,
    borderRadius: 5,
    height: 90,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '600',
    fontSize: 15,
  },
  infoTextSub: {
    color: theme.SECONDARY_TEXT_COLOR,
  },
  infoText: {
    color: theme.SCREEN_COLOR_DARK_GREY,
  },
  row: {
    flexDirection: 'row',
  },
});
