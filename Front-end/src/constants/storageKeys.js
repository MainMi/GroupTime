export const STORAGE_KEYS = {
    SELECTED_GROUP: 'gt_selected_group',
    TOUR_DONE: 'gt_tour_done',
    FILTER_PRESETS: 'gt_schedule_filter_presets',
};

export const buildMessagesKey = (...parts) => `messages-${parts.join('-')}`;
