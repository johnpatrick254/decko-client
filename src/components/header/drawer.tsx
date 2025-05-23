"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarHeartIcon } from 'lucide-react';
import { useEventsCounterContext } from "@/provider/eventcounterprovider";
import { useDrawer } from '@/provider/drawerprovider';
import { TimeFilterTabs } from './timefiltertabs';

const CATEGORY_ICONS: any = {
    events: CalendarHeartIcon
};

type ProgressBadgeProps = {
    category: string,
    count: number,
    maxCount: number,
    color: string,
    active: boolean,
    onClick: () => void
}

const ProgressBadge = ({
    category = 'events',
    count = 0,
    maxCount = 10,
    color = '#1e9b79',
    active = false,
    onClick
}: ProgressBadgeProps) => {
    const size = active ? 'md' : 'sm';
    const progress = Math.min(count / maxCount, 1);
    const IconComponent = CATEGORY_ICONS[category];
    const sizeClasses = {
        sm: {
            wrapper: 'w-10 h-10',
            icon: 'w-5 h-5',
            badge: 'w-5 h-5 text-xs',
            badgePosition: '-top-0 -right-1'
        },
        md: {
            wrapper: 'w-12 h-12',
            icon: 'w-5 h-5',
            badge: 'w-6 h-6 text-sm',
            badgePosition: '-top-0 -right-1'
        }
    };

    const classes = sizeClasses[size] || sizeClasses.md;

    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div
            className="flex flex-col items-center justify-center transition-all ease-in-out cursor-pointer"
            onClick={onClick}
        >
            <div className={`relative ${classes.wrapper}`}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={`${color}40`}
                        strokeWidth={strokeWidth}
                        className="transition-all duration-300"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={`${color}90`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300"
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                    />
                </svg>
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color }}
                >
                    <div className="flex items-center justify-center p-1" style={{
                        borderRadius: '50%',
                        backgroundColor: `${color}10`
                    }}>
                        <IconComponent className={classes.icon} />
                    </div>
                </div>
                <div
                    className={`absolute ${classes.badgePosition} ${classes.badge} flex items-center justify-center rounded-full text-xs font-bold p-1.5`}
                    style={{ backgroundColor: color, color: 'white' }}
                >
                    {count}
                </div>
            </div>
            <span className="mt-2 text- text-primary font-bold text-xs capitalize">
                {category}
            </span>
        </div>
    );
};

export default function DrawerComponent() {
    const router = useRouter();
    const pathname = usePathname();
    const { count: eventCount } = useEventsCounterContext();
    const EVENTS_MAX_COUNT_KEY = 'events_total_count';
    const LAST_RESET_DATE_KEY = 'counts_last_reset_date';

    const eventsLocalStorage = typeof localStorage !== 'undefined' && localStorage.getItem(EVENTS_MAX_COUNT_KEY);
    const eventsMaxCount = typeof localStorage !== 'undefined' ? (eventsLocalStorage !== null ? eventsLocalStorage : eventCount) : eventCount;


    const categories = [
        { name: 'events', count: eventCount, maxCount: +eventsMaxCount, color: '#e84393', path: '/' },
    ];

    const handleBadgeClick = (path: string) => {
        router.push(path)
    };

    const checkAndResetCounts = () => {
        const lastResetDate = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_RESET_DATE_KEY) : new Date().toDateString();
        const currentDate = new Date().toDateString();
        const eventsMaxCount = typeof localStorage !== 'undefined' ? eventsLocalStorage : null;

        if (!eventsMaxCount || !lastResetDate || (lastResetDate !== currentDate)) {
            typeof localStorage !== 'undefined' && localStorage.setItem(EVENTS_MAX_COUNT_KEY, `${eventCount}`);
            typeof localStorage !== 'undefined' && localStorage.setItem(LAST_RESET_DATE_KEY, currentDate);
        }
    }

    if (eventCount) {
        checkAndResetCounts()
    }
    return (
        <div className="py-4 transition ease-linear duration-300 z-50 flex flex-col gap-4 justify-center items-center bg-background">
            <div className="flex gap-2 justify-center items-start">
                {categories.map((category) => (
                    <ProgressBadge
                        key={category.name}
                        category={category.name}
                        count={category.count}
                        maxCount={category.maxCount}
                        color={category.color}
                        active={category.path === pathname}
                        onClick={() => handleBadgeClick(category.path)}
                    />
                ))}
            </div>
            <TimeFilterTabs />
        </div>
    );
}