// @flow
import React, { Component } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import Icon from '../components/CustomIcon';
import ImagePicker from 'react-native-image-crop-picker';
import Analytics from 'appcenter-analytics';
import { getHeaderStyle, isIphoneX } from '../helpers/UIHelper';
import i18n from '../i18n/i18nConfig';
import { theme } from '../styles';
import { HeaderBackButton } from '../components/HeaderBackButton';
import { AnalyticalEventNames } from '../constants/AnalyticalEventNames';

export default class CameraView extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params && navigation.state.params.title ? navigation.state.params.title : i18n.t('CameraView.title'),
      tabBarVisible: false,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('CameraView.back')} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
    };
  };

  constructor(props) {
    super(props);
    this.takePicture = this.takePicture.bind(this);
    this.openGallery = this.openGallery.bind(this);
    this.navigateToNextView = this.navigateToNextView.bind(this);
    this.onImageSelected = this.onImageSelected.bind(this);
  }

  navigateToNextView() {
    this.props.navigation.state.params.navigateForwardTo
      ? this.props.navigation.state.params.navigateForwardTo()
      : this.props.navigation.goBack();
  }

  onImageSelected(images = []) {
    this.props.navigation.state.params.onImageAdd(images);
  }

  takePicture() {
    this.camera.takePictureAsync({base64:true})
      .then((data) => {
        let images = [];
        images.push(data.uri);
        this.onImageSelected(images);
        this.navigateToNextView();
        Analytics.trackEvent(AnalyticalEventNames.IMAGE_SELECTION, { From: 'Camera' });
      })
      .catch((error) => {
        // Occurs when the user does not select an image.
        // No need to handle it since we allow uploads without images.
      });
  }

  openGallery() {
    ImagePicker.openPicker({
      multiple: this.props.navigation.state.params ? this.props.navigation.state.params.selectMultiple : true
    })
      .then(images => {        
        if (Array.isArray(images)) {
          this.onImageSelected(images.map((img) => img.path));
        }
        else {
          this.onImageSelected([images.path]);
        }
        this.navigateToNextView();
        Analytics.trackEvent(AnalyticalEventNames.IMAGE_SELECTION, { From: 'Gallery' });
      }
      )
      .catch(error => {
        // Occurs when the user does not select an image.
        // No need to handle it since we allow uploads without images.
      });
  }

  noPermissionPlaceHolder() {
    return <View style={{ flex: 1, backgroundColor: 'black' }}>
      <View style={styles.noPermissionPlaceHolder}>
        <Text style={{ fontSize: 22, color: theme.SYSTEM_COLOR_WHITE }}>{i18n.t('CameraView.noUserPermission')}</Text>
        <View style={{ width: Dimensions.get('window').width - 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center', color: theme.SCREEN_COLOR_GREY }}>{i18n.t('CameraView.allowCameraAccess')}</Text>
        </View>
      </View>
      <View style={styles.cameraBottom}>
        {!this.props.navigation.state.params.showImgGallery
          ? <View style={styles.bottomItem} /> :
          <Touchable style={styles.bottomItem} onPress={this.openGallery}>
            <Icon name="ios-images-outline" size={30} color="#FFFFFF" />
          </Touchable>
        }
        <Touchable style={styles.bottomItem}>
          <Image source={require('../images/CameraView/noPermissioncameraButton.png')} />
        </Touchable>
        {!this.props.navigation.state.params.showSkip
          ? <View style={styles.bottomItem} /> :
          <Touchable style={styles.bottomItem} onPress={() => this.props.navigation.state.params.navigateForwardTo ? this.props.navigation.state.params.navigateForwardTo() : this.props.navigation.goBack()}>
            <Text style={styles.bottomText} >{i18n.t('CameraView.skip')}</Text>
          </Touchable>
        }
      </View>
    </View>
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar backgroundColor={theme.SECONDARY_STATUS_BAR_COLOR} />
        <RNCamera
          defaultOnFocusComponent={true}
          ref={ref => {
            this.camera = ref;
          }}
          defaultTouchToFocus={true}
          type={RNCamera.Constants.Type.back}
          orientation={RNCamera.Constants.Orientation.auto}
          style={styles.preview}
          notAuthorizedView={this.noPermissionPlaceHolder()}
        >
          <View style={styles.cameraBottom}>
            {!this.props.navigation.state.params.showImgGallery
              ? <View style={styles.bottomItem} /> :
              <Touchable style={styles.bottomItem} onPress={this.openGallery}>
                <Icon name="ios-images-outline" size={30} color="#FFFFFF" />
              </Touchable>
            }
            <Touchable style={styles.bottomItem} onPress={this.takePicture.bind(this)}>
              <Image source={require('../images/CameraView/cameraButton.png')} />
            </Touchable>
            {!this.props.navigation.state.params.showSkip
              ? <View style={styles.bottomItem} /> :
              <Touchable style={styles.bottomItem} onPress={() => this.props.navigation.state.params.navigateForwardTo ? this.props.navigation.state.params.navigateForwardTo() : this.props.navigation.goBack()}>
                <Text style={styles.bottomText} >{i18n.t('CameraView.skip')}</Text>
              </Touchable>
            }
          </View>
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </RNCamera>
      </View>    
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width
  },
  bottomItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0)'
  },
  bottomText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15
  },
  cameraBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 90,
    width: Dimensions.get('window').width,
    alignItems: 'center',
    backgroundColor: '#0086c3'
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000'
  },
  iphoneXSpace: {
    height: 20,
    width: Dimensions.get('window').width,
    backgroundColor: '#0086c3'
  },
  noPermissionPlaceHolder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

  }
});
