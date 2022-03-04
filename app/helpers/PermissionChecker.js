import { store } from '../App';

function hasUserPermissionType(permissionType) {
  const permissions = store.getState().company.permissions;
  return permissions ? permissions.length !== 0 ? permissions.includes(permissionType) : true : false;
}

export default {
  hasUserPermissionType
};
