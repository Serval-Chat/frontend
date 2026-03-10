importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

self.addEventListener('push', (event) => {
    if (!event.data) return;
    const payload = event.data.json();
    const { title, body, icon, tag, data } = payload;

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: icon || '/icons/icon-192.png', // i dont have those icons lol, i need to find a serval that fits
            badge: '/icons/badge-72.png',
            tag,
            data,
            vibrate: [200, 100, 200],
            actions: actionsFor(data?.type),
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const { type, url, senderId } = event.notification.data || {};
    const action = event.action;

    let target = '/';
    if (action === 'accept_friend') target = `/friends/accept/${senderId}`;
    else if (action === 'decline_friend') target = `/friends/decline/${senderId}`;
    else if (type === 'mention') target = url || '/mentions';
    else if (url) target = url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NAVIGATE', url: target });
                    return;
                }
            }
            return clients.openWindow(target);
        })
    );
});


// Browser rotated the subscription, new sub time
self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil(
        (async () => {
            let options = event.oldSubscription ? event.oldSubscription.options : null;
            let newSub = event.newSubscription;

            if (!newSub && !options) {
                try {
                    const res = await fetch('/api/v1/push/vapid-public-key');
                    const { publicKey } = await res.json();
                    options = {
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicKey)
                    };
                } catch (err) {
                    console.error('[SW] Failed to fetch VAPID key for re-subscription:', err);
                    return;
                }
            }

            if (!newSub) {
                try {
                    newSub = await self.registration.pushManager.subscribe(options);
                } catch (err) {
                    console.error('[SW] Failed to re-subscribe after change:', err);
                    return;
                }
            }

            const token = await idbKeyval.get('auth_token');
            if (!token) return;

            return fetch('/api/v1/push/subscribe/web', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription: newSub }),
            });
        })()
    );
});

function urlBase64ToUint8Array(base64) {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function actionsFor(type) {
    if (type === 'friend_request') {
        return [
            { action: 'accept_friend', title: '✓ Accept' },
            { action: 'decline_friend', title: '✗ Decline' },
        ];
    }
    return [];
}
