// @flow
import React, { Component } from 'react';
import { View, TextInput, ScrollView, Alert, StyleSheet, Dimensions, Platform } from 'react-native';
import { connect } from 'react-redux';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import FeedbackService from '../../services/FeedbackService';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { getHeaderStyle } from "../../helpers/UIHelper";
import i18n from '../../i18n/i18nConfig';

const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;
class Feedback extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t(`Feedback.index.title`),
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} />,
      headerRight: <HeaderTextButton isActionComplete={navigation.state.params && navigation.state.params.isActionComplete} position={'right'} onPress={navigation.state.params && navigation.state.params.onSend} text={i18n.t(`Feedback.index.send`)} textColor={'white'}/>,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
    };
  };

  constructor() {
    super();
    this.state = {
      title: null,
      body: null
    };

    this.isActionComplete = false;

    this.onSend = this.onSend.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ onSend: this.onSend });
  }

  onSend() {
    if (!this.state.title && !this.state.body) {
      Alert.alert(i18n.t('Feedback.index.errorMsg'));
      return;
    } else if (!this.state.title) {
      Alert.alert(i18n.t('Feedback.index.errorTitleMsg'));
      return;
    } else if (!this.state.body) {
      Alert.alert(i18n.t('Feedback.index.errorBodyMsg'));
      return;
    } else {
      this.isActionComplete = true;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    }

    this.setState({ isReady: false });
    FeedbackService.sendFeedback(
      this.props.company.selectedCompany.Key,
      this.state.title,
      this.state.body
    )
      .then(response => {
        if (!response.ok) {
          throw new Error(JSON.stringify(response));
          this.isActionComplete = false;
          this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        }
        return response;
      })
      .then(() => {
        Alert.alert(i18n.t('Feedback.index.thanks'));
        this.setState({ title: '', body: '', isReady: true });
      }
      )
      .catch(err => {
        this.isActionComplete = false;
        this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        this.setState({ isReady: true });
        this.handleError(err);
      }
      )
  }

  handleError(err) {
    Alert.alert(i18n.t('Feedback.index.error'));
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} loaderPosition={'nav'}>
        <ScrollView keyboardDismissMode={'on-drag'} style={styles.container} key={'scrollView'} horizontal={false}>

          <TextInput
            underlineColorAndroid={'#fff'}
            style={styles.title}
            placeholder={i18n.t('Feedback.index.Title')}
            onChangeText={(title) => this.setState({ title })}
            value={this.state.title}
          />

          <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(150,150,150,0.2)' }} />

          <TextInput
            underlineColorAndroid={'#fff'}
            multiline={true}
            style={styles.body}
            placeholder={i18n.t('Feedback.index.writeFeedback')}
            onChangeText={(body) => this.setState({ body })}
            value={this.state.body}
          />
        </ScrollView>
      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
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
)(Feedback);

const styles = StyleSheet.create({
  container: {
    padding: 15
  },
  titleWrapper: {
    flexDirection: 'row',
    borderBottomColor: '#BBBBBB',
    borderBottomWidth: 1,
    paddingTop: 4,
    paddingBottom: 3
  },
  titleLabel: {
    color: '#787878',
    marginRight: 3
  },
  title: {
    height: 50,
    fontSize: 20,
  },
  body: {
    fontSize: 16,
    height: 150,
    marginTop: 10
  }
});