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
  Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Icon from '../../components/CustomIcon';
import moment from 'moment';
import _ from 'lodash';

import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import WorkItemApprovalService from '../../services/WorkItemApprovalService';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { TimesheetWorkflow } from '../../constants/TimesheetConstants';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import GenericButton from '../../components/GenericButton';

const WIDTH = Dimensions.get('window').width;

class SendForApprovalWorkItemSummary extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: `${i18n.t('SendForApprovalWorkItemSummary.index.week')} ${navigation.state.params.item && navigation.state.params.item.startDate ? moment(navigation.state.params.item.startDate).isoWeek() : moment().isoWeek()}`,
      headerRight: navigation.state.params && navigation.state.params.enableSendAction ? (
        <HeaderTextButton
          position="right"
          isActionComplete={navigation.state.params.isActionComplete}
          onPress={navigation.state.params.handleSend}
          text={i18n.t('SendForApprovalWorkItemSummary.index.send')}
        />
      ) : null,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      isReady: false,
      isSending: false,
      moveAnimation: new Animated.Value(0),
      weekNo: '',
      approver: '',
      invoice: '',
      overtime: '',
      expectedTime: 0,
      project: '',
      sum: 0,
      status: TimesheetWorkflow.NOTSET,
      weeklyBalance: 0,
      fromDate: moment(),
      toDate: moment(),
      workerRelationID: '',
    };

    this.sendForApproval = this.sendForApproval.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.navigateToWeekDetails = this.navigateToWeekDetails.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams(
      {
        isActionComplete: false,
        handleSend: this.handleSend,
      }
    );
  }

  componentDidMount() {
    const { item, workerRelationID } = this.props.navigation.state.params;
    if (item) {
      const sum = (item.status === TimesheetWorkflow.PARTIAL_ASSIGN || item.status === TimesheetWorkflow.PARTIAL_APPROVAL) ? item.pendingHours : _.sumBy(item.dataItems, ele => ele.ValidTime);
      this.setState({
        weekNo: item.weekNo ? item.weekNo : moment().isoWeek(),
        fromDate: item.startDate ? moment(item.startDate) : moment().startOf('isoWeek'),
        toDate: item.endDate ? moment(item.endDate) : moment().endOf('isoWeek'),
        status: item.status,
        sum,
        overtime: _.sumBy(item.dataItems, ele => ele.Overtime),
        expectedTime: _.sumBy(item.dataItems, ele => (ele.IsWeekend ? 0 : ele.ExpectedTime)),
        invoice: this.minValue(100, ((_.sumBy(item.dataItems, ele => ele.Invoicable) || 0) / (sum || 1)) * 100),
        project: this.minValue(100, ((_.sumBy(item.dataItems, ele => ele.Projecttime) || 0) / (sum || 1)) * 100),
        weeklyBalance: _.sumBy(item.dataItems, ele => ele.ValidTime) - _.sumBy(item.dataItems, ele => (ele.IsWeekend ? 0 : ele.ExpectedTime)),
        workerRelationID,
        isReady: true,
      });
    }
  }

  handleSendForApprovalErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SendForApprovalWorkItemSummary.index.somethingWrong')) {
    this.startAnimation(true);
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  minValue(v1, v2) {
    return v1 < v2 ? v1 : v2;
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

  handleSend() {
    if (!this.state.isSending) {
      this.props.navigation.setParams({ isActionComplete: true });
      this.startAnimation();
      this.setState({ isSending: true });
      this.sendForApproval(this.handleSend);
    } else {
      this.props.navigation.setParams({ isActionComplete: false });
    }
  }

  sendForApproval(caller) {
    WorkItemApprovalService.getDraftWorkItemGroups(this.props.company.selectedCompany.Key, this.state.workerRelationID, this.state.fromDate.format('YYYY-MM-DD'), this.state.toDate.format('YYYY-MM-DD'))
      .then((response) => {
        if (response.data && response.data.Data && response.data.Data.length  > 0) {
          Promise.all([...response.data.Data.map(item => WorkItemApprovalService.assignWorkItemGroup(this.props.company.selectedCompany.Key, item.ID))])
            .then(() => {
              this.setState({ isSending: false });
              this.startAnimation(true);
              this.props.navigation.state.params.refreshList ? this.props.navigation.state.params.refreshList() : null;
              this.props.navigation.goBack();
            })
            .catch((error) => {
              this.setState({ isSending: false });
              this.startAnimation(true);
              this.props.navigation.setParams({ isActionComplete: false });
              this.handleSendForApprovalErrors(error.problem, caller, i18n.t('SendForApprovalWorkItemSummary.index.assignError'));
            });
        }
        else {
          WorkItemApprovalService.createWorkItemGroup(this.props.company.selectedCompany.Key, this.state.workerRelationID, this.state.fromDate.format('YYYY-MM-DD'), this.state.toDate.format('YYYY-MM-DD'))
            .then((res) => {
              return WorkItemApprovalService.assignWorkItemGroup(this.props.company.selectedCompany.Key, res.data.ID);
            })
            .then(() => {
              this.setState({ isSending: false });
              this.startAnimation(true);
              this.props.navigation.state.params.refreshList ? this.props.navigation.state.params.refreshList() : null;
              this.props.navigation.goBack();
            }).catch((error) => {
              this.setState({ isSending: false });
              this.startAnimation(true);
              this.props.navigation.setParams({ isActionComplete: false });
              this.handleSendForApprovalErrors(error.problem, caller, `${i18n.t('SendForApprovalWorkItemSummary.index.assignError')} ${_.capitalize(error.data && error.data.Messages && error.data.Messages.length > 0 ? error.data.Messages[0].Message : '')}`);
            });
        }
      })
      .catch((error) => {
        this.setState({ isSending: false });
        this.startAnimation(true);
        this.props.navigation.setParams({ isActionComplete: false });
        this.handleSendForApprovalErrors(error.problem, caller, i18n.t('SendForApprovalWorkItemSummary.index.assignError'));
      });
  }

  navigateToWeekDetails() {
    this.props.navigation.replace('WorkItemGroupDetails', { selectedDate: this.state.fromDate, refreshList: (this.props.navigation.state.params.refreshList || null), workerRelationID: this.state.workerRelationID });
  }

  render() {
    return (
      <ViewWrapperAsync loaderPosition={'nav_tabs'} withFade={true} withMove={true} fromBackgroundStyle={styles.fromBackgroundStyle} toBackgroundStyle={styles.toBackgroundStyle} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} isReady={this.state.isReady}>
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
              style={styles.activityIndicator}
              size="small"
            />
          </View>
          <View style={styles.animatedPanelText}>
            <Text>{i18n.t('SendForApprovalWorkItemSummary.index.sendingForApproval')}</Text>
          </View>
        </Animated.View>

        <ScrollView ref={ref => this._scrollview = ref}  scrollEventThrottle={200} onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}>
          <Text style={styles.title}>{i18n.t('SendForApprovalWorkItemSummary.index.approvalSummary')}</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryView}>
              <View style={styles.leftContainer}>
                <Text style={styles.weekContainer}>{`${i18n.t('SendForApprovalWorkItemSummary.index.week')} ${this.state.weekNo}`}</Text>
                <Text style={styles.weekDateContainer}>
                  <Icon name="ios-calendar-outline" size={18} />
                  {` ${moment(this.state.fromDate).format('D MMM')} - ${moment(this.state.toDate).format('D MMM')}`}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <View style={styles.paddingBottom}>
                  <Text style={styles.infoText}>{i18n.t('SendForApprovalWorkItemSummary.index.sum')}</Text>
                  <Text style={[styles.infoVal, this.state.sum < this.state.expectedTime ? { color: theme.SCREEN_COLOR_LIGHT_RED } : {}]}>{new Intl.NumberFormat(i18n.language).format(this.state.sum)}</Text>
                </View>
                <View style={styles.paddingTop}>
                  <Text style={styles.infoText}>{i18n.t('SendForApprovalWorkItemSummary.index.weeklyBalance')}</Text>
                  <Text style={[styles.infoVal, this.state.weeklyBalance < 0 ? { color: theme.SCREEN_COLOR_LIGHT_RED } : {}]}>{new Intl.NumberFormat(i18n.language).format(this.state.weeklyBalance)}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.spacer} />
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('SendForApprovalWorkItemSummary.index.overtime')}
              placeHolder="―"
              value={`${this.state.overtime || '―'}`}
              editable={false}
            />
            <InlineValidationInputField
              title={`${i18n.t('SendForApprovalWorkItemSummary.index.project')} %`}
              placeHolder="―"
              value={`${this.state.project || '―'}`}
              editable={false}
            />
            <InlineValidationInputField
              title={`${i18n.t('SendForApprovalWorkItemSummary.index.invoice')} %`}
              placeHolder="―"
              value={`${this.state.invoice || '―'}`}
              editable={false}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
          <View style={styles.spacer} />

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>
        {!(this.props.navigation.state.params && this.props.navigation.state.params.enableSendAction) ? (
          <FloatingBottomContainer height={55} ref={ref => this._floatingBottomContainer = ref}>
            <GenericButton
              text={i18n.t('SendForApprovalWorkItemSummary.index.addMoreHours')}
              buttonStyle={styles.addButton}
              textStyle={styles.addNewWorklogButtonText}
              onPress={this.navigateToWeekDetails}
            />
          </FloatingBottomContainer>
        ) : null}
      </ViewWrapperAsync>
    );
  }
}


