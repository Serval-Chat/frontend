import { apiClient } from '@/api/client';
import { getAuthToken } from '@/utils/authToken';

const isTauri = (): boolean => '__TAURI_INTERNALS__' in window;

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function syncWebPush(): Promise<void> {
    if (isTauri() || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        try {
            await setupWebPush();
        } catch (err) {
            console.error('[WebPush] Error during silent sync:', err);
        }
    }
}

export async function setupWebPush(): Promise<void> {
    if (isTauri()) return; // tauri handles its own notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
    }
    await navigator.serviceWorker.ready;

    const keyRes = await apiClient.get('/api/v1/push/vapid-public-key');
    const { publicKey } = keyRes.data;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            // @ts-expect-error TypeScript typings mismatch for BufferSource
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
    }

    await apiClient.post('/api/v1/push/subscribe/web', { subscription: sub });
}

export async function teardownWebPush(): Promise<void> {
    if (isTauri()) return;
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
    }

    if (getAuthToken()) {
        try {
            await apiClient.delete('/api/v1/push/unsubscribe');
        } catch (err) {
            console.error('[WebPush] Error unsubscribing backend layer', err);
        }
    }
}

export async function checkAndMigrateVapid(): Promise<void> {
    if (isTauri()) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) return;

    const existingSub = await reg.pushManager.getSubscription();
    if (!existingSub) return;

    const res = await apiClient.get('/api/v1/push/vapid-status');
    const { currentPublicKey } = res.data;

    const subKeyBytes = existingSub.options.applicationServerKey;
    if (!subKeyBytes) return;

    const subKeyBase64 = uint8ArrayToBase64Url(new Uint8Array(subKeyBytes));

    if (subKeyBase64 === currentPublicKey) return;

    await existingSub.unsubscribe();
    const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // @ts-expect-error TypeScript typings mismatch for BufferSource
        applicationServerKey: urlBase64ToUint8Array(currentPublicKey),
    });

    await apiClient.post('/api/v1/push/migrate-vapid', {
        oldEndpoint: existingSub.endpoint,
        newSubscription: newSub.toJSON(),
    });
}

export function listenForSwNavigation(navigate: (url: string) => void): void {
    if (isTauri() || !navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'NAVIGATE') navigate(e.data.url);
    });
}
