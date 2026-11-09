import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportsApi } from '@/api/reports/reports.api';
import type { ReportTargetType } from '@/api/reports/reports.api';

export const useMyReports = () =>
    useQuery({ queryKey: ['my-reports'], queryFn: reportsApi.mine });

export const useReportOptions = (targetType: ReportTargetType) =>
    useQuery({
        queryKey: ['report-options', targetType],
        queryFn: () => reportsApi.options(targetType),
    });

export const useSubmitReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reportsApi.create,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['my-reports'] }),
    });
};
