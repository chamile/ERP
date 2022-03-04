import React, { Component } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Keyboard,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl
} from 'react-native';
import { connect } from 'react-redux';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import Icon from '../components/CustomIcon';
import _ from 'lodash';

import { theme } from '../styles';
import { EntityType } from '../constants/EntityTypes';
import { updateSearchKeywords } from '../actions/recentDataActions';
import ViewWrapperAsync from './ViewWrapperAsync';
import i18n from '../i18n/i18nConfig';
import { ListPaddingComponent } from './ListPaddingComponent';
import { LookupViewSearchVatItem } from './LookupViewSearchVatItem';
import { getHeaderStyle, isIphoneX } from '../helpers/UIHelper';
import { RecentSearchListRow } from '../containers/SearchView/recentSearchListRow';
import ApiErrorHandler from '../helpers/ApiErrorHandler';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class LookupView extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.data.title,
      tabBarVisible: false,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isRefreshing: false,
      entityType: this.props.navigation.state.params.data.entityType,
      dataSet: [],
      originalDataSet: [],
      showSearchResult: false,
      searchText: ''
    };

    this.fetchDataInit = this.fetchDataInit.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.searchList = this.searchList.bind(this);
    this.onRowSelected = this.onRowSelected.bind(this);
    this.findMatchingItems = this.findMatchingItems.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onRecentItemSelect = this.onRecentItemSelect.bind(this);
  }

  componentDidMount() {
    this.fetchDataInit();
  }

  fetchDataInit() {
    this.setState({ isLoading: true });
    this.fetchData(this.fetchDataInit);
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchData(this.refreshData);
  }

  onRecentItemSelect(item) {
    this.setState({ searchText: item }, () => {
      this.findMatchingItems();
    });
  }

  _getRecentSearchKeywords(entityType) {
    if (entityType === EntityType.VAT_TYPE) {
      return _.reverse(this.props.recentData.searchKeywords.VAT_TYPE.slice());
    }
    else {
      return [];
    }

  }

  clearSearch() {
    this.setState({
      searchText: '',
      showSearchResult: this.props.navigation.state.params.data.showInstantResults,
    }, () => {
      this.props.navigation.state.params.data.showInstantResults ? this.searchList('') : null;
    });
  }

  fetchData(caller) {
    this.props.navigation.state.params.data.service()
      .then((response) => {
        if (response.ok) {

          this.setState({ isLoading: false, isRefreshing: false, originalDataSet: [...response.data], dataSet: [...response.data] }, () => this.findMatchingItems());
        } else {
          this.handleDataFetchErrors(response.problem, caller, `${i18n.t('LookupView.dataFetchError')} ${this.state.entityType}`);
        }
      })
      .catch((error) => {
        this.handleDataFetchErrors(error.problem, caller, `${i18n.t('LookupView.dataFetchError')} ${this.state.entityType}`);
      });
  }

  handleDataFetchErrors(problem = 'CLIENT_ERROR', caller, message) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage: message });
  }

  searchList(text) {
    this.setState({ searchText: text });
    this.findMatchingItems(text);
  }

  findMatchingItems() {
    Keyboard.dismiss();
    this.setState({ showSearchResult: true });
    const text = this.state.searchText;
    const { filter } = this.props.navigation.state.params.data;
    const { originalDataSet } = this.state;

    if (!text) {
      this.updateList(this.state.originalDataSet);
      return;
    }

    const _filtered = originalDataSet.filter((item) => {
      const itemProp = filter(item, this.state.searchText);
      if (itemProp !== null) {
        return itemProp;
      }
    });

    this.props.updateSearchKeywords(this.state.entityType, this.state.searchText)
    this.updateList(_filtered);
  }

  updateList(newDataSet) {
    this.setState({ dataSet: [...newDataSet] });
  }

  onRowSelected(item) {
    const { navigation } = this.props;
    navigation.state.params.data.setter(item);
    navigation.goBack();
  }

  onKeyPress() {
    this.findMatchingItems();
  }

  renderPlaceholder(withActivityIndicator = false) {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        {withActivityIndicator ?
          <ActivityIndicator animating={true} size={'large'} />
          :
          <View style={styles.placeholderContainer}>
            <Icon name="ios-list-box-outline" size={35} color={theme.DISABLED_ITEM_COLOR} />
            <Text style={styles.placeholderText}>{i18n.t('SearchView.index.noResultsFound')}</Text>
          </View>
        }
        <View style={styles.palceHolderSpacer} />
      </View>
    );
  }

  renderPlaceholderForNoSearchKeywords() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <View style={styles.placeholderContainer}>
          <Icon name="ios-list-box-outline" size={35} color={theme.DISABLED_ITEM_COLOR} />
          <Text style={styles.placeholderText}>{i18n.t('SearchView.index.noSearchKeywordsFound')}</Text>
        </View>
        <View style={styles.palceHolderSpacer} />
      </View>
    );
  }

  renderSelectedItem() {
    return (
      <View style={styles.selectedItemContainer}>
        <View style={styles.row}>
          <Text style={styles.resultTitle}>
            {i18n.t('SearchView.index.yourCurrentSelection')}
          </Text>
        </View>
        <View style={styles.selectedRow}>
          <View style={styles.mainTextContainer}>
            <View style={styles.rowContainer}>
              <Text style={styles.customerNameText}>
                {_.trimStart(this.props.navigation.state.params.data.selectedItem.Display)}
              </Text>
              <Text style={styles.customerIdText}>
                ID: {this.props.navigation.state.params.data.selectedItem.ID}
              </Text>
            </View>
            <Touchable onPress={this.props.navigation.state.params.data.clearSelectedItem ? () => { this.props.navigation.state.params.data.clearSelectedItem(); this.props.navigation.goBack(); } : null}>
              <View style={styles.clearArea}>
                <Text style={styles.clearButton}>
                  {i18n.t('SearchView.index.clear')}
                </Text>
              </View>
            </Touchable>
          </View>
          <View style={styles.seperator} />
        </View>
      </View>
    );
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} loaderPosition={'nav'}>
        <StatusBar backgroundColor={theme.SECONDARY_STATUS_BAR_COLOR} />
        <View style={styles.searchPanel}>
          <View style={styles.row}>
            <View style={Platform.OS === 'ios' ? styles.textInputContainerIos : styles.textInputContainerAndroid}>
              <Icon name="ios-search" size={20} color={theme.DISABLED_ITEM_COLOR} />
              <TextInput
                style={styles.textInput}
                placeholder={this.props.navigation.state.params.data.searchCriteria
                  ? this.props.navigation.state.params.data.searchCriteria
                  : i18n.t('SearchView.index.textInputPlaceholder')}
                underlineColorAndroid={'rgba(0,0,0,0)'}
                onChangeText={text => { this.setState({ searchText: text }) }}
                value={this.state.searchText}
                returnKeyType={'search'}
                returnKeyLabel={'search'}
                onSubmitEditing={this.onKeyPress}
                blurOnSubmit={true} />
              <TouchableOpacity onPress={this.clearSearch}>
                <View style={styles.closeButton}>
                  <Icon name="ios-close" size={18} color={theme.TEXT_COLOR_INVERT} style={styles.closeIcon} />
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={this.findMatchingItems}>
              <Text style={styles.searchText}>{i18n.t('SearchView.index.search')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {this.props.navigation.state.params.data.selectedItem && this.props.navigation.state.params.data.selectedItem.ID ? this.renderSelectedItem() : null}

        <View style={styles.resultsContainer}>
          <View style={styles.row}>
            <Text style={styles.resultTitle}>
              {this.props.navigation.state.params.data.showInstantResults === true ? i18n.t('SearchView.index.yourSearchResults') : !this.state.showSearchResult
                ? i18n.t('SearchView.index.yourRecentSearches')
                : i18n.t('SearchView.index.yourSearchResults')}</Text>
          </View>
        </View>

        {this.state.isLoading ? this.renderPlaceholder(true) : null}

        {this.props.navigation.state.params.data.showInstantResults === true || this.state.showSearchResult ?
          this.state.dataSet.length !== 0 ?
            <FlatList
              keyExtractor={(item, index) => item.ID}
              data={this.state.dataSet}
              renderItem={(props) => <LookupViewSearchVatItem {...props} onSelect={this.onRowSelected} entityType={this.state.entityType} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshData}
                  tintColor={theme.PRIMARY_COLOR}
                />
              }
              ListHeaderComponent={() => <ListPaddingComponent height={10} />}
              ListFooterComponent={() => <ListPaddingComponent height={isIphoneX() ? 80 : 20} />}
            />
            : this.renderPlaceholder(false)
          :
          this._getRecentSearchKeywords(this.state.entityType).length !== 0 ?
            <FlatList
              keyExtractor={(item, index) => index}
              data={this._getRecentSearchKeywords(this.state.entityType)}
              renderItem={props => <RecentSearchListRow {...props} onSelect={this.onRecentItemSelect} />}
              ListHeaderComponent={() => <ListPaddingComponent height={0} />}
              ListFooterComponent={() => <ListPaddingComponent height={isIphoneX() ? 80 : 20} />}
              scrollEventThrottle={200}
            />
            : this.renderPlaceholderForNoSearchKeywords()
        }
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    recentData: state.recentData
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateSearchKeywords: (entityType, searchKeyword) => dispatch(updateSearchKeywords(entityType, searchKeyword))
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LookupView);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchPanel: {
    padding: 15,
    height: 75,
    paddingTop: 20
  },
  searchText: {
    fontSize: 16,
    color: theme.PRIMARY_COLOR
  },
  textInputContainerIos: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
    borderRadius: 8,
    marginRight: 10
  },
  textInputContainerAndroid: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
    borderRadius: 8,
    marginRight: 10
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 10
  },
  closeButton: {
    width: 16,
    borderRadius: 18,
    height: 16,
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIcon: {
    marginTop: 1,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    zIndex: 1
  },
  resultsContainer: {
    paddingTop: 0
  },
  resultTitle: {
    padding: 15,
    paddingRight: 5,
    fontSize: 16,
    fontWeight: '700',
    color: theme.PRIMARY_TEXT_COLOR
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  },
  palceHolderSpacer: {
    height: 150
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 60,
  },
  customerNameText: {
    color: theme.PRIMARY_TEXT_COLOR
  },
  seperator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'lightgrey'
  },
  customerIdText: {
    paddingTop: 2,
    color: theme.SECONDARY_TEXT_COLOR
  },
  mainTextContainer: {
    paddingVertical: 5,
    flexDirection: 'row',
  },
  clearButton: {
    color: theme.PRIMARY_COLOR,
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 5,
  },
  selectedRow: {
    paddingHorizontal: 15,
  },
  rowContainer: {
    flexDirection: 'column',
    flex: 3,
  },
  clearArea: {
    width: 100,
  },
  selectedItemContainer: {
    marginBottom: 10,
  },
});
