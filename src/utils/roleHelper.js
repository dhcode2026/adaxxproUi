
export const getUserRoles = () => {
  const rolesStr = localStorage.getItem("roles");
  return (rolesStr!="undefined" &&  rolesStr!=null && rolesStr!= "")  ? JSON.parse(rolesStr) : [];
};

export const isSuperAdmin = () => {
  return true;
};

export const isReadOnly = () => {
  return true;
};

export const isReadWrite = () => {
  return true;
};

export const canCreateItems = () => {
  return !isReadOnly();
};

export const hasWritePermission = () => {
  return true;
};
