import NotificationService from '../services/NotificationService';

const initialState = {
  unreadCount:0
};

function notificationReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_NOTIFICATION_COUNTER': {
      NotificationService.setApplicationBadgeCount(action.payload);
      return { ...state, unreadCount: action.payload };
    }
    case 'INCREMENT_NOTIFICATION_COUNTER_BY_ONE': {
      NotificationService.setApplicationBadgeCount(state.unreadCount + 1);
      return { ...state, unreadCount: state.unreadCount + 1 };
    }
    case 'DECREMENT_NOTIFICATION_COUNTER_BY_ONE': {
      NotificationService.setApplicationBadgeCount(state.unreadCount - 1);
      return { ...state, unreadCount: state.unreadCount - 1 };
    }
    case 'RESET_NOTIFICATION_COUNTER': {
      NotificationService.setApplicationBadgeCount(0);
      return { ...state, unreadCount: 0 };
    }
    default:
      return state;
  }
}

export default notificationReducer;
