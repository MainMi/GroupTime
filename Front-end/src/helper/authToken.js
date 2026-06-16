import Cookies from 'universal-cookie';

// Single shared cookie jar so token access is consistent across the app
// (slices, actions and api wrappers previously each created their own).
const cookies = new Cookies();

export const getAccessToken = () => cookies.get('Access');
export const getRefreshToken = () => cookies.get('Refresh');

export const setAuthTokens = ({ access, refresh }) => {
    if (access) cookies.set('Access', access, { path: '/' });
    if (refresh) cookies.set('Refresh', refresh, { path: '/' });
};

export const clearAuthTokens = () => {
    cookies.remove('Access');
    cookies.remove('Refresh');
};

const authToken = { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens };

export default authToken;
