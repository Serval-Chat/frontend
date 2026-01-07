import React from 'react';

interface VerticalSpacerProps {
    verticalSpace: number;
}

/**
 * @description Vertical spacer. Adds pixels between components
 */
export const VerticalSpacer: React.FC<VerticalSpacerProps> = ({
    verticalSpace,
}) => {
    return <div style={{ height: `${verticalSpace}px` }} />;
};
