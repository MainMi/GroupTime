import { authAction } from '../slices/auth-slice';
import urlEnum from '../../constants/urlEnum';
import { getFetchDispatch } from '../../api/apiFetch';
import { getAccessToken, getRefreshToken, setAuthTokens } from '../../helper/authToken';
import { showErrorNotification, showInfoNotification } from './notification-actions';
import { notifyError } from '../../helper/notify';
import { ERROR_CODES } from '../../constants/httpStatus';
import i18n from '../../i18n';

const refreshAuthToken = async (headers) => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(urlEnum.refresh, {
            method: 'GET',
            headers: { ...headers, 'Authorization': refreshToken },
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.errorStatus) return null;

        const { access_token, refresh_token } = data.tokenPair;
        setAuthTokens({ access: access_token, refresh: refresh_token });

        return data;
    } catch (error) {
        console.error('Failed to refresh auth token:', error);
        return null;
    }
};

export const fetchAuthDispatch = (responseFn, navigate, responseArgm = {}) =>
    async (dispatch, getState) => {
        const authToken = getAccessToken();
        const reduxAuthToken = getState().auth.userToken;
        if (!authToken || !authToken.length) {
            navigate('/sign');
            return;
        }

        if (reduxAuthToken) {
            dispatch(authAction.updateAuth({ userToken: authToken }));
        }

        try {

            let { url = urlEnum.userInfo, method = 'POST', body = null } = responseArgm;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': authToken
            };

            const parameters = { url, method, headers, body };

            await dispatch(getFetchDispatch(parameters, navigate, async (data) => {
                
                const isUnauthorized = data.errorStatus === ERROR_CODES.EMAIL_NOT_CONFIRMED || data.errorStatus === ERROR_CODES.TOKEN_EXPIRED;

                if (isUnauthorized) {
                    const refreshedData = await refreshAuthToken(headers);
                    if (!refreshedData) {
                        dispatch(authAction.logOutAuth());
                        navigate('/sign');
                        return;
                    }
                    const { access_token } = refreshedData.tokenPair;
                    dispatch(authAction.updateAuth({ userToken: access_token }))
                    const newParameters = { url, method, headers: { ...headers, 'Authorization': access_token }, body };
                    dispatch(getFetchDispatch(newParameters, navigate, responseFn));
                } else {
                    if (data.status >= 400 && data.status < 600) {
                        console.error(data)
                        return;
                    }
                    responseFn(data, navigate, dispatch);
                }
            }));
        } catch (e) {
            console.error(e);
        }
    };

export async function fetchAuth(responseArgm = {}, navigate) {
    const authToken = getAccessToken();
    if (!authToken || !authToken.length) {
        navigate('/sign');
        return;
    }

    let { url = urlEnum.userInfo, method = 'POST', body = null } = responseArgm;
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': authToken
    };

    let parameters = { method, headers };

    if (body) {
        parameters.body = JSON.stringify(body);
    }

    try {
        let response = await fetch(url, parameters);
        let data = await response.json();

        const isUnauthorized = data.errorStatus === ERROR_CODES.EMAIL_NOT_CONFIRMED || data.errorStatus === ERROR_CODES.TOKEN_EXPIRED;

        if (isUnauthorized) {
            const refreshedData = await refreshAuthToken(headers);
            if (!refreshedData) {
                navigate('/sign');
                return;
            }
            const { access_token } = refreshedData.tokenPair;
            headers['Authorization'] = access_token;
            parameters.headers = headers;
            response = await fetch(url, parameters);
            data = await response.json();
        }

        if (data.status >= 400 && data.status < 600) {
            notifyError(data?.message || i18n.t('auth.genericError'));
            console.error(data)
            return { data, status: response.status, ok: response.ok };
        }


        return { data, status: response.status, ok: response.ok };

    } catch (e) {
        console.error(e);
    }
}


export const fetchRegister = (body, navigate) => {
    const parameters = {
        url: urlEnum.register,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    };

    const helpFn = (data, navigate, dispatch) => {
        if (data?.errorStatus || (data?.status >= 400)) {
            dispatch(showErrorNotification(data.message || i18n.t('auth.registerError')));
            return;
        }
        dispatch(showInfoNotification(i18n.t('auth.checkEmail')));
        navigate('/sign');
    };

    return async (dispatch) => {
        try {
            await dispatch(getFetchDispatch(parameters, navigate, helpFn));
        } catch (error) {
            console.error(error.message);
        }
    };
};

// Shared success handler for password login: store tokens, hydrate the
// full profile, and land on /profile.
const handleLoginSuccess = (data, navigate, dispatch) => {
    if (!data?.access_token) {
        dispatch(showErrorNotification(data?.message || i18n.t('auth.invalidCredentials')));
        return;
    }
    const { user, access_token, refresh_token } = data;
    dispatch(authAction.updateAuth({
        userInfo: { ...user, password: undefined },
        userToken: access_token,
    }));
    setAuthTokens({ access: access_token, refresh: refresh_token });
    // The login payload is the bare user (avatar/groups not populated). Fetch
    // the full profile so the picture and groups render without a manual refresh.
    dispatch(fetchUserInfo(navigate));
    navigate('/profile');
};

export const fetchLogin = (body, navigate) => {
    const parameters = {
        url: urlEnum.login,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    };

    return async (dispatch) => {
        try {
            await dispatch(getFetchDispatch(parameters, navigate, handleLoginSuccess));
        } catch (error) {
            console.error(error.message);
        }
    };
};

export const fetchUserInfo = (navigate) => {
    const responseFn = (data, navigate, dispatch) => {
        data.birthday = new Date(data.birthday).toISOString();
        dispatch(authAction.updateAuth({
            userInfo: { ...data, password: undefined },
        }));
    };

    return fetchAuthDispatch(responseFn, navigate);
};
