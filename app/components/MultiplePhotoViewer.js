import React, { Component } from 'react';
import { View, Modal, Text, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from '../components/CustomIcon';
import ImageViewer from 'react-native-image-zoom-viewer';
import { theme } from '../styles';

const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;

export default class MultiplePhotoViewer extends Component {

    // This component required image object array as follows,ß
    // [{url: image url goes here},{url: image url goes here}]

  close() {
    this.props.onClose();
  }


  render() {
    return (
      <Modal
        animationType={'fade'}
        transparent={true}
        visible={this.props.open}
        onRequestClose={() => { }}
      >

        <ImageViewer
          imageUrls={this.props.images.map(((obj) => { return { url: obj }; }))}
          loadingRender={() => {
            return (
              <ActivityIndicator
                color={theme.COLOR_LIGHT_GRAY}
                size="large"
                style={styles.imageViewer}
              />
            );
          }}
          onSwipeDown={this.close.bind(this)}
        />

        <View style={styles.headerBox}>
          <Text onPress={this.close.bind(this)} style={styles.headerIcon}>
            <Icon size={25} color={theme.COLOR_GRAY} name="clear" />
          </Text>
        </View>
      </Modal >
    );
  }

}

const styles = StyleSheet.create({

  headerBox: {
    position: 'absolute',
    width: WIDTH,
    top: 25,
    zIndex: 100,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerIcon: {
    fontWeight: '500',
    padding: 5,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 19,
    marginLeft: 25,

  },
  imageViewer : {
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  }
});
