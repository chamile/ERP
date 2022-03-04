// @flow
import React, { Component } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Image as ReactImage
} from 'react-native';

import { SwipeListView } from 'react-native-swipe-list-view';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { NotificationListRowFront } from './NotificationListRowFront';
import { NotificationListRowBack } from './NotificationListRowBack';
import Image from '../../components/CustomIcon';
const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

export default class SingleTabView extends Component {
  constructor() {
    super();
    this.state = {
      timestamp: null
    };
  }

  shouldComponentUpdate(nextProps) {
    let update = false;
    if (this.props.notifications.length == 0) {
      update = true
    }
    else if ((this.props.tabKey === nextProps.selectedKey)) {
      update = true
    }

    return update;
  }

  renderPlaceholder() {
    switch (this.props.placeHolderIndex) {
      case 0:
        return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Image name={'ios-list-box-outline'} size={60} color={theme.SCREEN_COLOR_LIGHT_GREY_1} style={styles.iconStyle} />
            <Text style={styles.placeholderText}>{i18n.t('NotificationsList.index.noNotifications')}</Text>
          </View>
        );
        break;
      case 1:
        return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <ReactImage style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceIcon.png')} />
            <Text style={styles.placeholderText}>{i18n.t('NotificationsList.index.noApprovalsNotifications')}</Text>
          </View>
        );
        break;
      case 2:
        return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Image name={'md-image'} size={60} color={theme.SCREEN_COLOR_LIGHT_GREY_1} style={styles.iconStyle} />
            <Text style={styles.placeholderText}>{i18n.t('NotificationsList.index.noInboxNotifications')}</Text>
          </View>
        );
        break;
      case 3:
        return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Image name={'comment'} size={60} color={theme.SCREEN_COLOR_LIGHT_GREY_1} style={styles.iconStyle} />
            <Text style={styles.placeholderText}>{i18n.t('NotificationsList.index.noCommentNotifications')}</Text>
          </View>
        );
        break;
    }


  }

  render() {
    return (
      <View key={this.props.tabKey} style={{ flex: 1 }}>
        <SwipeListView
          useFlatList={true}
          data={this.props.notifications}
          keyExtractor={item => `${item.ID}`}
          refreshControl={
            <RefreshControl
              refreshing={this.props.isRefreshing}
              onRefresh={this.props.onRefresh}
              tintColor={theme.PRIMARY_COLOR}
            />
          }
          renderItem={(rowData, rowMap) => <NotificationListRowFront
            onSelect={this.props.onSelect} rowData={rowData} rowMap={rowMap}
          />}
          renderHiddenItem={(rowData, rowMap) => <NotificationListRowBack
            readToggleNotification={this.props.readToggleNotification}
            deleteNotification={this.props.deleteNotification}
            rowData={rowData} rowMap={rowMap} deletingRows={this.props.deletingRows}
          />}
          recalculateHiddenLayout={false}
          removeClippedSubviews={Platform.OS == 'ios' ? false : true}
          leftOpenValue={120}
          rightOpenValue={-80}
          onEndReached={this.props.onEndReached}
          onEndReachedThreshold={0.3}
          enableEmptySections={true}
          ListFooterComponent={this.props.notifications.length == 0 ? null : this.props.renderFooter}
          ListHeaderComponent={() => { return ((this.props.notifications || []).length === 0) ? null : <View style={{ height: 15, backgroundColor: theme.SYSTEM_COLOR_WHITE }}></View> }}
          previewRowKey={''}
        />
        {
          (!this.props.isLoading && (this.props.notifications || []).length === 0)
            ? this.renderPlaceholder() : null


        }
      </View>

    );
  }
}

const styles = StyleSheet.create({

  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 60,
    width: 60,
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },


});
