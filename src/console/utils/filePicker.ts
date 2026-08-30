export interface PickedFile {
    content: string;
    name: string;
}

export const pickTextFile = (accept?: string): Promise<PickedFile | null> =>
    new Promise((resolve): void => {
        if (typeof document === 'undefined') {
            resolve(null);
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        if (accept) input.accept = accept;

        let settled = false;
        const finish = (value: PickedFile | null): void => {
            if (settled) return;
            settled = true;
            window.removeEventListener('focus', onWindowFocus);
            input.remove();
            resolve(value);
        };

        const onWindowFocus = (): void => {
            setTimeout((): void => {
                if (!settled && input.files?.length === 0) finish(null);
            }, 300);
        };

        input.addEventListener('cancel', (): void => finish(null));

        input.addEventListener('change', (): void => {
            const file = input.files?.[0];
            if (!file) {
                finish(null);
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', (): void => {
                finish({
                    content:
                        typeof reader.result === 'string' ? reader.result : '',
                    name: file.name,
                });
            });
            reader.addEventListener('error', (): void => finish(null));
            reader.readAsText(file);
        });

        window.addEventListener('focus', onWindowFocus);
        document.body.append(input);
        input.click();
    });
