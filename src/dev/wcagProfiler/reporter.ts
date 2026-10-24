import { apiClient } from '@/api/client';
import { hasAuthToken } from '@/utils/authToken';

import type { AxeResults } from './scanner';

export interface ScanReportMeta {
    scanNumber: number;
    route: string;
    theme: string;
    durationMs: number;
}

export class Reporter {
    async report(results: AxeResults, meta: ScanReportMeta): Promise<void> {
        if (!hasAuthToken()) return;

        const issues = results.violations.flatMap((violation) =>
            violation.nodes.map((node) => ({
                ruleId: violation.id.slice(0, 128),
                help: violation.help.slice(0, 1024),
                helpUrl: violation.helpUrl.slice(0, 2048),
                impact: violation.impact,
                target: node.target
                    .slice(0, 32)
                    .map((target) => target.slice(0, 512)),
                html: node.html.trim().slice(0, 8192),
                failureSummary: node.failureSummary?.slice(0, 4096),
            })),
        );
        if (issues.length === 0) return;

        await apiClient.post('/api/v1/_internal/wcag/', {
            ...meta,
            issues: issues.slice(0, 500),
        });
    }
}
