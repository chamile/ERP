export const setPendingApprovalCount = ( count ) => {
  return { type: 'SET_APPROVAL_COUNTER', payload: count };
};

export const resetPendingApprovalCount = () => {
  return { type: 'RESER_APPROVAL_COUNTER' };
};

export const updatePendingApprovalCount = ( companyKey ) => {
  return { type: 'UPDATE_APPROVAL_COUNTER', payload: companyKey };
};