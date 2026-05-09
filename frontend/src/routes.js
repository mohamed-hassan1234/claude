export const LOGIN_PATH = '/galiadi';
export const ADMIN_BASE_PATH = '/waji';

export const adminPath = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_BASE_PATH}${normalizedPath === '/' ? '' : normalizedPath}`;
};
