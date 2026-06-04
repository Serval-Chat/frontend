export const convertToWebp = (blob: Blob, fileName: string): Promise<File> =>
    new Promise((resolve, reject): void => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = (): void => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((convertedBlob): void => {
                if (convertedBlob) {
                    const newName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
                    resolve(
                        new File([convertedBlob], newName, {
                            type: 'image/webp',
                        }),
                    );
                } else {
                    reject(new Error('Failed to convert to webp'));
                }
                URL.revokeObjectURL(url);
            }, 'image/webp');
        };
        img.onerror = (): void => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
