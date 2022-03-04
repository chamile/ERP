import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  StatusBar,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform
} from 'react-native';
import PropTypes from 'prop-types';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { connect } from 'react-redux';

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { CommentsListRow } from '../CommentsView/CommentsListRow';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import MentionsTextInput from '../../components/MentionsTextInput';
import CommentService from '../../services/CommentService';
import AutocompleteService from '../../services/AutocompleteService';
import i18n from '../../i18n/i18nConfig';
import { theme } from '../../styles';
import { ifIphoneX } from '../../helpers/UIHelper'

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class QuickCommentsView extends React.PureComponent {
  static propTypes = {
    entityData: PropTypes.shape({
      CompanyKey: PropTypes.string,
      EntityID: PropTypes.number
    }).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isRefreshing: false,
      comments: [],
      comment: '',
      typedName: '',
      suggestions: []
    };

    this.reqTimer = 0;

    this.refreshInvoiceComments = this.refreshInvoiceComments.bind(this);
    this.postComment = this.postComment.bind(this);
    this.renderSuggestionsRow = this.renderSuggestionsRow.bind(this);
    this.updateSuggestions = this.updateSuggestions.bind(this);
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    this.fetchComments();
  }

  fetchComments(caller) {
    CommentService.getComments(this.props.entityData.EntityID, this.props.entityData.EntityType, this.props.company.selectedCompany.Key)
      .then((response) => {
        if (response.ok) { this.setState({ isLoading: false, isRefreshing: false, comments: response.data }); }
        else { this.handleCommentsFetchErrors(response.problem, caller, i18n.t('QuickView.QuickCommentsView.fetchCommentsError')); }
      })
      .catch((error) => {
        this.handleCommentsFetchErrors(error.problem, caller, i18n.t('QuickView.QuickCommentsView.fetchCommentsError'));
      });
  }

  handleCommentsFetchErrors(problem, caller, userErrorMessage = i18n.t('QuickView.QuickCommentsView.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshInvoiceComments(showAnimation = true) {
    this.setState({ isRefreshing: showAnimation });
    this.fetchComments(this.refreshInvoiceComments);
  }

  postComment(comment) {
    Keyboard.dismiss();
    CommentService.postNewComment(this.props.entityData.EntityID, this.props.entityData.EntityType.toString().toLowerCase(), comment, this.props.company.selectedCompany.Key)
      .then((response) => {
        this.refreshInvoiceComments(false);
      })
      .catch(() => {});

    this.setState({ comment: '' });
  }

  updateSuggestions(mentionedString) {
    this.setState({ typedName: mentionedString });
    if (this.reqTimer) {
      clearTimeout(this.reqTimer);
    }
    this.reqTimer = setTimeout(() => {
      AutocompleteService.getUserSuggestions(mentionedString, this.props.company.selectedCompany.Key)
        .then((response) => {
          this.setState({
            suggestions: response.data
          });
        });
    }, 200);
  }

  _onSuggestionTap(username, hidePanel, hidePanelOnly) {
    hidePanel();
    const comment = this.state.comment.slice(0, - this.state.typedName.length);
    this.setState({
      suggestionsData: [],
      comment: `${comment}@${username}`
    });
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/CommentsView/noCommentsIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('QuickView.QuickCommentsView.noComments')}</Text>
      </View>
    );
  }

  renderSuggestionsRow(rowData, hidePanel) {
    return (
      <View>
      { rowData.UserName ?  
          <Touchable onPress={() => this._onSuggestionTap(rowData.UserName, hidePanel)}>
            <View style={styles.suggestionsRowContainer}>
              <View style={styles.userAvatarBox}>
                <View style={styles.userIconBox}>
                  <Text style={styles.usernameInitials}>{rowData.DisplayName ? rowData.DisplayName.match(/\b(\w)/g).join('').substring(0, 2).toUpperCase() : null}</Text>
                </View>
              </View>
              <View style={styles.userDetailsBox}>
                <Text style={styles.displayNameText}>{rowData.DisplayName}</Text>
                <Text style={styles.usernameText}>@{rowData.UserName}</Text>
              </View>
            </View>
          </Touchable>
          : null }
     </View>
    );
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <FlatList
          keyExtractor={(item, index) => item.ID}
          data={this.state.comments}
          renderItem={props => <CommentsListRow {...props} />}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshInvoiceComments}
              tintColor={theme.PRIMARY_COLOR}
            />
          }
          ListHeaderComponent={() => <ListPaddingComponent height={10} />}
          ListFooterComponent={() => <ListPaddingComponent height={10} />}
        />

        <View style={styles.commentBoxWrapper}>
          <MentionsTextInput
            ref={'commentsTextbox'}
            textInputStyle={{ borderColor: '#ebebeb', borderWidth: 1, padding: 5, paddingTop: 8, fontSize: 15 }}
            textInputMinHeight={35}
            textInputMaxHeight={85}
            underlineColorAndroid={theme.PRIMARY_TEXTINPUT_COLOR}
            returnKeyType={'send'}
            trigger={'@'}
            value={this.state.comment}
            postComment={this.postComment}
            triggerLocation={'new-word-only'}
            onChangeText={(val) => { this.setState({ comment: val }); }}
            suggestionsPanelHeight={50}
            renderSuggestionsRow={this.renderSuggestionsRow}
            suggestionsPanelStyle={{ backgroundColor: '#F1F1F1' }}
            suggestionsData={this.state.suggestions}
            triggerCallback={this.updateSuggestions}
          />
        </View>
        {Platform.OS === 'ios' ? <KeyboardSpacer topSpacing={ifIphoneX(-15,0)} /> : null}
        {!this.state.isLoading && this.state.comments.length === 0 ? this.renderPlaceholder() : null}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(QuickCommentsView);

const styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -9
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
  suggestionsRowContainer: {
    padding: 5,
    flexDirection: 'row',
    paddingRight: 15,
    paddingBottom: 15
  },
  userAvatarBox: {
    width: 35,
    paddingTop: 2
  },
  userIconBox: {
    margin: 5,
    height: 25,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9486CC'
  },
  usernameInitials: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12
  },
  userDetailsBox: {
    flex: 1,
    margin: 5
  },
  displayName: {
    fontSize: 12,
    fontWeight: '500'
  },
  usernameText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)'
  },
  commentBoxWrapper: {
    marginBottom: 10,
    backgroundColor: '#fff'
  }
});
