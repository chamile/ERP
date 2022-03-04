import React, { Component } from 'react';
import { View, Modal, Text, Dimensions, ActivityIndicator, StyleSheet } from 'react-native';
import RNPhotoView from 'react-native-photo-view';


const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
export default class LightBox extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    }
  }

  close() {
    this.props.onClose();
    this.setState({ isLoading: true });
  }

  render() {
    const background = (
      <View style={styles.backgroundContainer}>
        {this.state.isLoading ? <View style={styles.activityIndicatorBox}>
          <ActivityIndicator
            animating={true}
            color="#fff"
            size="large"
            />
        </View> : null}
      </View>
    )

    const content = (
      <View>
        <RNPhotoView
          source={{ uri: this.props.imageLink }}
          minimumZoomScale={1}
          maximumZoomScale={3}
          androidScaleType="fitCenter"
          resizeMode={'contain'}
          onLoadEnd={() => this.setState({ isLoading: false })}
          style={styles.photoView} />
      </View>
    )

    const header = (<View style={styles.headerBox}>
      <Text onPress={this.close.bind(this)} style={styles.headerIcon}>X</Text>
    </View>)

    return (
      <Modal
        animationType={"fade"}
        transparent={true}
        visible={this.props.open}
        onRequestClose={()=>{}}
        >
          {background}
          {content}
          {this.state.isLoading ? background : null}
          {header}
      </Modal >
    )
  }
}

const styles = StyleSheet.create({
    backgroundContainer: {
        flex: 1,
        backgroundColor: '#000',
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height
    },
    activityIndicatorBox : {
        width: width,
        height: height,
        position: 'absolute',
        justifyContent: 'center',
        alignSelf: 'center'
    },
    photoView: {
        width: width,
        height: height
    },
    headerBox : {
        position: 'absolute',
        top: 25,
        left: 10,
        zIndex: 100,
        backgroundColor: 'black',
        borderRadius: 5,
    },
    headerIcon: {
        fontWeight: '600',
        fontSize: 28,
        color: 'white',
        paddingHorizontal: 7,
        paddingVertical: 2,
        alignSelf: 'center',
    }
});
