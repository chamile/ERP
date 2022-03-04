// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Analytics from 'appcenter-analytics';

import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { resetToInboxList, clearTempImages } from '../../actions/addNewInboxItemActions';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ViewWrapper from '../../components/ViewWrapper';
import UploadService from '../../services/UploadService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import ImageCarousel from '../../components/ImageCarousel';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import InboxService from '../../services/InboxService';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

class AddNewInboxItem extends Component {

    static navigationOptions = ({ navigation, screenProps }) => {
      return {
        title: i18n.t('AddNewInboxItem.index.title'),
        headerLeft: <HeaderBackButton onPress={() => navigation.state.params.goBack()} title={i18n.t('AddNewInboxItem.index.back')}/>,
        headerRight: <HeaderTextButton position={'right'}
                isActionComplete={navigation.state.params.isActionComplete}
                onPress={navigation.state.params.handleUpload}
                text={i18n.t('AddNewInboxItem.index.upload')} />,
        headerTintColor: theme.TEXT_COLOR_INVERT,
        headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      };
    };

    constructor() {
      super();
      this.state = {
        description: '',
        isUploading: false,
        moveAnimation: new Animated.Value(0),
        didImageUploadFail: false,
      };
      this.isActionComplete = false;

      this.handleUpload = this.handleUpload.bind(this);
      this.goBack = this.goBack.bind(this);
      this.isValid = this.isValid.bind(this);
      this.upload = this.upload.bind(this);
      this.tagFile = this.tagFile.bind(this);
      this.scrollToBottom = this.scrollToBottom.bind(this);
    }

    componentDidMount() {
      this.props.navigation.setParams({ handleUpload: this.handleUpload, goBack: this.goBack });
    }

    goBack() {
      this.props.navigation.goBack();
      this.props.clearTempImages();
    }

    handleUpload() {
      if (!this.state.isUploading && this.isValid()) {
        this.startAnimation();
        this.setState({ isUploading: true });
        this.upload(this.handleUpload);
      } else if (!this.isValid()) {
        AlertService.showSimpleAlert('', i18n.t('AddNewInboxItem.index.invalidImageLength'), AlertType.WARNING);
      } else {
        this.isActionComplete = false;
        this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      }
    }

    tagFile(ID) {
      this.startAnimation(false);
      this.setState({ isUploading: true });
      InboxService.tagUploadedFile(ID, this.props.company.selectedCompany.Key)
        .then(res => {
          this.startAnimation(true);
          this.setState({ isUploading: false });
          this.props.clearTempImages();
          this.props.resetToInboxList();
          Analytics.trackEvent(AnalyticalEventNames.UPLOAD_INBOX);
        })
        .catch(err => {
          this.handleInboxItemUploadErrors(err.problem, this.tagFile.bind(null, ID), i18n.t('AddNewInboxItem.index.uploadError'));
        });
    }

    upload(caller) {
      UploadService.uploadInboxItem(
        this.props.newInboxItem.tempImages[0],
        this.state.description,
        this.props.token.accessToken,
        this.props.company.selectedCompany.Key)
        .then(async res => {
          if (res.ok) {
            this.tagFile(res.data.ExternalId);
          }
        })
        .catch(err => {
          this.handleInboxItemUploadErrors(err.problem, caller, i18n.t('AddNewInboxItem.index.uploadError'));
        });
    }

    handleInboxItemUploadErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewInboxItem.index.somethingWrong')) {
      this.setState({ isUploading: false });
      this.startAnimation(true);
      ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }

    scrollToBottom() {
      setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
    }

    startAnimation(reverse = false) {
      Animated.timing(
        this.state.moveAnimation,
        {
          toValue: reverse ? 0 : 1,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        },
      ).start();
    }

    isValid() {
      return this.props.newInboxItem.tempImages.length === 1;
    }

    render() {
      return (
            <ViewWrapper withFade={true} withMove={true} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} >

                <Animated.View
                    style={[styles.animatedPanel, {
                      transform: [
                        {
                          translateY: this.state.moveAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-60, 0],
                          })
                        }
                      ]
                    }]}
                >
                    <View style={styles.animatedPanelLoader}>
                        <ActivityIndicator
                            animating={true}
                            style={[{ height: 80 }]}
                            size="small"
                        />
                    </View>
                    <View style={styles.animatedPanelText}>
                        <Text>{i18n.t('AddNewInboxItem.index.uploading')}</Text>
                    </View>
                </Animated.View>
                <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false}>
                    <ImageCarousel
                        images={this.props.newInboxItem.tempImages}
                        viewModeOnly={true}
                        noImageTitle={i18n.t('ImageCarousel.noImageTitle')}
                        getImageURI={(image) => { return { uri: image } }}
                    />
                    <View style={styles.infoContainer}>
                        <View style={styles.textInput}>
                            <TextInput
                                editable={true}
                                multiline={true}
                                placeholder={i18n.t('AddNewInboxItem.index.description')}
                                onChangeText={description => this.setState({ description })}
                                value={this.state.description}
                                onFocus={this.scrollToBottom}
                                onSubmitEditing={this.scrollToBottom}
                                underlineColorAndroid={'transparent'}
                            />
                        </View>
                    </View>
                    {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
                    {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
                </ScrollView>
            </ViewWrapper>
      );
    }
}


const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    newInboxItem: state.newInboxItem,
    token: state.token,
  };
};

const mapDispatchToProps = (dispatch, { navigation }) => {
  return {
    resetToInboxList: () => dispatch(resetToInboxList()),
    clearTempImages: () => dispatch(clearTempImages()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewInboxItem);

const styles = StyleSheet.create({
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  spacer: {
    height: 25,
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  animatedPanelLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  animatedPanelText: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  textInput: {
    borderColor: theme.SECONDARY_TEXT_COLOR,
    borderWidth: 0.5,
    padding: 10,
    marginBottom: 25,
  },
  iphoneXSpace: {
    height: 20,
  }
});
