import React, { useState } from 'react';

import { ChevronDown } from 'lucide-react';

import type { Category, Channel } from '@/api/servers/servers.types';

import { ChannelItem } from './ChannelItem';

interface ChannelListProps {
    channels: Channel[];
    categories: Category[];
    selectedChannelId: string | null;
    onChannelSelect: (channelId: string) => void;
}

/**
 * @description Renders a list of channels grouped by categories.
 */
export const ChannelList: React.FC<ChannelListProps> = ({
    channels,
    categories,
    selectedChannelId,
    onChannelSelect,
}) => {
    // Sort items by position
    const sortedCategories = [...categories].sort(
        (a, b) => a.position - b.position
    );
    const sortedChannels = [...channels].sort(
        (a, b) => a.position - b.position
    );

    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
        new Set()
    );

    const toggleCategory = (categoryId: string) => {
        setCollapsedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    // Group channels by categoryId
    const channelsByCategory = sortedChannels.reduce(
        (acc, channel) => {
            const catId = channel.categoryId || 'uncategorized';
            if (!acc[catId]) acc[catId] = [];
            acc[catId].push(channel);
            return acc;
        },
        {} as Record<string, Channel[]>
    );

    return (
        <div className="flex flex-col px-2 space-y-4 py-4">
            {/* Uncategorized channels first */}
            <div className="space-y-0.5">
                {channelsByCategory['uncategorized']?.map((channel) => (
                    <ChannelItem
                        key={channel._id}
                        name={channel.name}
                        type={channel.type}
                        icon={channel.icon}
                        isActive={selectedChannelId === channel._id}
                        onClick={() => onChannelSelect(channel._id)}
                    />
                ))}
            </div>

            {sortedCategories.map((category) => {
                const isCollapsed = collapsedCategories.has(category._id);

                return (
                    <div key={category._id} className="space-y-1">
                        <div
                            className="flex items-center px-1 group cursor-pointer"
                            onClick={() => toggleCategory(category._id)}
                        >
                            <ChevronDown
                                className={`w-3 h-3 mr-0.5 text-foreground-muted transition-transform duration-200 ${
                                    isCollapsed ? '-rotate-90' : ''
                                }`}
                            />
                            <span className="text-[12px] font-bold text-foreground-muted uppercase tracking-wider group-hover:text-foreground/80 transition-colors">
                                {category.name}
                            </span>
                        </div>
                        {!isCollapsed && (
                            <div className="space-y-0.5">
                                {channelsByCategory[category._id]?.map(
                                    (channel) => (
                                        <ChannelItem
                                            key={channel._id}
                                            name={channel.name}
                                            type={channel.type}
                                            icon={channel.icon}
                                            isActive={
                                                selectedChannelId ===
                                                channel._id
                                            }
                                            onClick={() =>
                                                onChannelSelect(channel._id)
                                            }
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
