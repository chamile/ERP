import React, { Component } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { connect } from 'react-redux';
import Icon from '../components/CustomIcon';

class IconWithApprovalBadge extends Component {
  render() {
    return (
      <View style={this.props.containerStyle ? this.props.containerStyle : styles.containerDefault} >
        {this.props.approval.pendingApprovals && this.props.approval.pendingApprovals > 0 ?
              (<View style={[this.props.badgeBackgroundStyle ? this.props.badgeBackgroundStyle : styles.badgeBackgroundDefault, this.props.approval.pendingApprovals > 9 ? styles.mediumContainer : {}, this.props.approval.pendingApprovals > 99 ? styles.largeConatiner : {}]}>
                <Text style={[this.props.badgeCountStyle ? this.props.badgeCountStyle : styles.badgeCountDefault , this.props.approval.pendingApprovals > 9 ? styles.badgeCountSmall : {}, this.props.approval.pendingApprovals > 99 ? styles.badgeCountVerySmall : {}]}>{this.props.approval.pendingApprovals > 99 ? '99+' : this.props.approval.pendingApprovals}</Text>
              </View>) : null
            }
        <View style={this.props.iconContainerStyle ? this.props.iconContainerStyle : styles.iconContainerDefault}>
          <Icon name={this.props.name} size={this.props.size} color={this.props.color} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  containerDefault: {
    height: 31
  },
  badgeBackgroundDefault: {
    width: 18,
    borderRadius: 50,
    zIndex: 10,
    height: 18,
    backgroundColor: '#FE3824',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -1,
    left: 12
  },
  badgeCountDefault: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  badgeCountSmall: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 12 : 10,
    fontWeight: '500'
  },
  badgeCountVerySmall: {
    backgroundColor: 'rgba(0,0,0,0)',
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 11 : 9,
    fontWeight: '500'
  },
  iconContainerDefault: {
    alignItems: 'center'
  },
  iconImageDefault: {
    width: 28,
    height: 28
  },
  mediumContainer: {
    width: Platform.OS === 'ios' ? 19 : 17,
    height: Platform.OS === 'ios' ? 19 : 17,
    left: Platform.OS === 'ios' ? 12 : 7,
  },
  largeConatiner: {
    width: Platform.OS === 'ios' ? 26 : 19,
    left: Platform.OS === 'ios' ? 12 : 4,
  }
});

function mapStateToProps(state) {
  return {
    approval: state.approval
  };
}

export default connect(
    mapStateToProps
)(IconWithApprovalBadge);