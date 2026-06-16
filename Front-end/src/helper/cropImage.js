// Crops a region of an image (from react-easy-crop's croppedAreaPixels) and
// returns it as a File ready to upload. Output is a square PNG/JPEG.

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

/**
 * @param {string} imageSrc      Object URL / data URL of the source image
 * @param {{x:number,y:number,width:number,height:number}} cropPixels
 * @param {string} fileName      Name for the resulting File
 * @returns {Promise<File>}
 */
export const getCroppedImageFile = async (imageSrc, cropPixels, fileName = 'avatar.jpg') => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;

    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(new File([blob], fileName, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    });
};

export default getCroppedImageFile;
