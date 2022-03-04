// @flow
import React, { Component } from 'react';
import {
  View,
  RefreshControl,
  FlatList,
  Image,
  Text,
  Dimensions,
  StyleSheet,
  Platform,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import ProjectService from '../../services/ProjectService';
import { DrawerIcon } from '../../components/DrawerIcon';
import { SearchIcon } from '../../components/SearchIcon';
import AngleHeader from '../../components/AngleHeader';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { ProjectListRow } from './projectListRow';
import GenericButton from '../../components/GenericButton';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle } from '../../helpers/UIHelper';
import FloatingBottomContainer from '../../components/FloatingBottomContainer';
import { EntityType } from '../../constants/EntityTypes';
import PermissionChecker from '../../helpers/PermissionChecker';
import { PermissionType } from '../../constants/PermissionTypes';

const HEIGHT: number = Dimensions.get('window').height;
const WIDTH: number = Dimensions.get('window').width;
class ProjectList extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('ProjectList.index.title'),
      headerLeft: <DrawerIcon />,
      // for easier implementation of search feature this code is kept commented
      // headerRight: <SearchIcon
      //   navigate={navigation.navigate}
      //   data={
      //   {
      //     title: i18n.t('ProductList.index.searchProducts'),
      //     entityType: EntityType.PRODUCT,
      //     placeholder: i18n.t('OrderDetails.index.searchProductByIdOrName'),
      //     showInstantResults: true,
      //   }
      //   }
      //   disabled={navigation.state.params ? navigation.state.params.isActionButtonDisabled : false}
      // />,
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: getHeaderStyle(),
      header: props => <AngleHeader {...props} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isRefreshing: false,
      projects: [],
      pageSize: 20,
      hasNextPage: false,
      hasPermissionToModule: PermissionChecker.hasUserPermissionType(PermissionType.UI_ADMIN) || PermissionChecker.hasUserPermissionType(PermissionType.UI_ACCOUNTING), //check if user has permissions to view this module
    };

    this.renderPlaceholder = this.renderPlaceholder.bind(this);
    this.refreshProjects = this.refreshProjects.bind(this);
    this.onProjectSelect = this.onProjectSelect.bind(this);
    this.fetchInitialProjects = this.fetchInitialProjects.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  componentDidMount() {
    this.state.hasPermissionToModule ? this.fetchInitialProjects() : this.handleNoPermission();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.projectList.lastEditedTime != newProps.projectList.lastEditedTime) {
      this.refreshProjects();
    }
  }

  handleNoPermission() {
    this.setState({ isLoading: false }, () => {
      InteractionManager.runAfterInteractions(() => {
        this.props.navigation.setParams({
          isActionButtonDisabled: true,
        });
      });
    });
  }

  onProjectSelect(project) {
    const _onProjectSelect = () => {
      this.props.navigation.navigate('ProjectDetails', {
        projectID: project.ID,
        EntityType: EntityType.PROJECT,
        CompanyKey: this.props.company.selectedCompany.Key
      });
    };
    Platform.OS === 'ios' ? _onProjectSelect() : setTimeout(_onProjectSelect, 25);
  }

  onEndReached() {
    if (this.state.hasNextPage) {
      this.fetchNextPage(this.onEndReached);
    }
  }

  fetchInitialProjects() {
    this.setState({ isLoading: true });
    this.fetchProjects(this.fetchInitialProjects);
  }

  fetchProjects(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    ProjectService.getProjects(companyKey, 0, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, projects: response.data, hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleProductFetchErrors(response.problem, caller, i18n.t('ProjectList.index.fetchProjectError'));
        }
      })
      .catch((error) => {
        this.handleProductFetchErrors(error.problem, caller, i18n.t('ProjectList.index.fetchProjectError'));
      });
  }

  fetchNextPage(caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    ProjectService.getProjects(companyKey, this.state.projects.length, this.state.pageSize)
      .then((response) => {
        if (response.ok) {
          this.setState({ isLoading: false, isRefreshing: false, products: [...this.state.products, ...response.data], hasNextPage: (response.data.length === this.state.pageSize) });
        } else {
          this.handleProductFetchErrors(response.problem, caller, i18n.t('ProjectList.index.fetchProjectError'));
        }
      })
      .catch((error) => {
        this.handleProductFetchErrors(error.problem, caller, i18n.t('ProjectList.index.fetchProjectError'));
      });
  }

  handleProductFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('ProjectList.index.somethingWrong')) {
    this.setState({ isLoading: false, isRefreshing: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  refreshProjects() {
    this.setState({ isRefreshing: true });
    this.fetchProjects(this.refreshProjects);
  }

  renderPlaceholder() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/Sales/noOrdersIcon.png')} />
        <Text style={styles.placeholderText}>{i18n.t('ProjectList.index.noProjects')}</Text>
      </View>
    );
  }

  renderPlaceholderWithNoPermission() {
    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Icon name="ios-lock" size={50} color={theme.SECONDARY_TEXT_COLOR} style={{ opacity: 0.8 }} />
        <Text style={styles.placeholderNoAccessText}>{i18n.t('ProjectList.index.noAccessToProjects')}</Text>
      </View>
    );
  }

  renderFooter() {
    if (this.state.hasNextPage) {
      return (
        <View style={styles.footerLoaderBox}>
          <ActivityIndicator
            animating={true}
            color="#0082C0"
            size="small"
          />
        </View>
      );
    }
    else {
      return (
        <ListPaddingComponent height={80} />
      );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.PRIMARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        {this.state.hasPermissionToModule ?
          <View style={styles.container}>
            <FlatList
              keyExtractor={(item, index) => item.ID}
              data={this.state.projects}
              renderItem={props => <ProjectListRow {...props} onSelect={this.onProjectSelect} />}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isRefreshing}
                  onRefresh={this.refreshProjects}
                  tintColor={theme.PRIMARY_COLOR}
                />
              }
              ListHeaderComponent={() => <ListPaddingComponent height={20} />}
              ListFooterComponent={this.renderFooter}
              onEndReached={this.onEndReached}
              onEndReachedThreshold={0.3}
              scrollEventThrottle={200}
              onScroll={this._floatingBottomContainer ? this._floatingBottomContainer.scrollHandler : null}
            />

            {!this.state.isLoading && this.state.projects.length === 0 ? this.renderPlaceholder() : null}
            <FloatingBottomContainer ref={ref => this._floatingBottomContainer = ref}>
              <GenericButton text={i18n.t('ProjectList.index.addNewProject')} buttonStyle={styles.addProjectButton} onPress={() => this.props.navigation.navigate('AddNewProject', { isEditMode: false, CompanyKey: this.props.company.selectedCompany.Key })} />
            </FloatingBottomContainer>
          </View>
          : this.renderPlaceholderWithNoPermission()}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    projectList: state.projectList,
    company: state.company,
  };
};

export default connect(
  mapStateToProps,
)(ProjectList);

const styles = StyleSheet.create({
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
    opacity: 0.6,
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  placeholderNoAccessText: {
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23,
  },
  tabIconStyle: {
    width: 28,
    height: 28,
  },
  addProjectButton: {
    height: 35,
    width: 3 * (WIDTH / 4),
    backgroundColor: theme.PRIMARY_COLOR,
    borderRadius: 5,
  },
  container: {
    flex: 1,
  },
  footerLoaderBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
