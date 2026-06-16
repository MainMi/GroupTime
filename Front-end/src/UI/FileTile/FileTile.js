import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFileCategory } from '../../helper/fileType';
import classes from './FileTile.module.scss';

// Inline category icons (single-color, inherit currentColor) — keeps the bundle
// asset-free and matches the existing inline-SVG style used elsewhere.
const ICONS = {
    pdf: (
        <path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM8.2 13.6h.9c.9 0 1.5-.5 1.5-1.4 0-.8-.6-1.3-1.5-1.3H7.4v4.6h.8v-1.9Zm0-2.1h.8c.4 0 .7.2.7.6s-.3.7-.7.7h-.8v-1.3Zm3.6 3.9h1.5c1.3 0 2.1-.9 2.1-2.3s-.8-2.3-2.1-2.3h-1.5v4.6Zm.8-3.9h.6c.8 0 1.3.6 1.3 1.6s-.5 1.6-1.3 1.6h-.6v-3.2Z" />
    ),
    document: (
        <path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM8 11h8v1.4H8V11Zm0 3h8v1.4H8V14Zm0 3h5v1.4H8V17Z" />
    ),
    spreadsheet: (
        <path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM7.5 11h9v7.5h-9V11Zm1.3 1.3v1.4h2.4v-1.4H8.8Zm3.7 0v1.4h2.7v-1.4h-2.7Zm-3.7 2.6v1.4h2.4v-1.4H8.8Zm3.7 0v1.4h2.7v-1.4h-2.7Z" />
    ),
    presentation: (
        <path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5ZM7.5 11h9v5h-9v-5Zm1.4 1.3v2.4h6.2v-2.4H8.9Z" />
    ),
    archive: (
        <path fill="currentColor" d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 2v1.5h2V4h-2Zm0 3v1.5h2V7h-2Zm0 3v1.5h2V10h-2Zm0 3v2.2c0 .9.4 1.8 1 1.8s1-.9 1-1.8V13h-2Z" />
    ),
    audio: (
        <path fill="currentColor" d="M14 3 8 6.5H4v7h4L14 17V3Zm3.5 4.5a5 5 0 0 1 0 5l-1.2-1.2a3.3 3.3 0 0 0 0-2.6L17.5 7.5Z" />
    ),
    video: (
        <path fill="currentColor" d="M4 6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1.5l4-2.5v11l-4-2.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
    ),
    file: (
        <path fill="currentColor" d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V6h2.5L14 3.5Z" />
    ),
};

const CategoryIcon = ({ category }) => (
    <svg className={classes.icon} viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
        {ICONS[category] || ICONS.file}
    </svg>
);

// A single square file tile: image files show a thumbnail, everything else shows
// a category icon. The whole tile is a download/open link.
const FileTile = ({ file }) => {
    const { t } = useTranslation();
    const [imgError, setImgError] = useState(false);
    const category = getFileCategory(file);
    const showThumb = category === 'image' && file.location && !imgError;

    return (
        <a
            href={file.location}
            target="_blank"
            rel="noreferrer"
            download
            className={`${classes.tile} ${classes[category] || ''}`}
            title={`${file.name} — ${t('event.download')}`}
        >
            <div className={classes.preview}>
                {showThumb ? (
                    <img
                        src={file.location}
                        alt={file.name}
                        className={classes.thumb}
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <>
                        <CategoryIcon category={category} />
                        <span className={classes.badge}>
                            {t(`event.fileType.${category}`, category)}
                        </span>
                    </>
                )}
            </div>
            <span className={classes.name}>{file.name}</span>
        </a>
    );
};

export default FileTile;
