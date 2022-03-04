import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { View, Modal, Animated, Dimensions, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, Image, Text } from 'react-native';
import Icon from '../components/CustomIcon';
import ImageViewer from 'react-native-image-zoom-viewer';
import { theme } from '../styles';
import FileService from '../services/FileService';
import { getImageLink } from '../helpers/APIUtil';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';


const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;

class MultiplePhotoViewerWithGallery extends Component {

  constructor(e) {
    super(e);
    this.state = {
      imageUrlsObjs: [],
      selectedIndex: 0,
      selectedIndexInsideADocument: 0,
      isAnimating: false,
      showLeftArrow: new Animated.Value(0),
      showRightArrow: new Animated.Value(0),
      currentlyVisibleFlatlistIndex: 0
    };
    this.renderImageTile = this.renderImageTile.bind(this);
    this.getImageUrls = this.getImageUrls.bind(this);
    this.close = this.close.bind(this);
    this.onViewableItemsChanged = this.onViewableItemsChanged.bind(this);
    this.viewabilityConfig = { viewAreaCoveragePercentThreshold: 100 };
    this.renderHeader = this.renderHeader.bind(this);
    this.renderLeftArrow = this.renderLeftArrow.bind(this);
    this.renderRightArrow = this.renderRightArrow.bind(this);
  }

