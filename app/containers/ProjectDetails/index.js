// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { connect } from 'react-redux';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import AngleHeader from '../../components/AngleHeader';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import { getHeaderStyle } from '../../helpers/UIHelper';
import StatusFlow from '../../components/StatusFlow';
import i18n from '../../i18n/i18nConfig';
import GenericButton from '../../components/GenericButton';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { ProjectStatusCodes } from '../../constants/ProjectConstants';
import ProjectService from '../../services/ProjectService';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;

class ProjectDetails extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('ProjectDetails.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      hasError: false,
      moveAnimation: new Animated.Value(0),
      projectDetails: {
        Name: '',
        ProjectLeadName: '',
        Description: '',
        ProjectNumber: '',
        ID: '',
        StatusCode: ''
      },
      flowDepth: 0,
      flowEntities: this.getInitialFlowEntities(),
    };

    this.fetchData = this.fetchData.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    this.setState({ isLoading: true });
    this.fetchInvoiceData(this.fetchData);
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.fetchInvoiceData(this.refreshData);
  }

  fetchInvoiceData(caller) {
    const { projectID } = this.props.navigation.state.params;
    ProjectService.getProjectDetails(this.props.company.selectedCompany.Key, projectID)
      .then((response) => {
        this.setState({
          projectDetails: { ...response.data },
          isLoading: false,
          isRefreshing: false,
          hasError: false,
        }, () => {
          this.processStatus(response.data.StatusCode);
        });
      })
      .catch((error) => {
        this.setState({ isLoading: false, isRefreshing: false, hasError: true });
        this.handleCompanyFetchErrors(error.problem, caller, i18n.t('ProjectDetails.index.fetchProjectDetailsError'));
      });
  }

  handleCompanyFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ProjectDetails.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false, hasError: true });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  processStatus(status) {
    let flowDepth = 0;
    const flowEntities = this.state.flowEntities;
    let statusDescription = '';
    switch (status) {
      case ProjectStatusCodes.REGISTERED: {
        flowDepth = 0;
        statusDescription = i18n.t('ProjectDetails.index.registered');
        flowEntities[flowDepth] = i18n.t('ProjectDetails.index.registered');
        break;
      }
      case ProjectStatusCodes.OFFERES_PHASE: {
        flowDepth = 1;
        statusDescription = i18n.t('ProjectDetails.index.offeresPhase');
        flowEntities.includes(i18n.t('ProjectDetails.index.offeresPhase')) ? null : flowEntities.splice(flowDepth, 0, i18n.t('ProjectDetails.index.offeresPhase'));
        break;
      }
      case ProjectStatusCodes.ONGOING: {
        flowDepth = 1;
        statusDescription = i18n.t('ProjectDetails.index.ongoing');
        flowEntities[flowDepth] = i18n.t('ProjectDetails.index.ongoing');
        break;
      }
      case ProjectStatusCodes.COMPLETED: {
        flowDepth = 2;
        statusDescription = i18n.t('ProjectDetails.index.completed');
        flowEntities[flowDepth] = i18n.t('ProjectDetails.index.completed');
        break;
      }
      case ProjectStatusCodes.FILED: {
        flowDepth = 3;
        statusDescription = i18n.t('ProjectDetails.index.filed');
        flowEntities.includes(i18n.t('ProjectDetails.index.filed')) ? null : flowEntities.splice(flowDepth, 0, i18n.t('ProjectDetails.index.filed'));
        break;
      }
    }
    this.setState({
      flowDepth, flowEntities, projectDetails: { ...this.state.projectDetails, statusDescription }, isLoading: false, isRefreshing: false,
    });
  }

  getInitialFlowEntities() {
    const flowEntities = [];
    flowEntities.push(i18n.t('ProjectDetails.index.registered'));
    flowEntities.push(i18n.t('ProjectDetails.index.ongoing'));
    flowEntities.push(i18n.t('ProjectDetails.index.completed'));
    return flowEntities;
  }

  handleEditClick() {
    this.props.navigation.navigate('AddNewProject', { isEdit: true, projectData: this.state.projectDetails, refreshData: this.refreshData });
  }

  _getItemStatus(status) {
    switch (status) {
      case ProjectStatusCodes.REGISTERED:
        return i18n.t('ProjectDetails.index.registered');
      case ProjectStatusCodes.ONGOING:
        return i18n.t('ProjectDetails.index.ongoing');
      case ProjectStatusCodes.COMPLETED:
        return i18n.t('ProjectDetails.index.completed');
      case ProjectStatusCodes.OFFERES_PHASE:
        return i18n.t('ProjectDetails.index.offeresPhase');
      case ProjectStatusCodes.FILED:
        return i18n.t('ProjectDetails.index.filed');
    }
  }

  startAnimation(reverse = false) {
    Animated.timing(
      this.state.moveAnimation,
      {
        toValue: reverse ? 0 : 1,
        duration: 250,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      },
    ).start();
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/noInvoiceImageIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('ProjectDetails.index.noProjectDetails')}</Text>
      </View>
    );
  }


  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
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
            <Text>{`${this.state.actionDescription} ...`}</Text>
          </View>
        </Animated.View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshData}
            />
          }
          scrollEventThrottle={200}
          onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
        >
          {!this.state.hasError ?
            <View style={styles.mainView}>
              <View style={styles.topInfoBar}>
                <View style={styles.topInfoContainer}>
                  <Text style={styles.topInfoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{this.state.projectDetails.Name ? this.state.projectDetails.Name : i18n.t('ProjectDetails.index.notSpecified')}</Text>
                  <Text style={styles.topInfoText}>{i18n.t('ProjectDetails.index.projectNo')}:  {this.state.projectDetails.ProjectNumber ? this.state.projectDetails.ProjectNumber : i18n.t('ProjectDetails.index.notSpecified')}</Text>
                  <Text style={styles.topInfoTextSub}>{i18n.t('ProjectDetails.index.projectLeadName')}: {this.state.projectDetails.ProjectLeadName || i18n.t('ProjectDetails.index.notSpecified')}</Text>
                </View>
              </View>

              <View style={styles.statusFlowContainer}>
                <StatusFlow
                  entities={this.state.flowEntities}
                  isTouchable={false}
                  flowDepth={this.state.flowDepth}
                  statusFlowHeight={20}
                  borderRadius={5}
                />
              </View>

              <View style={styles.spacer} />

              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoTitle}>{i18n.t('ProjectDetails.index.name')}</Text>
                  <Text style={styles.infoText}>{this.state.projectDetails.Name || i18n.t('ProjectDetails.index.notSpecified')}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoTitle}>{i18n.t('ProjectDetails.index.projectNumber')}</Text>
                  <Text style={styles.infoText}>{this.state.projectDetails.ProjectNumber || i18n.t('ProjectDetails.index.notSpecified')}</Text>
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoTitle}>{i18n.t('ProjectDetails.index.projectLead')}</Text>
                  <Text style={styles.infoText}>{this.state.projectDetails.ProjectLeadName || i18n.t('ProjectDetails.index.notSpecified')}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoTitle}>{i18n.t('ProjectDetails.index.status')}</Text>
                  <Text style={styles.infoText}>{this._getItemStatus(this.state.projectDetails.StatusCode)}</Text>
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoTitle}>{i18n.t('ProjectDetails.index.description')}</Text>
                  <Text style={styles.infoText}>{this.state.projectDetails.Description || i18n.t('ProjectDetails.index.notSpecified')}</Text>
                </View>
              </View>
            </View>
            : null}
          <View style={styles.spacerBottom} />
        </ScrollView>
        {this.state.hasError ? this.renderPlaceholder() : null}

        <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
          <GenericButton text={i18n.t('ProjectDetails.index.edit')} textStyle={styles.editButtonText} buttonStyle={styles.editButtonAlone} onPress={() => this.handleEditClick()} />
        </FloatingBottomContainer>

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

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProjectDetails);

