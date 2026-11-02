import type { ReportMessageEditRevision } from '@/api/reports/reports.api';

export interface ReconstructedMessageRevision {
    text: string;
    editedAt: string;
}

export function reconstructMessageEditHistory(
    currentText: string,
    history: ReportMessageEditRevision[],
): ReconstructedMessageRevision[] {
    let text = currentText;
    const revisions: ReconstructedMessageRevision[] = [];

    for (let index = history.length - 1; index >= 0; index -= 1) {
        const revision = history[index];
        if (!revision) continue;

        if ('text' in revision) {
            text = revision.text;
        } else {
            const characters = Array.from(text);
            const insertedCharacters = Array.from(revision.insertedText);
            characters.splice(
                revision.start,
                insertedCharacters.length,
                ...Array.from(revision.removedText),
            );
            text = characters.join('');
        }

        revisions.push({ text, editedAt: revision.editedAt });
    }

    return revisions.reverse();
}
