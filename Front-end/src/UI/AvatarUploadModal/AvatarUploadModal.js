import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import ButtonSmall from '../Button/ButtonSmall';
import Loader from '../Loader/Loader';
import { getCroppedImageFile } from '../../helper/cropImage';
import { notifyError } from '../../helper/notify';
import classes from './AvatarUploadModal.module.scss';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const AvatarUploadModal = ({
    title,
    gallery = [],
    currentAvatarId = null,
    onUpload,
    onSelect,
    onDelete,
    modalClose,
}) => {
    const { t } = useTranslation();
    const modalTitle = title ?? t('avatar.changePhoto');
    // imageSrc set → cropping a freshly picked file; otherwise → gallery view.
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isBusy, setIsBusy] = useState(false);

    const fileInputRef = useRef(null);

    const onCropComplete = useCallback((_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    // Release the active object URL when it changes or the modal unmounts.
    useEffect(() => {
        if (!imageSrc) return undefined;
        return () => URL.revokeObjectURL(imageSrc);
    }, [imageSrc]);

    const stageFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            notifyError(t('avatar.chooseImage'));
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            notifyError(t('avatar.tooLarge'));
            return;
        }
        setImageSrc(URL.createObjectURL(file));
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleFileChange = (e) => stageFile(e.target.files?.[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        stageFile(e.dataTransfer.files?.[0]);
    };

    const resetCrop = () => {
        setImageSrc(null);
        setCroppedAreaPixels(null);
    };

    const handleDeletePhoto = async (e, fileId) => {
        e.stopPropagation();
        if (isBusy) return;
        setIsBusy(true);
        try {
            await onDelete(fileId);
            if (selectedId === fileId) setSelectedId(null);
        } finally {
            setIsBusy(false);
        }
    };

    const handleSave = async () => {
        if (isBusy) return;
        setIsBusy(true);
        try {
            if (imageSrc && croppedAreaPixels) {
                // Saving a freshly cropped upload.
                const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
                const res = await onUpload(file);
                if (res && res.ok !== false) modalClose();
            } else if (selectedId && selectedId !== currentAvatarId) {
                // Saving a pick from the existing buffer.
                const res = await onSelect(selectedId);
                if (res && res.ok !== false) modalClose();
            }
        } catch (error) {
            console.error('Avatar save failed:', error);
            notifyError(t('avatar.saveFailed'));
        } finally {
            setIsBusy(false);
        }
    };

    const canSave = imageSrc
        ? !!croppedAreaPixels
        : !!selectedId && selectedId !== currentAvatarId;

    return (
        <Modal onHiddenCart={modalClose} modalClassname={classes.modal}>
            <div className={classes.box}>
                <h3 className={classes.title}>{modalTitle}</h3>

                {imageSrc ? (
                    <>
                        <div className={classes.cropArea}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className={classes.zoom}
                            aria-label={t('avatar.zoom')}
                        />
                    </>
                ) : (
                    <>
                        {gallery.length > 0 && (
                            <div className={classes.gallery}>
                                {gallery.map((photo) => {
                                    const isActive = photo._id === currentAvatarId;
                                    const isSelected = photo._id === selectedId;
                                    return (
                                        <div
                                            key={photo._id}
                                            className={`${classes.thumb} ${isSelected ? classes.selected : ''} ${isActive ? classes.active : ''}`}
                                            onClick={() => setSelectedId(photo._id)}
                                            title={isActive ? t('avatar.current') : t('avatar.choose')}
                                        >
                                            <img src={photo.location} alt="avatar option" />
                                            {isActive && <span className={classes.activeBadge}>✓</span>}
                                            <ButtonSmall
                                                centerImg="trash"
                                                typeColor="pink"
                                                size={12}
                                                className={classes.thumbDelete}
                                                onClick={(e) => handleDeletePhoto(e, photo._id)}
                                                aria-label={t('avatar.deletePhoto')}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div
                            className={`${classes.dropZone} ${isDragging ? classes.dragging : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <p>{t('avatar.dropHint')}</p>
                            <span>{t('avatar.formats')}</span>
                        </div>
                    </>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={classes.hiddenInput}
                />

                <div className={classes.actions}>
                    {imageSrc ? (
                        <Button typeBtn="button" type="noBorder" onClick={resetCrop} disabled={isBusy}>
                            {t('common.back')}
                        </Button>
                    ) : (
                        <Button typeBtn="button" type="noBorder" onClick={modalClose} disabled={isBusy}>
                            {t('common.cancel')}
                        </Button>
                    )}
                    <Button
                        typeBtn="button"
                        typeColor="green"
                        onClick={handleSave}
                        disabled={!canSave || isBusy}
                    >
                        {isBusy ? <Loader inline /> : t('common.save')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AvatarUploadModal;