const mapStateToProps = (state) => {
  return {
    user: state.user,
    company: state.company,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendForApprovalWorkItemSummary);

const styles = StyleSheet.create({
  activityIndicator: { height: 80 },
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: theme.SYSTEM_COLOR_LIGHT_GRAY_2,
  },
  infoContainer: {
    justifyContent: 'space-around',
    backgroundColor: '#FFF'
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  infoRowTitle: {
    color: theme.PRIMARY_TEXT_COLOR,
    width: 90,
    fontWeight: '600',
  },
  infoRowText: {
    color: theme.SECONDARY_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextActive: {
    color: theme.PRIMARY_TEXT_COLOR,
    flex: 1,
  },
  infoRowTextInput: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 14,
    marginLeft: -2,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  spacer: {
    height: 15,
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
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
  iphoneXSpace: {
    height: 20,
  },
  summaryContainer: {
    paddingHorizontal: 15,
    backgroundColor: '#fff'
  },
  summaryView: {
    flex: 1,
    flexDirection: 'row',
    margin: 15
  },
  infoText: {
    textAlign: 'right',
    color: theme.SCREEN_COLOR_DARK_GREY,
  },
  infoVal: {
    textAlign: 'right',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 3,
  },
  weekContainer: {
    fontSize: 17,
    color: theme.PRIMARY_TEXT_COLOR,
    paddingBottom: 5,
    fontWeight: '600',
  },
  weekDateContainer: {
    fontSize: 17,
    color: theme.PRIMARY_TEXT_COLOR,
    paddingTop: 5,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    color: theme.SCREEN_COLOR_DARK_GREY,
    paddingVertical: 20,
    paddingHorizontal: 15,
    fontWeight: '500',
  },
  leftContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  paddingBottom: {
    paddingBottom: 5,
  },
  paddingTop: {
    paddingTop: 5,
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
});
