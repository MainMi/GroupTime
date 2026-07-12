import urlEnum from "../constants/urlEnum";
import { fetchAuth, fetchAuthDispatch } from "../redux/actions/auth-actions";
import { authAction } from "../redux/slices/auth-slice";
import { groupInfoAction } from "../redux/slices/group-info-slice";
import { getFetch} from "./apiFetch";

export function createGroup (data) {
    const { name, type, description } = data;
    const url = urlEnum.createGroup
    const body = { name, type, description };
    return fetchAuth({ url, body })
};

export function editGroup (data, navigate) {
    const responseFn = (data, navigate, dispatch) => {
        dispatch(authAction.updateGroups(data));
        dispatch(groupInfoAction.addGroupInfo(data));
    };
    const responseArgm = {
        url: urlEnum.editGroup,
        method: 'PATCH',
        body: data
    }
    return fetchAuthDispatch(responseFn, navigate, responseArgm);
}
export function deleteGroup (groupId) {
    const url = urlEnum.deleteGroup;
    return fetchAuth({
        url,
        method: 'DELETE',
        body: { groupId }
    });
}
export function leaveGroup (groupId) {
    const url = urlEnum.leaveGroup;
    return fetchAuth({
        url,
        method: 'DELETE',
        body: { groupId }
    });
}

export function getGroupInfo (groupId, navigate) {
    const responseFn = (data, navigate, dispatch) => {
        dispatch(groupInfoAction.addGroupInfo(data));
    };
    const responseArgm = {
        url: urlEnum.groupInfo,
        method: 'POST',
        body: { groupId }
    }
    return fetchAuthDispatch(responseFn, navigate, responseArgm);
}

// Like getGroupInfo but returns the group (with populated members) to the caller
// instead of only dispatching it — used where a component needs the member list
// inline (e.g. the free-slot finder's member picker).
export function fetchGroupInfo (groupId, navigate) {
    return fetchAuth({ url: urlEnum.groupInfo, method: 'POST', body: { groupId } }, navigate);
}

export function searchGroup (groupId) {
    const url = `${urlEnum.groupSearch}?groupId=${groupId}`
    return getFetch({ url, silent: true })
};

export function searchGroups (query) {
    const url = `${urlEnum.groupSearch}?query=${query}`
    return getFetch({ url, silent: true })
};
export function joinGroup (groupId) {
    const url = urlEnum.groupJoin
    return fetchAuth({ url, method: 'POST', body: { groupId } })
};

export function inviteUsersToGroup (data) {
    const { usersId, roles, groupId } = data;
    const url = urlEnum.inviteUsers
    const body = { usersId, roles, groupId };
    
    return fetchAuth({ url, body })
};
export function acceptInviteGroup (actionToken) {
    const url = urlEnum.acceptInvite
    const headers = { Authorization: actionToken };
    return getFetch({ url, headers })
};
export function deleteInviteGroup (actionToken) {
    const url = urlEnum.deleteInvite
    const headers = { Authorization: actionToken };
    return getFetch({ url, headers })
};

export function changeUserRole(data, navigate) {
    return fetchAuth({
        url: urlEnum.groupRoleAdd,
        method: 'POST',
        body: data,
    }, navigate);
}

export function removeUserFromGroup(data, navigate) {
    return fetchAuth({
        url: urlEnum.groupUserRemove,
        method: 'DELETE',
        body: data,
    }, navigate);
}

export function transferOwnership(data, navigate) {
    return fetchAuth({
        url: urlEnum.groupRoleTransfer,
        method: 'POST',
        body: data,
    }, navigate);
}