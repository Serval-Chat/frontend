export const downloadImage = async (
    src: string,
    alt: string,
): Promise<void> => {
    const { fetch } = await import('@tauri-apps/plugin-http');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const { downloadDir } = await import('@tauri-apps/api/path');
    const { platform } = await import('@tauri-apps/plugin-os');
    const { invoke } = await import('@tauri-apps/api/core');

    const response = await fetch(src, { method: 'GET' });
    if (!response.ok) throw new Error('Download failed');

    const buffer = await response.arrayBuffer();
    const extension = src.split('.').pop()?.split('?')[0] || 'png';
    const filename = `${alt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${extension}`;

    // Using warn to suppress linter but still allow mobile debugging output since console.log is banned
    console.warn('Platform: ', platform);

    const os = platform();
    const dir =
        os === 'android' ? '/storage/emulated/0/Download' : await downloadDir();

    await writeFile(`${dir}/${filename}`, new Uint8Array(buffer));
    if (os === 'android') {
        try {
            await invoke('plugin:mediascan|scanFile', {
                path: `${dir}/${filename}`,
            });
        } catch (e) {
            console.error('Failed to trigger media scan:', e);
        }
    }
    console.warn('Downloaded to:', `${dir}/${filename}`);
};
