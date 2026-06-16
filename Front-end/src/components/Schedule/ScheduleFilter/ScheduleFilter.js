import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './ScheduleFilter.module.scss';
import {
    EMPTY_FILTER,
    extractFilterOptions,
    isEmptyFilter,
    loadPresets,
    savePresets,
} from '../../../helper/scheduleFilter';

const blankEditing = () => ({ id: null, name: '', filter: { ...EMPTY_FILTER } });

const ScheduleFilter = ({ scheduleWeek, activeFilter, onChange, groupOptions = null }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [presets, setPresets] = useState(() => loadPresets());
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    const [editing, setEditing] = useState(null); // null = list view, object = editor

    const panelRef = useRef(null);

    const options = useMemo(() => extractFilterOptions(scheduleWeek), [scheduleWeek]);

    // Close the panel on outside click.
    useEffect(() => {
        const onClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', onClick);
        return () => window.removeEventListener('mousedown', onClick);
    }, []);

    const dimensions = useMemo(() => {
        const base = [
            { key: 'types', label: t('filter.eventType'), items: options.types.map((v) => ({ value: v, label: v })) },
            { key: 'tags', label: t('filter.tag'), items: options.tags.map((v) => ({ value: v, label: v })) },
            { key: 'teachers', label: t('filter.teacher'), items: options.teachers.map((v) => ({ value: v, label: v })) },
            { key: 'places', label: t('filter.placePlatform'), items: options.places.map((v) => ({ value: v, label: v })) },
            { key: 'kinds', label: t('filter.scheduleKind'), items: options.kinds.map((k) => ({ value: k.value, label: t(k.label) })) },
        ];
        // Only in "all groups" mode: choose which groups to display.
        if (groupOptions && groupOptions.length) {
            base.unshift({ key: 'groups', label: t('filter.groupsToView'), items: groupOptions });
        }
        return base;
    }, [options, groupOptions, t]);

    const activeLabel = isEmptyFilter(activeFilter)
        ? t('filter.noFilters')
        : presets.find((p) => p.id === selectedPresetId)?.name || t('filter.customFilter');

    const applyAll = () => {
        setSelectedPresetId(null);
        onChange(EMPTY_FILTER);
        setEditing(null);
    };

    const applyPreset = (preset) => {
        setSelectedPresetId(preset.id);
        onChange(preset.filter);
        setEditing(null);
    };

    const persist = (next) => {
        setPresets(next);
        savePresets(next);
    };

    const toggleValue = (dimKey, value) => {
        setEditing((prev) => {
            const current = prev.filter[dimKey] || [];
            const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, filter: { ...prev.filter, [dimKey]: next } };
        });
    };

    const saveEditing = () => {
        const name = editing.name.trim();
        if (!name) return;

        let next;
        let savedId;
        if (editing.id) {
            savedId = editing.id;
            next = presets.map((p) => (p.id === editing.id ? { ...p, name, filter: editing.filter } : p));
        } else {
            savedId = Date.now();
            next = [...presets, { id: savedId, name, filter: editing.filter }];
        }
        persist(next);
        setSelectedPresetId(savedId);
        onChange(editing.filter);
        setEditing(null);
    };

    const deletePreset = (id) => {
        persist(presets.filter((p) => p.id !== id));
        if (selectedPresetId === id) applyAll();
    };

    return (
        <div className={classes.filter} ref={panelRef}>
            <button
                type="button"
                className={`${classes.trigger} ${!isEmptyFilter(activeFilter) ? classes.active : ''}`}
                onClick={() => setIsOpen((v) => !v)}
            >
                <span className={classes.triggerLabel}>{activeLabel}</span>
                <span className={classes.chevron}>▾</span>
            </button>

            {isOpen && (
                <div className={classes.panel}>
                    {!editing ? (
                        <>
                            <ul className={classes.presetList}>
                                <li
                                    className={`${classes.presetItem} ${isEmptyFilter(activeFilter) ? classes.selected : ''}`}
                                    onClick={applyAll}
                                >
                                    <span>{t('filter.noFilters')}</span>
                                </li>
                                {presets.map((preset) => (
                                    <li
                                        key={preset.id}
                                        className={`${classes.presetItem} ${selectedPresetId === preset.id ? classes.selected : ''}`}
                                    >
                                        <span className={classes.presetName} onClick={() => applyPreset(preset)}>
                                            {preset.name}
                                        </span>
                                        <span className={classes.presetActions}>
                                            <button
                                                type="button"
                                                className={classes.iconBtn}
                                                title={t('filter.edit')}
                                                onClick={() =>
                                                    setEditing({
                                                        id: preset.id,
                                                        name: preset.name,
                                                        filter: { ...EMPTY_FILTER, ...preset.filter },
                                                    })
                                                }
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                className={classes.iconBtn}
                                                title={t('filter.delete')}
                                                onClick={() => deletePreset(preset.id)}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className={classes.newBtn}
                                onClick={() => setEditing(blankEditing())}
                            >
                                {t('filter.newFilter')}
                            </button>
                        </>
                    ) : (
                        <div className={classes.editor}>
                            <input
                                className={classes.nameInput}
                                placeholder={t('filter.namePlaceholder')}
                                value={editing.name}
                                onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                            />

                            {dimensions.map((dim) =>
                                dim.items.length ? (
                                    <div key={dim.key} className={classes.dimension}>
                                        <p className={classes.dimensionLabel}>{dim.label}</p>
                                        <div className={classes.chips}>
                                            {dim.items.map((item) => {
                                                const checked = (editing.filter[dim.key] || []).includes(item.value);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={item.value}
                                                        className={`${classes.chip} ${checked ? classes.chipActive : ''}`}
                                                        onClick={() => toggleValue(dim.key, item.value)}
                                                    >
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null
                            )}

                            <div className={classes.editorActions}>
                                <button type="button" className={classes.cancelBtn} onClick={() => setEditing(null)}>
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className={classes.saveBtn}
                                    disabled={!editing.name.trim()}
                                    onClick={saveEditing}
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScheduleFilter;
