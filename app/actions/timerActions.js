export const stopTimer = () => {
  return { type: 'STOP_TIMER' };
};

export const setCompaniesForTimer = (companies = []) => {
  return { type: 'SET_COMPANIES_FOR_TIMER', payload: companies };
};

export const clearCompaniesForTimer = () => {
  return { type: 'CLEAR_COMPANIES_FOR_TIMER' };
};

export const changeTimerInfo = (timeLog) => {
  return { type: 'UPDATE_CURRENT_TIMER_INFO', payload: timeLog };
};
