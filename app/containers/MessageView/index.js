// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,

} from 'react-native';
import { connect } from 'react-redux';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import { HeaderBackButton } from '../../components/HeaderBackButton';

class MessageView extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    return {
      title: i18n.t('MessageView.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      message: ''

    };
  }

  componentDidMount() {
    this.setState({
      message: this.props.navigation.state.params.message,
    });

  }

  render() {
    return (
      <View style={styles.mainView}>
        <ScrollView
          scrollEventThrottle={200}
        >
          <View style={styles.infoContainer}>
            <Text>{this.state.message}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }


}

export default connect(
)(MessageView);

const styles = StyleSheet.create({

  mainView: {
    backgroundColor: 'white', flex: 1
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: 15,
    flexDirection: 'column',
    marginTop: 50
  },
});

