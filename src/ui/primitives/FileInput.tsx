import React from 'react';

export interface FileInputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'hidden'
> {
    ref?: React.Ref<HTMLInputElement>;
}

export const FileInput = ({ ref, ...props }: FileInputProps) => (
    <input hidden ref={ref} type="file" {...props} />
);
