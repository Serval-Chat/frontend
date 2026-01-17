import { Box } from '@/ui/components/layout/Box';

interface VerticalSpacerProps {
    verticalSpace: number;
}

/**
 * @description Vertical spacer. Adds pixels between components
 */
export const VerticalSpacer: React.FC<VerticalSpacerProps> = ({
    verticalSpace,
}) => <Box className="shrink-0" style={{ height: `${verticalSpace}px` }} />;
