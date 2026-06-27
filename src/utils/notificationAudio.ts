let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();

function getContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!ctx) ctx = new AudioContext();
    return ctx;
}

export function unlockAudio(): void {
    const context = getContext();
    if (context?.state === 'suspended') void context.resume();
}

export async function playAudio(url: string): Promise<void> {
    const context = getContext();
    if (!context) return;

    if (context.state === 'suspended') {
        try {
            await context.resume();
        } catch {
            return;
        }
    }

    try {
        let buffer = buffers.get(url);
        if (!buffer) {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await context.decodeAudioData(arrayBuffer);
            buffers.set(url, buffer);
        }

        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
    } catch {
        // silently ignore decode/playback errors
    }
}
