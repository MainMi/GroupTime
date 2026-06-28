export const STORAGE_KEYS = {
    SELECTED_GROUP: 'gt_selected_group',
    TOUR_DONE: 'gt_tour_done',
    FILTER_PRESETS: 'gt_schedule_filter_presets',
    ASSISTANT_GROUP_IDS: 'gt_assistant_group_ids',
    ASSISTANT_TIME_MODE: 'gt_assistant_time_mode',
};

export const buildMessagesKey = (...parts) => `messages-${parts.join('-')}`;
