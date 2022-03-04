// @flow
import React, { Component } from 'react';
import {
  View,
  RefreshControl,
  FlatList,
  Image,
  Text,
  Dimensions,
  StyleSheet,
  InteractionManager,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import QuoteService from '../../services/QuoteService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { QuoteListRow } from './QuoteListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class QuoteList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('QuoteList.index.QuoteList'),
      headerLeft: <DrawerIcon />,
      headerRight: <SearchIcon
        navigate={navigation.navigate}
        data={
        {
          title: i18n.t('QuoteList.index.searchQuotes'),
          entityType: EntityType.CUSTOMER_QUOTE,
        }
        }
        disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      quotes: [],
      pageSize: 20,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_ALL) || PermissionChecker.hasUserPermissionType(PermissionType.UI_SALES_QUOTES), //check if user has permissions to view this module 
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshQuotes = this.refreshQuotes.bind(this);
    this.onQuoteSelect = this.onQuoteSelect.bind(this);
    this.fetchInitialQuotes = this.fetchInitialQuotes.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialQuotes() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.quoteList.lastEditedTime != newProps.quoteList.lastEditedTime) {
      this.refreshQuotes();
    }
  }

  handleNoPermission() {
    this.setState({ isLoading: false }, () => {
      InteractionManager.runAfterInteractions(() => {
        this.props.navigation.setParams({
          isActionButtonDisabled: true,
        });
      });
    });
  }

  onQuoteSelect(quote) {
    const _onQuoteSelect = () => {
      this.props.navigation.navigate('QuoteDetails', {
        quoteID: quote.ID,
        EntityType: 'customerquote',
        CompanyKey: this.props.company.selectedCompany.Key,
      });
    };
    Platform.OS === 'ios' ? _onQuoteSelect() : setTimeout(_onQuoteSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialQuotes() {
    this.setState({ isLoading: true });
    this.fetchQuotes(this.fetchInitialQuotes);
  }

  fetchQuotes(caller) {
    const companyKey = this.props.company.selectedCompany.Key;

    QuoteService.getQuotes(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, quotes: [...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleQuoteFetchErrors(response.problem, caller, i18n.t('QuoteList.index.fetchQuoteError'));
        }
      })
      .catch((error) => {
        this.handleQuoteFetchErrors(error.problem, caller, i18n.t('QuoteList.index.fetchQuoteError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;

    QuoteService.getQuotes(companyKey, this.state.quotes.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, quotes: [...this.state.quotes, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleQuoteFetchErrors(response.problem, caller, i18n.t('QuoteList.index.fetchQuoteError'));
        }
      })
      .catch((error) => {
        this.handleQuoteFetchErrors(error.problem, caller, i18n.t('QuoteList.index.fetchQuoteError'));
      });
  }

  handleQuoteFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('QuoteList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshQuotes() {
    this.setState({ isRefreshing: true });
    this.fetchQuotes(this.refreshQuotes);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Sales/noOrdersIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('QuoteList.index.noQuotes')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('QuoteList.index.noAccessToSales')}</Text>
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
        <ListPaddingComponent height={50} />
      );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        {this.state.hasPermissionToModule ?
          <View style={styles.container}>
            <FlatList
              keyExtractor={(item, index) => item.ID}
              data={this.state.quotes}
              renderItem={props => <QuoteListRow {...props} onSelect={this.onQuoteSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshQuotes}
                  tintColor={theme.PRIMARY_COLOR}
                />
              }
              ListHeaderComponent={() => <ListPaddingComponent height={20} />}
              ListFooterComponent={this.renderFooter}
              onEndReached={this.onEndReached}
              onEndReachedThreshold={0.3}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            />

            {!this.state.isLoading && this.state.quotes.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('QuoteList.index.addNewQuote')} buttonStyle={styles.addQuoteButton} onPress={() => this.props.navigation.navigate('AddNewQuote', { navigation: this.props.navigation, isEdit: false })} />
            </FloatingBottomContainer>
          </View>
          : this.renderPlaceholderWithNoPermission()}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    quoteList: state.quoteList,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(QuoteList);

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
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  tabIconStyle: {
    width: 28,
    height: 28,
  },
  addQuoteButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  container: {
    flex: 1,
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
