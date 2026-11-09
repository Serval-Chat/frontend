import { type CSSProperties, useReducer } from 'react';

import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';

import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { mergeReducer } from '@/utils/mergeReducer';

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const navBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--foreground)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '0 6px',
};

const spinBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--muted-foreground)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    lineHeight: 1,
    padding: '0 5px',
    userSelect: 'none',
};

const calendarDayButtonStyle: CSSProperties = {
    padding: '4px 0',
    borderRadius: 4,
    border: 'none',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textAlign: 'center',
};

const confirmDateButtonStyle: CSSProperties = {
    marginTop: 10,
    width: '100%',
    padding: '5px 0',
    borderRadius: 4,
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: 600,
};

function TimeSpinner({
    value,
    max,
    label,
    onChange,
}: {
    value: number;
    max: number;
    label: string;
    onChange: (n: number) => void;
}) {
    const dec = () => {
        onChange(value <= 0 ? max : value - 1);
    };
    const inc = () => {
        onChange(value >= max ? 0 : value + 1);
    };
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
            }}
        >
            <Pressable
                aria-label={`Decrease ${label}`}
                style={spinBtnStyle}
                onClick={dec}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                <Minus size={12} />
            </Pressable>
            <Text
                style={{
                    width: 22,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--foreground)',
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {String(value).padStart(2, '0')}
            </Text>
            <Pressable
                aria-label={`Increase ${label}`}
                style={spinBtnStyle}
                onClick={inc}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                <Plus size={12} />
            </Pressable>
        </div>
    );
}

export function DateTimePicker({
    onConfirm,
}: {
    onConfirm: (iso: string) => void;
}) {
    interface PickerState {
        viewYear: number;
        viewMonth: number;
        selDay: number | null;
        hour: number;
        minute: number;
        second: number;
    }
    const [picker, patchPicker] = useReducer(mergeReducer<PickerState>, {
        viewYear: new Date().getFullYear(),
        viewMonth: new Date().getMonth(),
        selDay: null,
        hour: 0,
        minute: 0,
        second: 0,
    });
    const { viewYear, viewMonth, selDay, hour, minute, second } = picker;
    const setViewYear = (v: number | ((p: number) => number)): void => {
        patchPicker(
            typeof v === 'function'
                ? (s): Partial<PickerState> => ({ viewYear: v(s.viewYear) })
                : { viewYear: v },
        );
    };
    const setViewMonth = (v: number | ((p: number) => number)): void => {
        patchPicker(
            typeof v === 'function'
                ? (s): Partial<PickerState> => ({ viewMonth: v(s.viewMonth) })
                : { viewMonth: v },
        );
    };
    const setSelDay = (v: number | null): void => {
        patchPicker({ selDay: v });
    };
    const setHour = (v: number): void => {
        patchPicker({ hour: v });
    };
    const setMinute = (v: number): void => {
        patchPicker({ minute: v });
    };
    const setSecond = (v: number): void => {
        patchPicker({ second: v });
    };

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else setViewMonth((m) => m + 1);
    };

    const handleConfirm = () => {
        if (selDay === null) return;
        const pad = (n: number) => String(n).padStart(2, '0');
        onConfirm(
            `${viewYear}-${pad(viewMonth + 1)}-${pad(selDay)}T${pad(hour)}:${pad(minute)}:${pad(second)}`,
        );
    };

    return (
        <div style={{ padding: '10px 12px', minWidth: 228 }}>
            {/* month / year header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                }}
            >
                <Pressable
                    aria-label="Previous month"
                    style={navBtnStyle}
                    onClick={prevMonth}
                    onMouseDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <ChevronLeft size={14} />
                </Pressable>
                <Text
                    style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--foreground)',
                    }}
                >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <Pressable
                    aria-label="Next month"
                    style={navBtnStyle}
                    onClick={nextMonth}
                    onMouseDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <ChevronRight size={14} />
                </Pressable>
            </div>

            {/* day-of-week labels */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                    marginBottom: 2,
                }}
            >
                {DAY_NAMES.map((d) => (
                    <Text
                        key={d}
                        style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)',
                            padding: '2px 0',
                        }}
                    >
                        {d}
                    </Text>
                ))}
            </div>

            {/* calendar grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                }}
            >
                {['gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6']
                    .slice(0, firstDow)
                    .map((key) => (
                        <span key={key} />
                    ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (d) => {
                        const sel = d === selDay;
                        return (
                            <Pressable
                                key={d}
                                style={{
                                    ...calendarDayButtonStyle,
                                    background: sel
                                        ? 'var(--primary)'
                                        : 'transparent',
                                    color: sel ? '#fff' : 'var(--foreground)',
                                }}
                                onClick={() => {
                                    setSelDay(d);
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onMouseEnter={(e) => {
                                    if (!sel)
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background = 'var(--bg-subtle)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!sel)
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.background = 'transparent';
                                }}
                            >
                                {d}
                            </Pressable>
                        );
                    },
                )}
            </div>

            {/* time row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 10,
                }}
            >
                <Text
                    style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted-foreground)',
                        marginRight: 2,
                    }}
                >
                    Time
                </Text>
                <TimeSpinner
                    label="hour"
                    max={23}
                    value={hour}
                    onChange={setHour}
                />
                <Text style={{ color: 'var(--muted-foreground)' }}>:</Text>
                <TimeSpinner
                    label="minute"
                    max={59}
                    value={minute}
                    onChange={setMinute}
                />
                <Text style={{ color: 'var(--muted-foreground)' }}>:</Text>
                <TimeSpinner
                    label="second"
                    max={59}
                    value={second}
                    onChange={setSecond}
                />
            </div>

            {/* confirm */}
            <Pressable
                disabled={selDay === null}
                style={{
                    ...confirmDateButtonStyle,
                    background:
                        selDay === null ? 'var(--bg-subtle)' : 'var(--primary)',
                    color: selDay === null ? 'var(--muted-foreground)' : '#fff',
                    cursor: selDay === null ? 'default' : 'pointer',
                }}
                onClick={handleConfirm}
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
            >
                Apply
            </Pressable>
        </div>
    );
}
