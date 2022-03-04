export const incrementUnreadNotificationCount = () => {
  return { type: 'INCREMENT_NOTIFICATION_COUNTER_BY_ONE' };
};

export const decrementUnreadNotificationCount = () => {
  return { type: 'DECREMENT_NOTIFICATION_COUNTER_BY_ONE' };
};

export const setUnreadNotificationCount = ( count ) => {
  return { type: 'SET_NOTIFICATION_COUNTER', payload: count };
};

export const resetUnreadNotificationCount = () => {
  return { type: 'RESET_NOTIFICATION_COUNTER' };
};

export const updateUnreadNotificationCount = (companyKey) => {
  return { type: 'UPDATE_NOTIFICATION_COUNTER', payload: companyKey };
};