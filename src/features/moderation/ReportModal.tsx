import { type CSSProperties, type ReactNode, useState } from 'react';

import type { ReportReason, ReportTargetType } from '@/api/reports/reports.api';
import {
    useReportOptions,
    useSubmitReport,
} from '@/features/moderation/hooks/useReports';
import { Button } from '@/ui/primitives/Button';
import { Modal } from '@/ui/primitives/Modal';
import { Select } from '@/ui/primitives/Select';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';

import { ReportIdCopy } from './ReportIdCopy';

export const ReportModal = ({
    isOpen,
    onClose,
    targetType,
    targetId,
    zIndex,
}: {
    isOpen: boolean;
    onClose: () => void;
    targetType: ReportTargetType;
    targetId: string;
    zIndex?: CSSProperties['zIndex'];
}): ReactNode => {
    const [selectedReason, setSelectedReason] = useState<ReportReason>('');
    const [selectedSubReason, setSelectedSubReason] = useState('');
    const [details, setDetails] = useState('');
    const [submittedReportId, setSubmittedReportId] = useState<string | null>(
        null,
    );
    const {
        data: reasons = [],
        isLoading: isLoadingReasons,
        isError: isReasonLoadError,
    } = useReportOptions(targetType);
    const submit = useSubmitReport();
    const reason = reasons.some((option) => option.id === selectedReason)
        ? selectedReason
        : (reasons[0]?.id ?? '');
    const selectedOption = reasons.find((option) => option.id === reason);
    const subcategories = selectedOption?.subcategories ?? [];
    const subReason = subcategories.some(
        (option) => option.id === selectedSubReason,
    )
        ? selectedSubReason
        : '';
    const handleSubmit = (): void => {
        submit.mutate(
            {
                targetType,
                targetId,
                reason,
                ...(subReason ? { subReason } : {}),
                details: details.trim() || undefined,
            },
            { onSuccess: (report): void => setSubmittedReportId(report.id) },
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            title={
                submittedReportId ? 'Report received' : `Report ${targetType}`
            }
            zIndex={zIndex}
            onClose={onClose}
        >
            {submittedReportId ? (
                <div className="flex flex-col gap-4">
                    <Text as="p" size="sm">
                        Your report has been submitted to platform staff for
                        review. Thank you for helping keep Serchat safe.
                    </Text>
                    <Text as="p" size="sm" variant="muted">
                        You can check its status later in Settings under My
                        Reports.
                    </Text>
                    <ReportIdCopy id={submittedReportId} />
                    <div className="flex justify-end">
                        <Button variant="primary" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <Text as="p" size="sm" variant="muted">
                        Reports are reviewed by platform staff. Please provide
                        enough context to help us review it.
                    </Text>
                    <Text as="label" className="flex flex-col gap-2 text-sm">
                        Reason
                        <Select
                            disabled={
                                isLoadingReasons ||
                                isReasonLoadError ||
                                reasons.length === 0
                            }
                            value={reason}
                            variant="secondary"
                            onChange={(event): void => {
                                setSelectedReason(
                                    event.target.value as ReportReason,
                                );
                                setSelectedSubReason('');
                            }}
                        >
                            {reasons.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                            {isLoadingReasons ? (
                                <option value="">
                                    Loading report reasons…
                                </option>
                            ) : null}
                        </Select>
                    </Text>
                    {subcategories.length > 0 ? (
                        <Text
                            as="label"
                            className="flex flex-col gap-2 text-sm"
                        >
                            Subcategory (optional)
                            <Select
                                value={subReason}
                                variant="secondary"
                                onChange={(event): void =>
                                    setSelectedSubReason(event.target.value)
                                }
                            >
                                <option value="">No subcategory</option>
                                {subcategories.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </Text>
                    ) : null}
                    {isReasonLoadError ? (
                        <Text as="p" size="sm" variant="danger">
                            Could not load report reasons. Please try again.
                        </Text>
                    ) : reasons.length === 0 && !isLoadingReasons ? (
                        <Text as="p" size="sm" variant="danger">
                            Reporting is temporarily unavailable because no
                            reasons are configured.
                        </Text>
                    ) : null}
                    <Text as="label" className="flex flex-col gap-2 text-sm">
                        Details (optional)
                        <TextArea
                            className="rounded-lg bg-bg-secondary"
                            maxLength={1000}
                            textareaClassName="min-h-24"
                            value={details}
                            onChange={(event): void =>
                                setDetails(event.target.value)
                            }
                        />
                    </Text>
                    {submit.isError ? (
                        <Text as="p" size="sm" variant="danger">
                            Could not submit this report. Please try again.
                        </Text>
                    ) : null}
                    <div className="flex justify-end gap-2">
                        <Button variant="normal" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                submit.isPending ||
                                !reason ||
                                reasons.length === 0 ||
                                isReasonLoadError
                            }
                            variant="primary"
                            onClick={handleSubmit}
                        >
                            {submit.isPending ? 'Submitting…' : 'Submit report'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
