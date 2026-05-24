/* eslint-disable react/no-array-index-key */
import React from 'react';

interface AnsiSegment {
    text: string;
    color?: string;
    backgroundColor?: string;
}

function getStandardColor(code: number): string {
    switch (code) {
        case 0:
            return '#000000';
        case 1:
            return '#ff5555';
        case 2:
            return '#55ff55';
        case 3:
            return '#ffff55';
        case 4:
            return '#5555ff';
        case 5:
            return '#ff55ff';
        case 6:
            return '#55ffff';
        case 7:
            return '#bbbbbb';
        default:
            return '';
    }
}

function getBrightColor(code: number): string {
    switch (code) {
        case 0:
            return '#555555';
        case 1:
            return '#ff5555';
        case 2:
            return '#55ff55';
        case 3:
            return '#ffff55';
        case 4:
            return '#5555ff';
        case 5:
            return '#ff55ff';
        case 6:
            return '#55ffff';
        case 7:
            return '#ffffff';
        default:
            return '';
    }
}

export function parseAnsi(text: string): React.ReactNode[] {
    const segments: AnsiSegment[] = [];
    // eslint-disable-next-line no-control-regex
    const ansiRegex = /\u001b\[([0-9;]*)([mK])/g;

    let lastIndex = 0;
    let currentColor: string | undefined = undefined;
    let currentBgColor: string | undefined = undefined;
    let match;

    while ((match = ansiRegex.exec(text)) !== null) {
        const matchIndex = match.index;
        const paramStr = match[1];
        const suffix = match[2];

        if (matchIndex > lastIndex) {
            let segmentText = text.substring(lastIndex, matchIndex);
            const crIndex = segmentText.lastIndexOf('\r');
            if (crIndex !== -1) {
                segmentText = segmentText.substring(crIndex + 1);
            }
            if (segmentText.length > 0) {
                segments.push({
                    text: segmentText,
                    color: currentColor,
                    backgroundColor: currentBgColor,
                });
            }
        }

        if (suffix === 'K') {
            if (segments.length > 0) {
                segments.pop();
            }
        } else if (suffix === 'm') {
            if (!paramStr || paramStr === '0') {
                currentColor = undefined;
                currentBgColor = undefined;
            } else {
                const parts = paramStr.split(';').map(Number);
                let idx = 0;
                while (idx < parts.length) {
                    const code = parts[idx];
                    if (code === 0) {
                        currentColor = undefined;
                        currentBgColor = undefined;
                        idx++;
                    } else if (
                        code === 38 &&
                        parts[idx + 1] === 2 &&
                        idx + 4 < parts.length
                    ) {
                        const r = parts[idx + 2];
                        const g = parts[idx + 3];
                        const b = parts[idx + 4];
                        currentColor = `rgb(${r},${g},${b})`;
                        idx += 5;
                    } else if (
                        code === 48 &&
                        parts[idx + 1] === 2 &&
                        idx + 4 < parts.length
                    ) {
                        const r = parts[idx + 2];
                        const g = parts[idx + 3];
                        const b = parts[idx + 4];
                        currentBgColor = `rgb(${r},${g},${b})`;
                        idx += 5;
                    } else {
                        if (code >= 30 && code <= 37) {
                            currentColor = getStandardColor(code - 30);
                        } else if (code >= 90 && code <= 97) {
                            currentColor = getBrightColor(code - 90);
                        } else if (code >= 40 && code <= 47) {
                            currentBgColor = getStandardColor(code - 40);
                        } else if (code >= 100 && code <= 107) {
                            currentBgColor = getBrightColor(code - 100);
                        }
                        idx++;
                    }
                }
            }
        }

        lastIndex = ansiRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        let segmentText = text.substring(lastIndex);
        const crIndex = segmentText.lastIndexOf('\r');
        if (crIndex !== -1) {
            segmentText = segmentText.substring(crIndex + 1);
        }
        if (segmentText.length > 0) {
            segments.push({
                text: segmentText,
                color: currentColor,
                backgroundColor: currentBgColor,
            });
        }
    }

    return segments.map((seg, idx) => {
        if (seg.color || seg.backgroundColor) {
            return (
                <span
                    key={idx}
                    style={{
                        color: seg.color,
                        backgroundColor: seg.backgroundColor,
                    }}
                >
                    {seg.text}
                </span>
            );
        }
        return seg.text;
    });
}
