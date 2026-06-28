import { notifyError } from '../helper/notify';
import { HTTP_STATUS, ERROR_CODES } from '../constants/httpStatus';
import { resolveErrorMessage } from '../helper/errorMessage';

export const getFetchDispatch = (parameters, navigate, helpFn) => {
    return async (dispatch) => {
        try {
            const { url, method = 'GET', headers = {}, body = null } = parameters;

            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
            });
            const data = await response.json();
            
            if (!response.ok) {
                if (data.status === HTTP_STATUS.UNAUTHORIZED && data.errorStatus === ERROR_CODES.EMAIL_NOT_CONFIRMED) {
                    navigate('/sign');
                    return;
                }
            }

            if (helpFn) {
                helpFn(data, navigate, dispatch);
            }
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };
};

export const getFetch = async (parameters, navigate, helpFn) => {
    try {
        const { url, method = 'GET', headers = {}, body = null, silent = false } = parameters;

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });
        const data = await response.json();

        if (!response.ok) {
            if (data.status === HTTP_STATUS.UNAUTHORIZED && data.errorStatus === ERROR_CODES.EMAIL_NOT_CONFIRMED) {
                navigate('/sign');
                return;
            }
            const message = resolveErrorMessage(data);
            if (!silent) {
                notifyError(message);
            }
            console.error(data);
            return { data: { ...data, message }, status: response.status, ok: response.ok };
        }

        if (helpFn) {
            helpFn(data, navigate);
        }
        const result = data.data ? data.data : data;

        return { data: result, status: response.status, ok: response.ok };
    } catch (error) {
        console.error(error);
        throw error;
    }
};