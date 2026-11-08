interface VerticalSpacerProps {
    verticalSpace: number;
}

export const VerticalSpacer = ({ verticalSpace }: VerticalSpacerProps) => (
    <div style={{ height: `${verticalSpace}px`, flexShrink: 0 }} />
);
