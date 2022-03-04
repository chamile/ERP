// @flow
import React, { Component } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view';
import { theme } from '../../styles';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ApprovalListRowFront } from './ApprovalListRowFront';
import { ApprovalListRowBack } from './ApprovalListRowBack';
import i18n from '../../i18n/i18nConfig';
import { ApprovalTypes } from '../../constants/ApprovalConstants';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

export default  class SingleTabView extends Component {
  constructor() {
    super();
    this.state = {
      timestamp: null
    };
  }

  shouldComponentUpdate(nextProps) {
    const shouldComponentUpdate = ((this.props.approvalKey === nextProps.selectedKey) && (this.state.timestamp !== nextProps.lastUpdatedTimestamp)) || ((this.props.approvalKey === nextProps.selectedKey) && ((this.props.actionPendingRowsApprove !== nextProps.actionPendingRowsApprove) || (this.props.actionPendingRowsReject !== nextProps.actionPendingRowsReject)));
    if (shouldComponentUpdate) {
      this.setState({ timestamp: nextProps.lastUpdatedTimestamp });
    }
    return shouldComponentUpdate;
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceIcon.png')} />
        <Text style={styles.placeholderText}>{this.props.approvalKey == ApprovalTypes.TAB_KEY_INVOICE ? i18n.t('ApprovalsList.index.noInvoiceApprovals') : this.props.approvalKey == ApprovalTypes.TAB_KEY_HOUR ? i18n.t('ApprovalsList.index.noHourApprovals') : i18n.t('ApprovalsList.index.noApprovals')}</Text>
      </View>
    );
  }

  render() {
    let data = [];
    this.props.pendingItems && this.props.pendingItems.length > 0 ? data.push({ title: i18n.t('ApprovalsList.index.pendingCaps'), data: this.props.pendingItems, key: 'PENDING' }) : null;
    this.props.allItems && this.props.allItems.length > 0 ? data.push({ title: i18n.t('ApprovalsList.index.completed'), data: this.props.allItems, key: 'ALL' }) : null;
    return (
      <View key={this.props.approvalKey}>
        <SwipeListView
          useSectionList
          keyExtractor={item => `${item.ID}${this.props.approvalKey}`}
          data={this.props.pendingItems}
          sections={data}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
          )}
          refreshControl={(
            <RefreshControl
              refreshing={this.props.isRefreshing}
              onRefresh={this.props.onRefresh}
              tintColor={theme.PRIMARY_COLOR}
            />
          )}
          renderItem={(rowData, rowMap) => (
            <SwipeRow
              disableLeftSwipe={!(rowData.section.key === 'PENDING')}
              recalculateHiddenLayout={true}
              rightOpenValue={-160}
              disableRightSwipe={true}
            >
              <ApprovalListRowBack
                rowData={rowData}
                rowMap={rowMap}
                approveApproval={this.props.handleApprovalTap}
                rejectApproval={this.props.handleRejectTap}
                sectionKey={this.props.approvalKey}
                actionPendingRowsApprove={this.props.actionPendingRowsApprove}
                actionPendingRowsReject={this.props.actionPendingRowsReject}
              />
              <ApprovalListRowFront
                rowData={rowData}
                rowMap={rowMap}
                onSelect={this.props.onSelect}
                isPendingSection={rowData.section.key === 'PENDING'}
                sectionKey={this.props.approvalKey}
              />
            </SwipeRow>
          )}
          removeClippedSubviews={!(Platform.OS === 'ios')}
          onEndReached={this.props.onEndReached}
          onEndReachedThreshold={0.3}
          enableEmptySections={true}
          ListHeaderComponent={() => <ListPaddingComponent height={10} />}
          ListFooterComponent={() => <ListPaddingComponent height={80} />}
          previewRowKey=""   
        />
        {(!this.props.isLoading &&  ((this.props.pendingItems || []).length === 0) && ((this.props.allItems || []).length === 0))
          ? this.renderPlaceholder() : null }
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
    alignItems: 'center',
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
    lineHeight: 23,
  },
  headerContainer: {
    flex: 1,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomColor: 'rgba(50,50,50,0.1)',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.SCREEN_COLOR_GREY,
  }
});
