import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportsApi } from '@/api/reports/reports.api';
import type {
    AdminReportReasonOption,
    AdminReportReasonOptionDeletions,
    AdminReportReasonOptionInput,
    ReportStatus,
} from '@/api/reports/reports.api';

export const useAdminReportOptions = () =>
    useQuery({
        queryKey: ['admin-report-options'],
        queryFn: reportsApi.adminOptions,
    });

export const useUpdateAdminReportOptions = () => {
    const queryClient = useQueryClient();
    const cacheOptions = (options: AdminReportReasonOption[]): void => {
        queryClient.setQueryData(['admin-report-options'], options);
        void queryClient.invalidateQueries({ queryKey: ['report-options'] });
    };
    const update = useMutation({
        mutationFn: (options: AdminReportReasonOptionInput[]) =>
            reportsApi.updateOptions(options),
        onSuccess: cacheOptions,
    });
    const updateWithDeletions = useMutation({
        mutationFn: ({
            options,
            ...deletions
        }: {
            options: AdminReportReasonOptionInput[];
        } & AdminReportReasonOptionDeletions) =>
            reportsApi.updateOptions(options, deletions),
        onSuccess: cacheOptions,
    });

    return {
        ...update,
        isError: update.isError || updateWithDeletions.isError,
        isPending: update.isPending || updateWithDeletions.isPending,
        mutateWithDeletions: updateWithDeletions.mutate,
    };
};

export const useAdminReports = (
    status?: ReportStatus,
    offset = 0,
    reportId?: string,
) =>
    useQuery({
        queryKey: ['admin-reports', 'v4', status, offset, reportId],
        queryFn: () =>
            reportsApi.staffList({ status, reportId, limit: 100, offset }),
    });

export const useUpdateAdminReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            status,
            internalNote,
        }: {
            id: string;
            status: ReportStatus;
            internalNote?: string;
        }) => reportsApi.update(id, { status, internalNote }),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
    });
};
