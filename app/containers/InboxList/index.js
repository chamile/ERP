// @flow
import React, { Component } from 'react';
import {
    View,
    RefreshControl,
    Image,
    Text,
    Dimensions,
    StyleSheet,
    Platform,
    InteractionManager,
    ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import ActionSheet from 'react-native-actionsheet';
import { SwipeListView } from 'react-native-swipe-list-view';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import InboxService from '../../services/InboxService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { CameraIcon } from '../../components/CameraIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { InboxListRowFront } from './InboxListRowFront';
import { InboxListRowBack } from './InboxListRowBack';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';
import PhotoView from '../../components/PhotoView';
import { getImageLink } from '../../helpers/APIUtil';
import { addTempImages, resetToAddNewInboxItem } from '../../actions/addNewInboxItemActions';
import { addTempImages as  addTempImagesForInvoice } from '../../actions/addNewInvoiceActions';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class InboxList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('InboxList.index.title'),
      headerLeft: <DrawerIcon />,
      headerRight: <CameraIcon
        disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false}
        onPress={() => {
          navigation.navigate('CameraView', {
            showImgGallery: true,
            showSkip: false,
            selectMultiple: false,
            title: i18n.t('AddNewInboxItem.index.title'),
            navigateForwardTo: () => navigation.dispatch(resetToAddNewInboxItem()),
            onImageAdd: images => navigation.dispatch(addTempImages(images)),
          });
        }}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    }
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      inboxList: [],
      pageSize: 20,
      hasNextPage: false,
      isPhotoViewVisible: false,
      storageReferenceToShowOnPhotoView: '',
      inboxImage: {},
      deletingRows: new Set(),
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING) && PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING_BILLS) //check if user has permissions to view this module
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshUserInboxItems = this.refreshUserInboxItems.bind(this);
    this.onInboxSelect = this.onInboxSelect.bind(this);
    this.fetchInboxItems = this.fetchInboxItems.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.handleNoPermission = this.handleNoPermission.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.showPhotoView = this.showPhotoView.bind(this);
    this.closePhotoView = this.closePhotoView.bind(this);
    this.deleteInboxItem = this.deleteInboxItem.bind(this);
    this.showActionSheet = this.showActionSheet.bind(this);
    this.handleActionItemPress = this.handleActionItemPress.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInboxItems() : this.handleNoPermission();
  }

  handleNoPermission() {
    this.setState({ isLoading: false }, () => {
      InteractionManager.runAfterInteractions(() => {
        this.props.navigation.setParams({
          isActionButtonDisabled: true
        });
      });
    });
  }

  onInboxSelect(inboxItem) {
    if (inboxItem.StorageReference) {
      this.setState({ storageReferenceToShowOnPhotoView: inboxItem.StorageReference, inboxImage: inboxItem },  () => this.showActionSheet() );
    }
    else {
      this.showActionSheet();
    }
  }

  showActionSheet() {
    this.ActionSheet.show();
  }

  handleActionItemPress(index) {
    switch (index) {
      case 1:
        this.showPhotoView();
        break;
      case 2:
        {
          this.props.navigation.dispatch(addTempImagesForInvoice([{ ...this.state.inboxImage }]));
          this.props.navigation.navigate('AddNewInvoice', {
            isEdit: false,
            from: 'InboxList',
          });
          break;
        }
    }
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInboxItems() {
    this.setState({ isLoading: true });
    this.fetchUserInboxItems(this.fetchInboxItems);
  }

  filterResponse(list = []) {
    return list.map((item) => {
      return {
        Description: item.Description,
        ID: item.ID,
        Name: item.Name,
        Size: item.Size,
        StorageReference: item.StorageReference,
        TagName: item.FileTags.length > 0 ? item.FileTags[0].TagName : '',
      }
    });
  }

  fetchUserInboxItems(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    InboxService.getInboxItemList(companyKey, 0, this.state.pageSize)
            .then((response) => {
              if (response.ok) {
                let filteredList = this.filterResponse(response.data);
                this.setState({ isLoading: false, isRefreshing: false, inboxList: filteredList, hasNextPage: (response.data.length === this.state.pageSize) });
              } else {
                this.handleInboxFetchErrors(response.problem, caller, i18n.t('InboxList.index.gettingUserInboxError'));
              }
            })
            .catch((error) => {
              this.handleInboxFetchErrors(error.problem, caller, i18n.t('InboxList.index.gettingUserInboxError'));
            });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    InboxService.getInboxItemList(companyKey, this.state.inboxList.length, this.state.pageSize)
            .then((response) => {
              if (response.ok) {
                let filteredList = this.filterResponse(response.data);
                this.setState({ isLoading: false, isRefreshing: false, inboxList: [...this.state.inboxList, ...filteredList], hasNextPage: (response.data.length === this.state.pageSize) });
              } else {
                this.handleInboxFetchErrors(response.problem, caller, i18n.t('InboxList.index.gettingMoreUserInboxError'));
              }
            })
            .catch((error) => {
              this.handleInboxFetchErrors(error.problem, caller, i18n.t('InboxList.index.gettingMoreUserInboxError'));
            });
  }

  handleInboxFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('InboxList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshUserInboxItems() {
    this.setState({ isRefreshing: true });
    this.fetchUserInboxItems(this.refreshUserInboxItems);
  }

  showPhotoView() {
    this.setState({ isPhotoViewVisible: true });
  }

  closePhotoView() {
    this.setState({ isPhotoViewVisible: false });
  }

  deleteInboxItem(item, rowMap) {
    const _deletingRows = new Set([...this.state.deletingRows]);
    _deletingRows.add(item.item.ID);
    this.setState({
      deletingRows: _deletingRows
    });
    InboxService.deleteInboxItem(item.item.ID, this.props.company.selectedCompany.Key)
            .then((res) => {
              rowMap[item.item.ID].closeRow();
              const _newInboxList = this.state.inboxList.filter((obj) => {
                return obj.ID !== item.item.ID;
              });
              _deletingRows.delete(item.item.ID);
              this.setState({
                deletingRows: _deletingRows,
                inboxList: [..._newInboxList],
              });
            })
            .catch((err) => {
              _deletingRows.delete(item.item.ID);
              this.setState({ deletingRows: _deletingRows });
              this.handleInboxFetchErrors(err.problem, null, i18n.t(`InboxList.index.errorDelete`));
            });
  }

  renderPlaceholder() {
    return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceIcon.png')} />
            <Text style={styles.placeholderText}>{i18n.t('InboxList.index.noInboxItems')}</Text>
          </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
            <Text style={styles.placeholderNoAccessText}>{i18n.t('InboxList.index.noAccessToInbox')}</Text>
          </View>
    );
  }

  renderFooter() {
    if (this.state.hasNextPage) {
      return (
              <View style={styles.footerLoaderBox}>
                <ActivityIndicator
                  animating={true}
                  color="#0082C0"
                  size="small"
                />
              </View>
      );
    }
    else {
      return (
              <ListPaddingComponent height={10} />
      );
    }
  }

  render() {
    return (
          <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
            {this.state.hasPermissionToModule ?
                <View>
                    <SwipeListView
                      useFlatList
                      data={[...this.state.inboxList]}
                      keyExtractor={(item) => item.ID}
                      refreshControl={
                              <RefreshControl
                                refreshing={this.state.isRefreshing}
                                onRefresh={this.refreshUserInboxItems}
                                tintColor={theme.PRIMARY_COLOR}
                              />
                            }
                      renderItem={(rowData, rowMap) => <InboxListRowFront
                        item={rowData}
                        onSelect={this.onInboxSelect}
                        fileServerToken={this.props.token.fileServerToken}
                        fileServerTokenUpdatedTimeStamp={this.props.token.fileServerTokenUpdatedTimeStamp}
                        companyKey={this.props.company.selectedCompany.Key}
                      />}
                      renderHiddenItem={(rowData, rowMap) => <InboxListRowBack
                        deleteItem={this.deleteInboxItem}
                        rowData={rowData}
                        rowMap={rowMap}
                        deletingRows={this.state.deletingRows}
                      />}
                      recalculateHiddenLayout={true}
                      removeClippedSubviews={Platform.OS == 'ios' ? false : true}
                      disableRightSwipe={true}
                      leftOpenValue={120}
                      rightOpenValue={-80}
                      onEndReached={this.onEndReached}
                      onEndReachedThreshold={0.3}
                      enableEmptySections={true}
                      ListHeaderComponent={() => <ListPaddingComponent height={10} />}
                      ListFooterComponent={() => <ListPaddingComponent height={20} />}
                      previewRowKey={''}
                    />

                    {!this.state.isLoading && this.state.inboxList.length === 0 && this.state.hasPermissionToModule ? this.renderPlaceholder() : null}
                    <PhotoView open={this.state.isPhotoViewVisible} onClose={this.closePhotoView} imageLink={`${getImageLink(this.state.storageReferenceToShowOnPhotoView, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, false)}&width=${WIDTH}&height=${HEIGHT}`} />
                  </View>
                    : this.renderPlaceholderWithNoPermission()}
            <ActionSheet
              ref={actionSheet => this.ActionSheet = actionSheet}
              options={[
                i18n.t('InboxList.index.cancel'),
                i18n.t('InboxList.index.viewImage'),
                i18n.t('InboxList.index.useInSupplierInvoice'),
              ]}
              cancelButtonIndex={0}
              onPress={this.handleActionItemPress}
            />
          </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    invoiceNav: state.invoiceNav,
    invoiceList: state.invoiceList,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InboxList);

const styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.6
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  imageWithNotificationBadge: {
    width: 28,
    height: 28
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flex: 1
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 10,
    marginTop: (Platform.OS == 'ios') ? 8 : 16,
  },
});
