import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classes from './FileUpload.module.scss';
import { notifyError } from '../../helper/notify';

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Inline file picker for events: drag & drop, click, or paste-from-clipboard.
// "staged" files are not yet uploaded (parent uploads them after save). In edit
// mode, already-uploaded files are passed via `existing` and can be deleted.
// Total (existing + staged) is capped at MAX_FILES.
const FileUpload = ({
    staged = [],
    onStagedChange,
    existing = [],
    onDeleteExisting,
    max = MAX_FILES,
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const inputRef = useRef(null);

    const total = existing.length + staged.length;

    const addFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const room = max - total;
        if (room <= 0) {
            notifyError(t('event.filesLimit', { max }));
            return;
        }

        const accepted = [];
        for (const file of incoming) {
            if (accepted.length >= room) {
                notifyError(t('event.filesLimit', { max }));
                break;
            }
            if (file.size > MAX_SIZE_BYTES) {
                notifyError(t('event.fileTooLarge', { size: MAX_SIZE_BYTES / (1024 * 1024) }));
                continue;
            }
            accepted.push(file);
        }
        if (accepted.length) onStagedChange([...staged, ...accepted]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    const handlePaste = (e) => {
        const files = e.clipboardData?.files;
        if (files && files.length) {
            e.preventDefault();
            addFiles(files);
        }
    };

    const removeStaged = (idx) => {
        onStagedChange(staged.filter((_, i) => i !== idx));
    };

    const deleteExisting = async (fileId) => {
        if (!onDeleteExisting || busyId) return;
        setBusyId(fileId);
        try {
            await onDeleteExisting(fileId);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className={classes.fileUpload}>
            <div
                className={`${classes.dropZone} ${isDragging ? classes.dragging : ''} ${total >= max ? classes.disabled : ''}`}
                onClick={() => total < max && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
            >
                <p>{t('event.filesHint')}</p>
                <span>{total}/{max}</span>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
                className={classes.hiddenInput}
            />

            {(existing.length > 0 || staged.length > 0) && (
                <ul className={classes.list}>
                    {existing.map((f) => (
                        <li key={f._id} className={classes.item}>
                            <a href={f.location} target="_blank" rel="noreferrer" className={classes.fileName}>
                                {f.name}
                            </a>
                            {onDeleteExisting && (
                                <button
                                    type="button"
                                    className={classes.remove}
                                    onClick={() => deleteExisting(f._id)}
                                    disabled={busyId === f._id}
                                    aria-label={t('common.delete')}
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    ))}
                    {staged.map((f, idx) => (
                        <li key={`staged-${idx}-${f.name}`} className={`${classes.item} ${classes.stagedItem}`}>
                            <span className={classes.fileName}>{f.name}</span>
                            <button
                                type="button"
                                className={classes.remove}
                                onClick={() => removeStaged(idx)}
                                aria-label={t('common.delete')}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FileUpload;
