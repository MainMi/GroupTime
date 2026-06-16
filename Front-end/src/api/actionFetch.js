import urlEnum from '../constants/urlEnum';
import { getFetch } from './apiFetch';

// All action-token requests pass the raw token in the Authorization header,
// matching the backend authMiddleware.checkActionToken (req.get('Authorization')).

export function confirmEmailToken(token) {
  return getFetch({
    url: urlEnum.confirmEmailUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function confirmGroupInvite(token) {
  return getFetch({
    url: urlEnum.confirmGroupUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function declineGroupInvite(token) {
  return getFetch({
    url: urlEnum.declineGroupUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function confirmGroupAdmin(token) {
  return getFetch({
    url: urlEnum.confirmAdminUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function declineGroupAdmin(token) {
  return getFetch({
    url: urlEnum.declineAdminUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function confirmGroupUser(token) {
  return getFetch({
    url: urlEnum.confirmUserUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

export function declineGroupUser(token) {
  return getFetch({
    url: urlEnum.declineUserUrl,
    method: 'GET',
    headers: { Authorization: token },
  });
}

// Ask the server to e-mail a password-reset link to the given address.
export function requestPasswordReset(email) {
  return getFetch({
    url: urlEnum.forgotPasswordUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email },
  });
}

export function resetPassword(token, password) {
  return getFetch({
    url: urlEnum.forgotPasswordUrl,
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: { password },
  });
}
