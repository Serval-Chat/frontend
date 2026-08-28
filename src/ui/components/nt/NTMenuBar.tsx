import React, { useEffect, useRef, useState } from 'react';

export interface NTMenuItem {
    label: string;
    onSelect: () => void;
}

export interface NTMenuDefinition {
    label: string;
    items: NTMenuItem[];
}

export interface NTMenuBarProps {
    menus: NTMenuDefinition[];
}

const renderMnemonicLabel = (label: string): React.ReactNode => {
    const ampIndex = label.indexOf('&');
    if (ampIndex === -1 || ampIndex === label.length - 1) return label;

    return (
        <>
            {label.slice(0, ampIndex)}
            <span className="underline">{label[ampIndex + 1]}</span>
            {label.slice(ampIndex + 2)}
        </>
    );
};

export const NTMenuBar = ({ menus }: NTMenuBarProps): React.ReactNode => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect((): (() => void) | undefined => {
        if (!openMenu) return;

        const handlePointerDown = (e: PointerEvent): void => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpenMenu(null);
            }
        };
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') setOpenMenu(null);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return (): void => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openMenu]);

    return (
        <div ref={containerRef}>
            <div
                className="relative flex h-5 items-stretch text-[11px] leading-[13px] select-none"
                style={{ backgroundColor: '#c0c0c0' }}
            >
                {menus.map((menu) => {
                    const isOpen = openMenu === menu.label;
                    return (
                        <div className="relative" key={menu.label}>
                            <button
                                className="flex h-full items-center px-2 text-black"
                                style={
                                    isOpen
                                        ? {
                                              backgroundColor: '#000080',
                                              color: '#ffffff',
                                          }
                                        : undefined
                                }
                                type="button"
                                onClick={(): void => {
                                    setOpenMenu((current): string | null =>
                                        current === menu.label
                                            ? null
                                            : menu.label,
                                    );
                                }}
                                onPointerEnter={(): void => {
                                    setOpenMenu((current): string | null =>
                                        current ? menu.label : current,
                                    );
                                }}
                            >
                                {renderMnemonicLabel(menu.label)}
                            </button>

                            {isOpen ? (
                                <div
                                    className="absolute top-full left-0 z-10 min-w-[160px] py-0.5"
                                    style={{
                                        backgroundColor: '#c0c0c0',
                                        borderTop: '1px solid #ffffff',
                                        borderLeft: '1px solid #ffffff',
                                        borderRight: '1px solid #000000',
                                        borderBottom: '1px solid #000000',
                                        boxShadow:
                                            'inset 1px 1px #dfdfdf, inset -1px -1px #808080, 2px 2px 4px rgba(0,0,0,0.4)',
                                    }}
                                >
                                    {menu.items.map((item) => (
                                        <button
                                            className="flex h-[17px] w-full items-center pr-4 pl-6 text-left text-black hover:bg-[#000080] hover:text-white"
                                            key={item.label}
                                            type="button"
                                            onClick={(): void => {
                                                setOpenMenu(null);
                                                item.onSelect();
                                            }}
                                        >
                                            {renderMnemonicLabel(item.label)}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
            <div style={{ backgroundColor: '#808080', height: 1 }} />
            <div style={{ backgroundColor: '#ffffff', height: 1 }} />
        </div>
    );
};
