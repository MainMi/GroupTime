import urlEnum from '../constants/urlEnum';
import { fetchAuth } from '../redux/actions/auth-actions';

export function updateUserProfile(data, navigate) {
    return fetchAuth({
        url: urlEnum.userUpdate,
        method: 'POST',
        body: data,
    }, navigate);
}

// Persist that the user finished (or skipped) the whole onboarding tour.
export function completeTour(navigate) {
    return fetchAuth({
        url: urlEnum.userTourComplete,
        method: 'POST',
    }, navigate);
}

export function searchUsers(query, navigate) {
    return fetchAuth({
        url: `${urlEnum.userSearch}?text=${encodeURIComponent(query)}&limit=10`,
        method: 'GET',
    }, navigate);
}
