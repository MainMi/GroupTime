import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './TypeSelect.module.scss';
import { TYPE_PALETTE, DEFAULT_TYPE_COLOR } from '../../constants/type/eventEnum';

// Single-select type picker with a color bound to each type. Separate from the
// (multi-select) TagInput so types and tags never share a pool. You can pick a
// predefined type or create a custom one and choose its color from TYPE_PALETTE.
// value: { name, color } | null   onChange(value)
const TypeSelect = ({ value, options = [], onChange, placeholder }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    // Color staged for a custom (typed) type before it is confirmed.
    const [pendingColor, setPendingColor] = useState(TYPE_PALETTE[0]);
    const wrapRef = useRef(null);

    const ph = placeholder ?? t('event.typePlaceholder', 'Оберіть або створіть тип…');

    // Close the popover on outside click.
    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const query = input.trim().toLowerCase();
    const filtered = useMemo(
        () => options.filter((o) => o.name.toLowerCase().includes(query)),
        [options, query]
    );

    const canCreate =
        query && !options.some((o) => o.name.toLowerCase() === query);

    const select = (item) => {
        onChange(item);
        setInput('');
        setOpen(false);
    };

    const createCustom = (color) => {
        const name = input.trim();
        if (!name) return;
        select({ name, color: color || pendingColor || DEFAULT_TYPE_COLOR });
    };

    return (
        <div className={classes.typeSelect} ref={wrapRef}>
            <button
                type="button"
                className={classes.control}
                onClick={() => setOpen((o) => !o)}
            >
                {value?.name ? (
                    <span className={classes.current}>
                        <span
                            className={classes.dot}
                            style={{ backgroundColor: value.color || DEFAULT_TYPE_COLOR }}
                        />
                        {value.name}
                    </span>
                ) : (
                    <span className={classes.placeholder}>{ph}</span>
                )}
                <span className={classes.caret}>▾</span>
            </button>

            {open && (
                <div className={classes.popover}>
                    <input
                        autoFocus
                        className={classes.search}
                        value={input}
                        placeholder={ph}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <div className={classes.list}>
                        {filtered.map((o) => (
                            <div
                                key={o.name}
                                className={classes.option}
                                onClick={() => select(o)}
                            >
                                <span className={classes.dot} style={{ backgroundColor: o.color }} />
                                {o.name}
                            </div>
                        ))}
                        {!filtered.length && !canCreate && (
                            <div className={classes.empty}>{t('event.typeNoMatch', 'Нічого не знайдено')}</div>
                        )}
                    </div>

                    {canCreate && (
                        <div className={classes.create}>
                            <div className={classes.createLabel}>
                                {t('event.typeCreate', 'Створити тип')} «{input.trim()}» —
                                {' '}{t('event.typePickColor', 'оберіть колір')}:
                            </div>
                            <div className={classes.palette}>
                                {TYPE_PALETTE.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`${classes.swatch} ${pendingColor === c ? classes.swatchActive : ''}`}
                                        style={{ backgroundColor: c }}
                                        onMouseEnter={() => setPendingColor(c)}
                                        onClick={() => createCustom(c)}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TypeSelect;
