import React, { useRef, useState } from 'react';

export interface WindowProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    icon?: string;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultX?: number;
    defaultY?: number;
    minWidth?: number;
    minHeight?: number;
}

export const Window: React.FC<WindowProps> = ({
    title,
    onClose,
    children,
    icon,
    defaultWidth = 500,
    defaultHeight = 400,
    defaultX = 50,
    defaultY = 50,
    minWidth = 300,
    minHeight = 200,
}) => {
    const [position, setPosition] = useState({ x: defaultX, y: defaultY });
    const [size, setSize] = useState({
        width: defaultWidth,
        height: defaultHeight,
    });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const isResizing = useRef<string | null>(null);
    const resizeStart = useRef({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        posX: 0,
        posY: 0,
    });

    const handlePointerDown = (e: React.PointerEvent): void => {
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent): void => {
        if (!isDragging.current) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        });
    };

    const handlePointerUp = (e: React.PointerEvent): void => {
        isDragging.current = false;
        isResizing.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleResizeDown = (e: React.PointerEvent, dir: string): void => {
        e.stopPropagation();
        isResizing.current = dir;
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e: React.PointerEvent): void => {
        if (!isResizing.current) return;
        const dir = isResizing.current;
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = resizeStart.current.posX;
        let newY = resizeStart.current.posY;

        if (dir.includes('e')) {
            newWidth = Math.max(minWidth, resizeStart.current.width + dx);
        }
        if (dir.includes('s')) {
            newHeight = Math.max(minHeight, resizeStart.current.height + dy);
        }
        if (dir.includes('w')) {
            const w = resizeStart.current.width - dx;
            if (w >= minWidth) {
                newWidth = w;
                newX = resizeStart.current.posX + dx;
            }
        }
        if (dir.includes('n')) {
            const h = resizeStart.current.height - dy;
            if (h >= minHeight) {
                newHeight = h;
                newY = resizeStart.current.posY + dy;
            }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
    };

    const resizeHandles = [
        {
            dir: 'n',
            style: { top: 0, left: 4, right: 4, height: 4, cursor: 'n-resize' },
        },
        {
            dir: 's',
            style: {
                bottom: 0,
                left: 4,
                right: 4,
                height: 4,
                cursor: 's-resize',
            },
        },
        {
            dir: 'w',
            style: { top: 4, bottom: 4, left: 0, width: 4, cursor: 'w-resize' },
        },
        {
            dir: 'e',
            style: {
                top: 4,
                bottom: 4,
                right: 0,
                width: 4,
                cursor: 'e-resize',
            },
        },
        {
            dir: 'nw',
            style: {
                top: 0,
                left: 0,
                width: 4,
                height: 4,
                cursor: 'nw-resize',
            },
        },
        {
            dir: 'ne',
            style: {
                top: 0,
                right: 0,
                width: 4,
                height: 4,
                cursor: 'ne-resize',
            },
        },
        {
            dir: 'sw',
            style: {
                bottom: 0,
                left: 0,
                width: 4,
                height: 4,
                cursor: 'sw-resize',
            },
        },
        {
            dir: 'se',
            style: {
                bottom: 0,
                right: 0,
                width: 4,
                height: 4,
                cursor: 'se-resize',
            },
        },
    ];

    return (
        <div
            className="fixed z-top flex flex-col text-black"
            style={{
                fontFamily: "'MS Sans Serif', Tahoma, sans-serif",
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                minWidth,
                minHeight,
                overflow: 'hidden',
                backgroundColor: '#c0c0c0',
                borderTop: '2px solid #dfdfdf',
                borderLeft: '2px solid #dfdfdf',
                borderRight: '2px solid #000000',
                borderBottom: '2px solid #000000',
                boxShadow: 'inset 1px 1px #ffffff, inset -1px -1px #808080',
                padding: '2px',
            }}
        >
            {resizeHandles.map((handle) => (
                <div
                    key={handle.dir}
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        ...handle.style,
                    }}
                    onPointerCancel={handlePointerUp}
                    onPointerDown={(e) => handleResizeDown(e, handle.dir)}
                    onPointerMove={handleResizeMove}
                    onPointerUp={handlePointerUp}
                />
            ))}

            <div
                className="flex cursor-move items-center justify-between px-1 py-0.5 select-none"
                style={{
                    backgroundColor: '#0000aa',
                    color: '#ffffff',
                    fontWeight: 'bold',
                }}
                onPointerCancel={handlePointerUp}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <span className="flex items-center gap-1 truncate text-[11px] leading-tight tracking-wide">
                    {icon && (
                        <img
                            alt=""
                            className="mr-0.5 h-4 w-4 shrink-0"
                            src={icon}
                        />
                    )}
                    {title}
                </span>

                {/* Close Button */}
                <button
                    className="flex h-[14px] w-[16px] items-center justify-center bg-[#c0c0c0] font-bold text-black active:pt-[1px] active:pl-[1px]"
                    style={{
                        borderTop: '1px solid #dfdfdf',
                        borderLeft: '1px solid #dfdfdf',
                        borderRight: '1px solid #000000',
                        borderBottom: '1px solid #000000',
                        boxShadow:
                            'inset 1px 1px #ffffff, inset -1px -1px #808080',
                    }}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <img
                        alt="X"
                        className="h-[11px] w-[10px]"
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAALCAYAAABGbhwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoyNUYxQUZDNTZDMzlFODExOTVEN0VBQjVBRkRGRjgwNSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowRjM1MzA3QTM5NkUxMUU4QkI2ODk1NUE4MzQwMTEyQyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowRjM1MzA3OTM5NkUxMUU4QkI2ODk1NUE4MzQwMTEyQyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjI1RjFBRkM1NkMzOUU4MTE5NUQ3RUFCNUFGREZGODA1IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjI1RjFBRkM1NkMzOUU4MTE5NUQ3RUFCNUFGREZGODA1Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+SHg7twAAAFFJREFUeNpi/P//PwMxgImBSABWyMjI+B+E0SWRxcEKgdYzwiSQFSHLwa1GVgxV9BkmBhZH9wy6SVg9g81qDIXIJmFzMxMu69AVM1I9wAECDAAQQDQKXD6G0wAAAABJRU5ErkJggg=="
                    />
                </button>
            </div>

            {/* Content Area */}
            <div
                className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white text-black"
                style={{
                    borderTop: '1px solid #808080',
                    borderLeft: '1px solid #808080',
                    borderRight: '1px solid #ffffff',
                    borderBottom: '1px solid #ffffff',
                    boxShadow: 'inset 1px 1px #000000, inset -1px -1px #dfdfdf',
                }}
            >
                {children}
            </div>
        </div>
    );
};