  componentDidMount() {
    this.updateUrls(this.props.fileIds);
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.fileIds, nextProps.fileIds)) {
      this.updateUrls(nextProps.fileIds);
    }
  }

  showLeftArrow(isReverse = false) {
    Animated.spring(this.state.showLeftArrow, {
      duration: 80,
      toValue: isReverse ? 1 : 0,
      bounciness: 0,
      useNativeDriver: true
    }).start();
  }

  showRightArrow(isReverse = false) {
    Animated.spring(this.state.showRightArrow, {
      duration: 80,
      toValue: isReverse ? 1 : 0,
      bounciness: 0,
      useNativeDriver: true
    }).start();
  }

  close() {
    this.setState({ selectedIndex: 0 });
    this.props.onClose();
  }

  async updateUrls(idArray = []) {
    const imageUrlsObjs = [];
    for (let i = 0; i < idArray.length; i++) {
      try {
        const fileRes = await FileService.getFileById(idArray[i], this.props.company.selectedCompany.Key);
        const file = fileRes.data[0];
        const tempObj = {
          index: i,
          fileId: file.ID,
          storageReference: file.StorageReference,
          pagesCount: file.Pages > 0 ? file.Pages : 1
        };
        imageUrlsObjs.push(tempObj);
      }
      catch (e) {
      }
    }
    this.setState({ imageUrlsObjs });
  }

  getImageUrls(imageUrlsObj) {
    if (imageUrlsObj == null) {
      return;
    }
    const img = [];
    for (let i = 0; i < imageUrlsObj.pagesCount; i++) {
      img.push({ url: `${getImageLink(imageUrlsObj.storageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, false)}&page=${i + 1}` });
    }
    return img;
  }

  renderImageTile({ item }) {
    return (
      <TouchableOpacity onPress={() => { item.index !== this.state.selectedIndex ?  this.setState({ selectedIndex: item.index, isAnimating: true, selectedIndexInsideADocument: 0 }) : null; setTimeout(() => this.setState({ isAnimating: false }), 2000); }} style={{ justifyContent: 'center' }}>
        <ActivityIndicator
          animating={item.index === this.state.selectedIndex && this.state.isAnimating}
          size={'large'}
          color={'#fff'}
          style={styles.activityIndicator}
        />
        <Image  source={{ uri: `${getImageLink(item.storageReference, this.props.company.selectedCompany.Key, this.props.token.fileServerToken, this.props.token.fileServerTokenUpdatedTimeStamp, false)}&width=${WIDTH / 2}&height=${HEIGHT / 2}` }} style={{ marginBottom: item.index === this.state.selectedIndex ? 8 : 0, height: item.index !== this.state.selectedIndex ? 100 : 106, width: item.index !== this.state.selectedIndex ? 80 : 90, borderRadius: 5, borderColor: theme.PRIMARY_COLOR, borderWidth: item.index === this.state.selectedIndex ? 4 : 0, margin: 10, backgroundColor: '#d3d3d3' }} />
      </TouchableOpacity>
    );
  }

  onViewableItemsChanged({ viewableItems, changed }) {
    this.setState({ currentlyVisibleFlatlistIndex: viewableItems.length > 0 ? viewableItems[0].index : 0 });
    if (viewableItems.some(ele => ele.key === 0) || viewableItems.some(ele => ele.key === this.state.imageUrlsObjs.length - 1)) {
      if (viewableItems.some(ele => ele.key === 0)) { // first item is visible
        this.showLeftArrow(false);
      }
      if (viewableItems.some(ele => ele.key === this.state.imageUrlsObjs.length - 1)) { // last item is visible
        this.showRightArrow(false);
      }
    }
    else {
      if ((this.state.imageUrlsObjs.length * 100) > Dimensions.get('window').width) {
        this.showRightArrow(true);
      }
      this.showLeftArrow(true);
    }
  }

  renderHeader(currentIndex) {
    return (
      <View style={styles.headerBox}>
        <Icon
          onPress={this.close}
          size={50}
          color={'#fff'}
          name="ios-close"
          style={styles.closeButton}
        />
        <Text style={styles.textIndex}>{currentIndex + 1} / {this.state.imageUrlsObjs[this.state.selectedIndex] && this.state.imageUrlsObjs[this.state.selectedIndex].pagesCount ? this.state.imageUrlsObjs[this.state.selectedIndex].pagesCount : 1}</Text>
      </View>
    );
  }

  renderRightArrow() {
    return this.state.imageUrlsObjs[this.state.selectedIndex] && this.state.imageUrlsObjs[this.state.selectedIndex].pagesCount > 1  && this.state.selectedIndexInsideADocument < this.state.imageUrlsObjs[this.state.selectedIndex].pagesCount - 1 ?
      <View style={[styles.arrowIcon, { marginRight: 15 }]}><Text style={{ marginTop: 2 }}> <Icon name={'ios-arrow-forward'} color={'#fff'} size={18} /></Text></View>
      : null;
  }

  renderLeftArrow() {
    return this.state.imageUrlsObjs[this.state.selectedIndex] && this.state.imageUrlsObjs[this.state.selectedIndex].pagesCount > 1 && this.state.selectedIndexInsideADocument > 0 ?
      <View style={[styles.arrowIcon, { marginLeft: 15 }]}><Text style={{ marginTop: 2 }}><Icon name={'ios-arrow-back'} color={'#FFF'} size={18} /> </Text></View>
      : null;
  }

  render() {
    return (
      <Modal
        animationType={'fade'}
        transparent={false}
        visible={this.props.open}
        onRequestClose={() => { }}
        style={{ flex: 1 }}
      >

        {this.renderHeader(this.state.selectedIndexInsideADocument)}

        <ImageViewer
          imageUrls={this.getImageUrls(this.state.imageUrlsObjs[this.state.selectedIndex])}
          loadingRender={() => {
            return (
              <ActivityIndicator
                color={'#fff'}
                size="large"
                style={styles.imageViewer}
              />
            );
          }}
          saveToLocalByLongPress={false}
          onSwipeDown={this.close}
          renderIndicator={() => null}
          enableSwipeDown={true}
          backgroundColor={'black'}
          style={{ flex: 4 }}
          onChange={index => this.setState({ selectedIndexInsideADocument: index })}
          index={this.state.selectedIndexInsideADocument}
          renderArrowRight={this.renderRightArrow}
          renderArrowLeft={this.renderLeftArrow}
        />

        <View style={{ flexDirection: 'row', flex: 1, backgroundColor: 'black' }}>
          <Animated.View style={[{ opacity: this.state.showLeftArrow }, styles.animatedView]} >
            <TouchableNativeFeedbackSafe style={styles.arrow} onPress={() => { this._flatList && this.state.currentlyVisibleFlatlistIndex > 0 ? this._flatList.scrollToIndex({ animated: true, index: this.state.currentlyVisibleFlatlistIndex - 1 }) : null; }}>
              <Icon
                name={'ios-arrow-back'}
                color={'white'}
                size={30}
              />
            </TouchableNativeFeedbackSafe>
          </Animated.View>

          <FlatList
            data={this.state.imageUrlsObjs}
            horizontal
            keyExtractor={item => item.index}
            renderItem={this.renderImageTile}
            contentContainerStyle={{ alignItems: 'center' }}
            onViewableItemsChanged={this.onViewableItemsChanged}
            viewabilityConfig={this.viewabilityConfig}
            scrollEventThrottle={200}
            ref={ref => this._flatList = ref}
          />
          <Animated.View style={[{ opacity: this.state.showRightArrow }, styles.animatedView]}>
            <TouchableNativeFeedbackSafe style={styles.arrow} onPress={() => { this._flatList && this.state.currentlyVisibleFlatlistIndex < this.state.imageUrlsObjs.length - 1 ? this._flatList.scrollToIndex({ animated: true, index: this.state.currentlyVisibleFlatlistIndex + 1 }) : null; }}>
              <Icon
                name={'ios-arrow-forward'}
                color={'white'}
                size={30}
              />
            </TouchableNativeFeedbackSafe>
          </Animated.View>
        </View>

      </Modal >
    );
  }

}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    token: state.token,
    company: state.company,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MultiplePhotoViewerWithGallery);

const styles = StyleSheet.create({

  headerBox: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'black',
    zIndex: 15
  },
  headerIcon: {
    fontWeight: '500',
    padding: 5,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 25,
    marginLeft: 25,
  },
  imageViewer : {
    height: (HEIGHT * 3) / 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  animatedView: {
    width: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrow: {
    flex: 1,
    width: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityIndicator: {
    position: 'absolute',
    alignSelf : 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  header: {
    textAlign: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 20,
    height: 40,
    width: 40,
    marginLeft: 20
  },
  textIndex: {
    color:'#FFF',
    fontSize: 17,
    textAlign: 'center',
    alignItems: 'baseline',
    alignSelf: 'center'
  },
  closeButton: {
    position: 'absolute',
    paddingHorizontal: 15,
    marginBottom: -12,
    left: 0,
    bottom: 0
  },
  arrowIcon: {
    borderRadius: 30,
    backgroundColor: theme.PRIMARY_COLOR,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
