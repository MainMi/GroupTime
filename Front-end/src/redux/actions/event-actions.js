import { eventActions } from '../slices/event-slice';
import {
  addStaticEvent as addStaticEventApi,
  addDynamicEvent as addDynamicEventApi,
  editEvent as editEventApi,
  deleteStaticEvent as deleteStaticEventApi,
  deleteDynamicEvent as deleteDynamicEventApi,
} from '../../api/eventFetch';

// Додавання статичної події
export const createStaticEvent = (eventData, navigate) => async (dispatch) => {
  try {
    dispatch(eventActions.setLoading(true));
    dispatch(eventActions.clearError());

    const response = await addStaticEventApi(eventData, navigate);

    if (response.ok) {
      dispatch(eventActions.addEvent(response.data));
      dispatch(eventActions.setLoading(false));
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data?.message || 'Failed to create event');
    }
  } catch (error) {
    dispatch(eventActions.setError(error.message));
    dispatch(eventActions.setLoading(false));
    return { success: false, error: error.message };
  }
};

// Додавання динамічної події
export const createDynamicEvent = (eventData, navigate) => async (dispatch) => {
  try {
    dispatch(eventActions.setLoading(true));
    dispatch(eventActions.clearError());

    const response = await addDynamicEventApi(eventData, navigate);

    if (response.ok) {
      dispatch(eventActions.addEvent(response.data));
      dispatch(eventActions.setLoading(false));
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data?.message || 'Failed to create event');
    }
  } catch (error) {
    dispatch(eventActions.setError(error.message));
    dispatch(eventActions.setLoading(false));
    return { success: false, error: error.message };
  }
};

// Редагування події
export const updateEvent = (eventData, navigate) => async (dispatch) => {
  try {
    dispatch(eventActions.setLoading(true));
    dispatch(eventActions.clearError());

    const response = await editEventApi(eventData, navigate);

    if (response.ok) {
      dispatch(eventActions.updateEvent(response.data));
      dispatch(eventActions.setLoading(false));
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data?.message || 'Failed to update event');
    }
  } catch (error) {
    dispatch(eventActions.setError(error.message));
    dispatch(eventActions.setLoading(false));
    return { success: false, error: error.message };
  }
};

// Видалення статичної події
export const removeStaticEvent = (eventData, navigate) => async (dispatch) => {
  try {
    dispatch(eventActions.setLoading(true));
    dispatch(eventActions.clearError());

    const response = await deleteStaticEventApi(eventData, navigate);

    if (response.ok) {
      dispatch(eventActions.removeEvent({ eventId: eventData.eventInfoId }));
      dispatch(eventActions.setLoading(false));
      return { success: true };
    } else {
      throw new Error(response.data?.message || 'Failed to delete event');
    }
  } catch (error) {
    dispatch(eventActions.setError(error.message));
    dispatch(eventActions.setLoading(false));
    return { success: false, error: error.message };
  }
};

// Видалення динамічної події
export const removeDynamicEvent = (eventData, navigate) => async (dispatch) => {
  try {
    dispatch(eventActions.setLoading(true));
    dispatch(eventActions.clearError());

    const response = await deleteDynamicEventApi(eventData, navigate);

    if (response.ok) {
      dispatch(eventActions.removeEvent({ eventId: eventData.eventInfoId }));
      dispatch(eventActions.setLoading(false));
      return { success: true };
    } else {
      throw new Error(response.data?.message || 'Failed to delete event');
    }
  } catch (error) {
    dispatch(eventActions.setError(error.message));
    dispatch(eventActions.setLoading(false));
    return { success: false, error: error.message };
  }
};
