const initialState = {
    pendingApprovals: 0
};

function approvalReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_APPROVAL_COUNTER': {
            return { ...state, pendingApprovals: action.payload };
        }
        case 'RESET_APPROVAL_COUNTER': {
            return { ...state, pendingApprovals: 0 };
        }
        default:
            return state;
    }
}

export default approvalReducer;