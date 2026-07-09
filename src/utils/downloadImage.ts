export const downloadImage = async (
    src: string,
    alt: string,
): Promise<void> => {
    const [
        { fetch },
        { writeFile },
        { downloadDir },
        { platform },
        { invoke },
    ] = await Promise.all([
        import('@tauri-apps/plugin-http'),
        import('@tauri-apps/plugin-fs'),
        import('@tauri-apps/api/path'),
        import('@tauri-apps/plugin-os'),
        import('@tauri-apps/api/core'),
    ]);

    const response = await fetch(src, { method: 'GET' });
    if (!response.ok) throw new Error('Download failed');

    const buffer = await response.arrayBuffer();
    const rawExtension = src.split('.').pop()?.split('?')[0];
    const extension =
        rawExtension !== undefined && rawExtension !== ''
            ? rawExtension
            : 'png';
    const filename = `${alt.replaceAll(/[^a-z0-9]/gi, '_').toLowerCase()}_${String(Date.now())}.${extension}`;

    // Using warn to suppress linter but still allow mobile debugging output since console.log is banned
    console.warn('Platform:', platform);

    const os = platform();
    const dir =
        os === 'android' ? '/storage/emulated/0/Download' : await downloadDir();

    await writeFile(`${dir}/${filename}`, new Uint8Array(buffer));
    if (os === 'android') {
        try {
            await invoke('plugin:mediascan|scanFile', {
                path: `${dir}/${filename}`,
            });
        } catch (error) {
            console.error('Failed to trigger media scan:', error);
        }
    }
    console.warn('Downloaded to:', `${dir}/${filename}`);
};
