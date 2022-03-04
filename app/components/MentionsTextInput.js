import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  TextInput,
  FlatList,
  Image,
  Platform
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import { theme } from '../styles';
import i18n from '../i18n/i18nConfig';

export default class MentionsTextInput extends Component {
  constructor() {
    super();
    this.state = {
      textInputHeight: '',
      isTrackingStrated: false,
      suggestionsPanelHeight: new Animated.Value(0),
    };

    this.isTrackingStrated = false;
    this.previousChar = ' ';
  }

  componentWillMount() {
    this.setState({
      textInputHeight: this.props.textInputMinHeight
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.value) {
      this.resetTextbox();
    }
  }

  startTracking() {
    this.isTrackingStrated = true;
    this.openSuggestionsPanel();
    this.setState({
      isTrackingStrated: true
    });
  }

  stopTracking() {
    this.isTrackingStrated = false;
    this.closeSuggestionsPanel();
    this.setState({
      isTrackingStrated: false
    });
  }

  openSuggestionsPanel() {
    Animated.spring(this.state.suggestionsPanelHeight, {
      duration: 100,
      toValue: this.props.suggestionsPanelHeight,
      friction: 4,
    }).start();
  }

  closeSuggestionsPanel() {
    Animated.timing(this.state.suggestionsPanelHeight, {
      toValue: 0,
      duration: 100,
    }).start();
  }

  updateSuggestions(lastKeyword) {
    this.props.triggerCallback(lastKeyword);
  }

  identifyKeyword(val) {
    if (this.isTrackingStrated) {
      const boundary = this.props.triggerLocation === 'new-word-only' ? 'B' : '';
      const pattern = new RegExp(`\\${boundary}${this.props.trigger}[a-z0-9_-]+|\\${boundary}${this.props.trigger}`, 'gi');
      const keywordArray = val.match(pattern);
      if (keywordArray && !!keywordArray.length) {
        const lastKeyword = keywordArray[keywordArray.length - 1];
        this.updateSuggestions(lastKeyword);
      }
    }
  }

  onChangeText(val) {
    this.props.onChangeText(val); // pass changed text back
    const lastChar = val.substr(val.length - 1);
    const wordBoundry = (this.props.triggerLocation === 'new-word-only') ? this.previousChar.trim().length === 0 : true;
    if (lastChar === this.props.trigger && wordBoundry) {
      this.startTracking();
    } else if (lastChar === ' ' && this.state.isTrackingStrated || val === '') {
      this.stopTracking();
    }
    this.previousChar = lastChar;
    this.identifyKeyword(val);
  }

  resetTextbox() {
    this.setState({ textInputHeight: this.props.textInputMinHeight });
  }

  postComment() {
    if (this.props.value) {
      this.props.postComment(this.props.value);
      setTimeout(() => {
        this._textInput.setNativeProps({ text: '' });
        this.setState({ textInputHeight: this.props.textInputMinHeight });
      }, 0); // this is the only way
    }
  }

  onKeyPress() {
    this.postComment();
  }

  render() {
    const { t } = this.props;
    return (
      <View>
        <Animated.View style={[{ ...this.props.suggestionsPanelStyle }, { height: this.state.suggestionsPanelHeight }]}>
          <FlatList
            keyboardShouldPersistTaps={'always'}
            horizontal={true}
            enableEmptySections={true}
            keyExtractor={(item, index) => item.ID}
            data={this.props.suggestionsData}
            renderItem={props => this.props.renderSuggestionsRow(props.item, this.stopTracking.bind(this))}
          />
        </Animated.View>

        <View style={styles.mainContainer}>
          <TextInput
            {...this.props}
            onContentSizeChange={(event) => {
              this.setState({
                textInputHeight: this.props.textInputMinHeight >= event.nativeEvent.contentSize.height ? this.props.textInputMinHeight : event.nativeEvent.contentSize.height,
              });
            }}
            ref={component => this._textInput = component}
            onChangeText={this.onChangeText.bind(this)}
            multiline={true}
            value={this.props.value}
            style={[{ ...this.props.textInputStyle }, styles.textInput, { height: Math.min(this.props.textInputMaxHeight, this.state.textInputHeight) }]}
            placeholder={i18n.t('CommentsView.index.writeComment')}
            onSubmitEditing={this.onKeyPress.bind(this)}
            underlineColorAndroid={theme.PRIMARY_TEXTINPUT_COLOR}
            blurOnSubmit={true}
            autoCorrect={false}
            enablesReturnKeyAutomatically={true}
          />

          <View style={[styles.sendButtonContaier, { bottom: this.props.textInputMinHeight > 40 ? 5 : (this.props.textInputMinHeight) / 2 - 14 }]}>
            <Touchable onPress={this.postComment.bind(this)}>
              <View style={styles.imageContainer}>
                <Image style={styles.sendButton} source={require('../images/CommentsView/sendButton.png')} />
              </View>
            </Touchable>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginVertical: 5
  },
  textInput: {
    flex: 1,
    marginRight: 40,
    marginLeft: 5,
    backgroundColor: theme.PRIMARY_TEXTINPUT_COLOR,
    borderRadius: 5
  },
  sendButtonContaier: {
    width: 35,
    position: 'absolute',
    right: 0,
    justifyContent: 'center'
  },
  sendButton: {
    height: 28,
    width: 28
  },
  imageContainer: {
    backgroundColor: '#fff'
  }
});