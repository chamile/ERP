// @flow
import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import moment from 'moment';
import _ from 'lodash';
import TimeAgo from 'react-native-timeago';
import { decode } from 'he';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import WorkItemApprovalService from '../../services/WorkItemApprovalService';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { WorkItemGroupStatus } from '../../constants/WorkItemGroups';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { HeaderTextButton } from '../../components/HeaderTextButton';

const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

// Navigation state params which can be available
// selectedDate
// workerRelationID
// WorkItemGroupID

class HoursRejectionMessage extends Component {
    static navigationOptions = ({ navigation }) => {
      return {
        title: i18n.t('HoursRejectionMessage.index.rejectionMsg'),
        headerLeft: <HeaderBackButton onPress={() => { navigation.state.params.disabled ? null : navigation.goBack(); }} />,
        headerRight: <HeaderTextButton onPress={null} text="" />,
        headerTintColor: theme.TEXT_COLOR_INVERT,
        headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
        headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
      };
    };

    constructor(props) {
      super(props);
      this.state = {
        moveAnimation: new Animated.Value(0),
        isReady: false,
        draftWorkItemGroups: [],
        isRefreshing: false,
        error: false,
        messageList: [],
        isViewOnly: false,
        selectedDate: props.navigation.state.params.selectedDate ? moment(props.navigation.state.params.selectedDate) : moment(),
        workerRelationID: props.navigation.state.params.workerRelationID ? props.navigation.state.params.workerRelationID : null,
        actionMessage: i18n.t('HoursRejectionMessage.index.unlockWeekForEditing'),
        weekNoLable: `${i18n.t('HoursRejectionMessage.index.week')} ${props.navigation.state.params.selectedDate ? moment.isMoment(props.navigation.state.params.selectedDate) ? props.navigation.state.params.selectedDate.isoWeek() : moment(props.navigation.state.params.selectedDate).isoWeek() : moment().isoWeek()}`,
      };
      this.unlockWeek = this.unlockWeek.bind(this);
      this.startAnimation = this.startAnimation.bind(this);
      this.fetchWeekMessages = this.fetchWeekMessages.bind(this);
    }

    componentDidMount() {
      this.fetchWeekMessages();
      const { isViewOnly } = this.props.navigation.state.params;
      this.setState({ isViewOnly });
    }

    startAnimation(reverse = false) {
      Animated.timing(
        this.state.moveAnimation,
        {
          toValue: reverse ? 0 : 1,
          duration: 250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        },
      ).start();
    }

    handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('HoursRejectionMessage.index.somethingWrong')) {
      ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }

    fetchWeekMessages() {
      this.setState({ isRefreshing: true, });
      WorkItemApprovalService.getDraftWorkItemGroupsForEditWeek(this.props.company.selectedCompany.Key, this.state.workerRelationID, moment(this.state.selectedDate).startOf('W').format('YYYY-MM-DD'), moment(this.state.selectedDate).endOf('W').format('YYYY-MM-DD'))
        .then((res) => {
          if (res.ok) {
            this.setState({ draftWorkItemGroups: [...res.data.Data ]});
            if (this.props.navigation.state.params.WorkItemGroupID) {
              return WorkItemApprovalService.getCommentsForWorkItemGroups(this.props.company.selectedCompany.Key, this.props.navigation.state.params.WorkItemGroupID)
                .then((response) => {
                  const msgList = [];
                  response.data.forEach((resMsg) => {
                    msgList.push(resMsg);
                  });
                  this.setState({
                    messageList: [...msgList],
                    draftWorkItemGroups: [...res.data.Data],
                    isReady: true,
                    isRefreshing: false,
                    error: false,
                  });
                });
            }
            else {
              return Promise.all([...this.state.draftWorkItemGroups.filter(e => e.StatusCode === WorkItemGroupStatus.REJECTED).map(i => WorkItemApprovalService.getCommentsForWorkItemGroups(this.props.company.selectedCompany.Key, i.ID))])
                .then((responses) => {
                  const msgList = [];
                  responses.forEach((resMsg) => {
                    resMsg.data.forEach((temp) => {
                      msgList.push(temp);
                    });
                  });
                  this.setState({
                    messageList: [...msgList],
                    draftWorkItemGroups: [...res.data.Data],
                    isReady: true,
                    isRefreshing: false,
                    error: false,
                  });
                });
            }
          }
          else {
            this.setState({ isReady: true, error: true, isRefreshing: false, });
            // this.handleErrors('CLIENT_ERROR', null, i18n.t('HoursRejectionMessage.index.somethingWrong'));
          }
        })
        .catch((e) => {
          this.setState({ isReady: true, error: true, isRefreshing: false,  });
          // this.handleErrors(e.problem, null, i18n.t('HoursRejectionMessage.index.somethingWrong'));
        });
    }

    unlockWeek() {
      this.startAnimation();
      Promise.all([this.state.draftWorkItemGroups.map(i => WorkItemApprovalService.deleteWorkItemGroup(this.props.company.selectedCompany.Key, i.ID))])
        .then(() => {
          setTimeout(() => {
            this.startAnimation(true);
            this.props.navigation.state.params.successCallback ? this.props.navigation.state.params.successCallback() : null;
            this.props.navigation.goBack();
          }, 1200); // this timeout is set since it takes some time for api to update the related entities, So if we fetch data before that we'll have old data
        })
        .catch((e) => {
          this.startAnimation(true);
          this.handleErrors(e.problem, null, i18n.t('HoursRejectionMessage.index.enablingEditWeekFailed'));
        });
    }

    renderPlaceholder() {
      return (
        <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
          <Icon name="comment" size={45} color={theme.SCREEN_COLOR_LIGHT_GREY_1} style={styles.placeholderIcon} />
          <Text style={styles.placeholderText}>{i18n.t('HoursRejectionMessage.index.error')}</Text>
        </View>
      );
    }

    renderPlaceholderForEmptyMessages() {
      return (
          <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
            <Icon name="comment" size={45} color={theme.SCREEN_COLOR_LIGHT_GREY_1} style={styles.placeholderIcon}/>
            <Text style={styles.placeholderText}>{i18n.t('HoursRejectionMessage.index.noMessages')}</Text>
          </View>
      );
    }

    renderMessage({ item }) {
      return(
        <View style={styles.container}>
          <View style={styles.rowContainer}>
            <View style={styles.innerContainer}>
              <Text style={styles.displayNameText}>{decode(item.Author ? _.startCase(item.Author.DisplayName) : i18n.t('HoursRejectionMessage.index.approver'))}</Text>
              <Text style={styles.timestampLabel}><TimeAgo time={item.CreatedAt}/></Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.messageText}>{decode(item.Text ? _.capitalize(item.Text) : '...')}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    render() {
      return (
        <ViewWrapperAsync isReady={this.state.isReady} withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition="nav">
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
              <View style={styles.animatedPanelText}>
                <Text>{this.state.actionMessage}</Text>
              </View>
            </View>
          </Animated.View>
          {!this.state.error  ? (
            <View style={styles.weekContainer}>
              <Text style={styles.weekNo}>{this.state.weekNoLable}</Text>
            </View>
          ) : null}
          <FlatList
            data={!this.state.error ? this.state.messageList : []}
            renderItem={this.renderMessage}
            keyExtractor={e => `${e.ID}`}
            scrollEventThrottle={200}
            ListFooterComponent={<ListPaddingComponent height={80} />}
            onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            refreshControl={(
              <RefreshControl
                refreshing={this.state.isRefreshing}
                onRefresh={this.fetchWeekMessages}
                tintColor={theme.PRIMARY_COLOR}
              />
            )}
          />
          {this.state.error ? this.renderPlaceholder()
            : (
              <React.Fragment>
                {this.state.messageList.length > 0 ? null : this.renderPlaceholderForEmptyMessages()}
                {this.state.draftWorkItemGroups.length > 0 && !this.state.isViewOnly ? (
                  <FloatingBottomContainer height={55} ref={ref => this._floatingBottomContainer = ref}>
                    <GenericButton
                      text={i18n.t('HoursRejectionMessage.index.editHours')}
                      buttonStyle={styles.addButton}
                      textStyle={styles.addNewWorklogButtonText}
                      onPress={this.unlockWeek}
                    />
                  </FloatingBottomContainer>
                ) : null}
              </React.Fragment>
            )}
        </ViewWrapperAsync>
      );
    }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
  };
};

export default connect(
  mapStateToProps
)(HoursRejectionMessage);


const styles = StyleSheet.create({
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    width: WIDTH,
    height: HEIGHT,
    paddingTop: 0,
    position: 'absolute',
    zIndex: 10,
  },
  animatedPanel: {
    flexDirection: 'row',
    height: 59,
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
    alignItems: 'center',
    flexDirection: 'row'
  },
  animatedPanelText: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  addButton: {
    height: 35,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    width: 3 * (WIDTH / 4),
  },
  addNewWorklogButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  },
  weekNo: {
    color: '#0082C0',
    fontSize: 14,
    flex: 1,
    justifyContent: 'center'
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    alignSelf: 'center',
    opacity: 0.8,
  },
  placeholderText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
    width: WIDTH * 3 / 5
  },
  weekContainer: {
    paddingTop: 12,
    paddingLeft: 0,
    justifyContent:'center',
    alignItems: 'center',
    height: 40,
    // backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
  },
  timestampLabel: {
    fontSize: 12,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'right',
    flex: 1,
  },
  messageText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '300'
  },
  rowContainer: {
    flex: 1,
    margin: 15,
    minHeight: 100,
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
    borderRadius: 5,
  },
  displayNameText: {
    flex: 2,
    color: theme.SCREEN_COLOR_LIGHT_BLUE_1,
    fontSize: 14,
    fontWeight: '500',
  },
  innerContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  textContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 5,
  },
  container: {
    flex: 1,
  }
});
