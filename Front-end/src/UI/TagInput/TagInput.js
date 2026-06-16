import { useMemo, useState } from 'react';
import classes from './TagInput.module.scss';

// Multi-tag editor: pick from suggestions or type a brand-new tag (Enter / comma).
const TagInput = ({ value = [], onChange, suggestions = [], placeholder = 'Додати тег…' }) => {
    const [input, setInput] = useState('');

    const addTag = (raw) => {
        const tag = (raw || '').trim();
        if (!tag) return;
        if (!value.includes(tag)) onChange([...value, tag]);
        setInput('');
    };

    const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && value.length) {
            removeTag(value[value.length - 1]);
        }
    };

    const query = input.trim().toLowerCase();
    const filteredSuggestions = useMemo(
        () =>
            suggestions.filter(
                (s) => !value.includes(s) && s.toLowerCase().includes(query)
            ),
        [suggestions, value, query]
    );

    const canCreate = query && !value.some((t) => t.toLowerCase() === query) &&
        !suggestions.some((s) => s.toLowerCase() === query);

    return (
        <div className={classes.tagInput}>
            <div className={classes.chips}>
                {value.map((tag) => (
                    <span key={tag} className={classes.chip}>
                        {tag}
                        <button type="button" className={classes.remove} onClick={() => removeTag(tag)}>
                            ×
                        </button>
                    </span>
                ))}
                <input
                    className={classes.input}
                    value={input}
                    placeholder={value.length ? '' : placeholder}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {query && (filteredSuggestions.length > 0 || canCreate) && (
                <div className={classes.suggestions}>
                    {filteredSuggestions.map((s) => (
                        <div key={s} className={classes.suggestion} onClick={() => addTag(s)}>
                            {s}
                        </div>
                    ))}
                    {canCreate && (
                        <div className={`${classes.suggestion} ${classes.create}`} onClick={() => addTag(input)}>
                            + Додати «{input.trim()}»
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagInput;