const styles = StyleSheet.create({
  mainView: {
    paddingHorizontal: 5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-around',
    paddingRight: 5,
  },
  infoTitle: {
    color: theme.PRIMARY_COLOR,
    marginBottom: 3,
    fontSize: 12,
  },
  infoText: {
    color: theme.PRIMARY_TEXT_COLOR,
  },
  spacerTop: {
    height: 30,
  },
  spacer: {
    height: 20,
  },
  spacerBottom: {
    height: 50,
  },
  topInfoBar: {
    height: 100,
    marginTop: 20,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  topInfoContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topInfoRight: {
    width: 100,
    backgroundColor: 'rgba(200,200,200,0.1)',
    padding: 5,
  },
  topInfoTextMain: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '500',
    fontSize: 15,
  },
  topInfoText: {
    color: theme.PRIMARY_TEXT_COLOR,
  },
  topInfoTextSub: {
    color: theme.SECONDARY_TEXT_COLOR,
  },
  topInfoThumbnail: {
    width: 90,
    height: 90,
  },
  timestampText: {
    color: theme.SECONDARY_TEXT_COLOR,
    marginTop: -8,
    marginBottom: 10,
    fontSize: 12,
  },
  imageStyle: {
    width: 28,
    height: 28,
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
    height: 80,
    width: 80,
    opacity: 0.8,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  statusFlowContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: theme.SECONDARY_BACKGROUND_COLOR,
    justifyContent: 'space-around',
    paddingRight: 6,
    alignItems: 'center',
  },
  editButtonAlone: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    height: 35,
    width: 3 * (WIDTH / 4),
    borderRadius: 5,
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
    alignItems: 'flex-end',
  },
  animatedPanelText: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  editButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  }
});
