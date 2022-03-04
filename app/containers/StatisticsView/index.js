// @flow
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import { LineChart, YAxis, Grid } from 'react-native-svg-charts'

import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import StatisticsService from '../../services/StatisticsService';
import WorkerService from '../../services/WorkerService';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const width = Dimensions.get('window').width;
const chartOptions = {
  showAreas: false,
  width: width / 2,
  height: 135,
  color: '#0076ff',
  margin: {
    top: 5,
    left: 30,
    bottom: 5,
    right: 5
  },
  animate: {
    type: 'delayed',
    duration: 200
  },
  axisX: {
    showAxis: true,
    showLines: false,
    showLabels: false,
    showTicks: false,
    zeroAxis: false,
    orient: 'bottom',
    label: {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: false,
      fill: 'rgba(100,100,100,0.6)'
    }
  },
  axisY: {
    showAxis: false,
    showLines: false,
    showLabels: true,
    showTicks: false,
    zeroAxis: false,
    orient: 'left',
    label: {
      fontFamily: 'Arial',
      fontSize: 10,
      fontWeight: false,
      fill: 'rgba(100,100,100,0.6)'
    }
  }
};

class StatisticsView extends Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('StatisticsView.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      flexBalence: 0,
      newData: []
    };

    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    const companyKey = this.props.company.selectedCompany.Key;
    WorkerService.getOrCreateWorkerFromUser(companyKey, this.props.user.activeUser.userId) // this is the userId of the logged in user
      .then(({ data }) => WorkerService.getWorkRelations(companyKey, data.ID))
      .then(workRelation => StatisticsService.fetchUserStatistics(companyKey, Array.isArray(workRelation.data) ? workRelation.data[0].ID : workRelation.data.ID))
      .then(({ data }) => {
        this.setState({
          isLoading: false,
          workRelation: data.WorkRelation,
          flexBalence: data.Minutes / 60,
          newData: this.getGraphData(data.Details)
        });
      })
      .catch((error) => {
        this.handleErrors(error.problem, this.fetchData, i18n.t(`StatisticsView.index.fetchStatsError`));
      });

  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t(`StatisticsView.index.errorFetch`)) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  getGraphData(data) {
    let _total = 0;
    const _data = data.map((x, index) => {
      _total += (x.WorkedMinutes - x.ExpectedMinutes) / 60;
      return _total;
    });
    return [..._data];
  }

  render() {
    const contentInset = { top: 20, bottom: 20 }
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <View style={styles.profileContainer}>
          <Text style={styles.mainText}>
            {this.state.workRelation ? this.state.workRelation.Description : i18n.t('StatisticsView.index.noTitle')}
          </Text>
          <Text style={styles.CompanyContainer}>
            <Text style={{ fontWeight: '700' }}>
              {this.state.workRelation ? this.state.workRelation.CompanyName : i18n.t('StatisticsView.index.noCompany')}
            </Text>
            {' ' + (this.state.workRelation ? this.state.workRelation.WorkPercentage : '0')}%
         </Text>
          <Text style={styles.dateContainer}>
            {i18n.t('StatisticsView.index.since')} {this.state.workRelation ? moment(this.state.workRelation.StartDate).format('MMM YYYY') : ''}
          </Text>
        </View>

        <View style={styles.graphContainer}>
          {/* <SmoothLine data={this.state.data} options={chartOptions} xKey="x" yKey="y" /> */}
          {/* <AreaChart
                style={{ flex:1}}
                data={[50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80]}
                contentInset={{ top: 30, bottom: 30 }}
                curve={shape.curveNatural}
                svg={{ fill: 'rgba(134, 65, 244, 0.8)' }}
            >
                <Grid />
            </AreaChart> */}

          <YAxis
            data={this.state.newData}
            contentInset={contentInset}
            svg={{
              fill: 'grey',
              fontSize: 10,
            }}
            numberOfTicks={10}
            formatLabel={(value) => `${value}`}
          />
          <LineChart
            style={{ flex: 1 }}
            data={this.state.newData}
            svg={{ stroke: 'rgb(134, 65, 244)' }}
            contentInset={{ top: 20, bottom: 20 }}
          >
            <Grid />
          </LineChart>

          <View style={styles.hoursContainer}>
            <Text><Text style={styles.mainText}>{this.state.flexBalence.toFixed(0)}</Text><Text> {i18n.t('StatisticsView.index.hours')}</Text></Text>
          </View>
        </View>
        {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
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
    // completeOnboarding: () => dispatch(completeOnboarding()),
    // resetToCompanySelect: () => dispatch(resetToCompanySelect())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatisticsView);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 64
  },
  tabContainer: {
    height: 45,
    borderBottomColor: 'rgba(100,100,100,0.2)',
    borderBottomWidth: 1,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 15,
    paddingRight: 15,
  },
  tabs: {
    flex: 1,
    borderColor: '#0076ff',
    borderWidth: 1,
    borderRadius: 5,
    flexDirection: 'row'
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  flexContainer: {
    height: 100,
    borderBottomColor: 'rgba(100,100,100,0.2)',
    borderBottomWidth: 1,
    flexDirection: 'row'
  },
  flexCol: {
    padding: 18,
    borderRightColor: 'rgba(100,100,100,0.3)',
    borderRightWidth: 1
  },
  title: {
    fontSize: 15,
    marginBottom: 10
  },
  mainText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1496D5'
  },
  profileContainer: {
    borderBottomColor: 'rgba(100,100,100,0.2)',
    borderBottomWidth: 1,
    borderTopColor: 'rgba(100,100,100,0.2)',
    borderTopWidth: 1,
    marginTop: 1,
    padding: 18
  },
  graphContainer: {
    height: 170,
    borderBottomColor: 'rgba(100,100,100,0.2)',
    borderBottomWidth: 1,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  companyContainer: {
    fontSize: 15,
    marginTop: 15
  },
  dateContainer: {
    fontSize: 15,
    marginTop: 10,
    marginBottom: 5
  },
  hoursContainer: {
    paddingLeft: 5,
    justifyContent: 'center'
  },
  iphoneXSpace: {
    height: 50,
  }
});
