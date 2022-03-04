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
  Keyboard,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import { NavigationActions, StackActions } from 'react-navigation';
import Analytics from 'appcenter-analytics';

import { theme } from '../../styles';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import GenericButton from '../../components/GenericButton';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ViewWrapper from '../../components/ViewWrapper';
import ProjectService from '../../services/ProjectService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

class AddNewProject extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.isViewOnly ? i18n.t('AddNewProject.index.title')
        : (navigation.state.params.isEdit ? i18n.t('AddNewProject.index.editTitle') : i18n.t('AddNewProject.index.title')),
      headerRight: navigation.state.params.isViewOnly ? <HeaderTextButton /> :
      <HeaderTextButton
        position={'right'}
        isActionComplete={navigation.state.params.isActionComplete}
        onPress={navigation.state.params.handleCreation}
        text={navigation.state.params.isEdit
            ? i18n.t('AddNewProject.index.save')
            : i18n.t('AddNewProject.index.create')}
      />,
      headerLeft: <HeaderTextButton
        navigate={navigation.navigate}
        onPress={() => navigation.goBack()}
        text={i18n.t('AddNewProject.index.cancel')}
        position="left"
        isActionComplete={navigation.state.params.isActionComplete}
      />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      isUploading: false,
      moveAnimation: new Animated.Value(0),
      projectDetails: {
        name: '',
        description: '',
        projectLead: '',
        projectNumber: ''
      },
      errors: {
        name: null,
        description: null,
        projectLead: null,
        projectNumber: null
      }
    };

    this.projectID = 0;
    this.isActionComplete = false;
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.createProject = this.createProject.bind(this);
    this.handleCreation = this.handleCreation.bind(this);
    this.clearChanges = this.clearChanges.bind(this);
  }

  componentWillMount() {
    this.props.navigation.setParams(
      {
        isActionComplete: this.isActionComplete,
        handleCreation: this.handleCreation
      }
    );
  }

  componentDidMount() {
    if (this.props.navigation.state.params.isEdit || this.props.navigation.state.params.isViewOnly) {
      const { projectData } = this.props.navigation.state.params;
      this.setState({
        projectDetails: {
          name: projectData.Name,
          description: projectData.Description,
          projectNumber: projectData.ProjectNumber,
          projectLead: projectData.ProjectLeadName
        }
      });
    }
  }

  handleCreateProjectErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewProject.index.somethingWrong')) {
    this.setState({ isUploading: false });
    this.startAnimation(true);
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
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

  handleCreation() {
    Keyboard.dismiss();
    if (!this.state.isUploading && this.isValid()) {
      this.isActionComplete = true;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.startAnimation();
      this.setState({ isUploading: true });
      this.createProject(this.handleCreation);
    } else {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    }
  }

  clearChanges() {
    if (this.props.navigation.state.params.isEdit) {
      const { projectData } = this.props.navigation.state.params;
      this.setState({
        projectDetails: {
          name: projectData.Name,
          description: projectData.Description,
          projectNumber: projectData.ProjectNumber,
          projectLead: projectData.ProjectLeadName
        },
        errors: {
          name: null,
          description: null,
          projectNumber: null,
          projectLead: null,
        }
      });
    } else {
      this.setState({
        projectDetails: {
          name: '',
          description: '',
          projectNumber: '',
          projectLead: '',
        },
        errors: {
          name: null,
          description: null,
          projectNumber: null,
          projectLead: null,
        }
      });
    }
  }

  async createProject(caller) {
    try {
      const project = {
        Name: this.state.projectDetails.name,
        Description: this.state.projectDetails.description,
        ProjectLeadName: this.state.projectDetails.projectLead,
        ProjectNumber: this.state.projectDetails.projectNumber,
      };

      if (this.props.navigation.state.params.isEdit) {
        const projectData = this.props.navigation.state.params.projectData;
        project.ID = projectData.ID;
        await ProjectService.editProject(this.props.company.selectedCompany.Key, projectData.ID, project);
        Analytics.trackEvent(AnalyticalEventNames.EDIT, { entity: 'Project' });
      } else {
        const projectResponse = await ProjectService.createProject(this.props.company.selectedCompany.Key, project);
        this.projectID = projectResponse.data.ID;
        Analytics.trackEvent(AnalyticalEventNames.CREATE, { entity: 'Project' });
      }
      if (this.props.navigation.state.params.refreshData) {
        this.props.navigation.goBack();
        this.props.navigation.state.params.refreshData();
      } else {
        this.props.resetToProjectDetails({
          projectID: this.projectID,
          EntityType: 'project',
          CompanyKey: this.props.company.selectedCompany.Key,
        });
      }
      this.props.updateProjectList();
      this.startAnimation(true);
    } catch (error) {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      this.handleCreateProjectErrors(error.problem, caller, this.props.navigation.state.params.isEdit
        ? i18n.t('AddNewProject.index.saveProjectError')
        : i18n.t('AddNewProject.index.createProjectError'));
    }
  }

  isValid() {
    const errors = {};
    if (!this.state.projectDetails.name) {
      errors.name = i18n.t('AddNewProject.index.nameError');
    }
    this.setState({ errors: { ...this.state.errors, ...errors } });
    return Object.keys(errors).length === 0;
  }

  scrollToBottom() {
    setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
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
              style={styles.activityIndicator}
              size="small"
            />
          </View>
          <View style={styles.animatedPanelText}>
            <Text>{this.props.navigation.state.params.isEdit
              ? i18n.t('AddNewProject.index.savingProject')
              : i18n.t('AddNewProject.index.creatingProject')}</Text>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.infoContainer}>
            <InlineValidationInputField
              title={i18n.t('AddNewProject.index.projectNumber')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewProject.index.notSpecified') : i18n.t('AddNewProject.index.autoGenerateMsg')}
              onChangeText={text => this.setState({ projectDetails: { ...this.state.projectDetails, projectNumber: text }, errors: { ...this.state.errors, projectNumber: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.projectDetails.projectNumber}
              error={this.state.errors.projectNumber}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewProject.index.name')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewProject.index.notSpecified') : i18n.t('AddNewProject.index.enterName')}
              onChangeText={text => this.setState({ projectDetails: { ...this.state.projectDetails, name: text }, errors: { ...this.state.errors, name: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.projectDetails.name}
              error={this.state.errors.name}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewProject.index.projectLead')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewProject.index.notSpecified') : i18n.t('AddNewProject.index.enterName')}
              onChangeText={text => this.setState({ projectDetails: { ...this.state.projectDetails, projectLead: text }, errors: { ...this.state.errors, projectLead: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.projectDetails.projectLead}
              error={this.state.errors.projectLead}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <InlineValidationInputField
              title={i18n.t('AddNewProject.index.description')}
              placeHolder={this.props.navigation.state.params.isViewOnly ? i18n.t('AddNewProject.index.notSpecified') : i18n.t('AddNewProject.index.description')}
              onChangeText={text => this.setState({ projectDetails: { ...this.state.projectDetails, description: text }, errors: { ...this.state.errors, description: null } })}
              isKeyboardInput={true}
              onFocus={this.scrollToBottom}
              value={this.state.projectDetails.description}
              error={this.state.errors.description}
              editable={!this.props.navigation.state.params.isViewOnly}
            />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <View style={styles.buttonContainer} >
              {this.props.navigation.state.params.isViewOnly ? null :
              <GenericButton
                text={i18n.t('AddNewProject.index.clearChanges')}
                textStyle={styles.clearButtonText}
                buttonStyle={styles.clearButton}
                onPress={this.clearChanges}
              />}
            </View>
          </View>

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>
      </ViewWrapper>
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
  return {
    resetToProjectDetails: projectParams =>
      dispatch(StackActions.reset({
        index: 1,
        key: undefined,
        actions: [
          NavigationActions.navigate({ routeName: 'ProjectList' }),
          NavigationActions.navigate({ routeName: 'ProjectDetails', params: { ...projectParams } })
        ]
      })),
    updateProjectList: () => dispatch({ type: 'UPDATE_PROJECTS_LAST_EDITED_TIMESTAMP' }),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewProject);

const styles = StyleSheet.create({
  inputTitleStyle: {
    color: theme.PRIMARY_TEXT_COLOR,
    width: 90,
    fontSize: 16,
    fontWeight: 'normal',
  },
  activityIndicator: { height: 80 },
  inputPlaceholderStyle: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  fromBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  toBackgroundStyle: {
    backgroundColor: '#FFF',
  },
  clearButton: {
    height: 30,
    flex: 1,
    width: 170,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.PRIMARY_COLOR,
    marginLeft: 15,
    marginRight: 15,
  },
  clearButtonText: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '400',
  },
  invoiceImage: {
    height: 400,
  },
  infoRow: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowTitleContainer: {
    width: 90,
  },
  infoRowControlContainer: {
    flex: 1,
  },
  infoRowContainer: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  infoContainer: {
    justifyContent: 'space-around',
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
});
