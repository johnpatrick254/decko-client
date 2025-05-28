'use client'
import React from 'react';
import { useSidebar } from '../ui/sidebar';
import { useSettings } from '@/provider/settingsprovider';
import { useEventFilter } from '@/provider/eventfilterprovider';

function City() {
    const { toggleSidebar } = useSidebar()
    const {searchLocation} = useEventFilter()
    return (
        <button onClick={toggleSidebar} className="cursor-pointer w-max text-primary bg-primary-foreground font-semibold px-3 py-1.5 rounded-sm shadow-md hover border-b hover:shadow-sm transition-all duration-500">
            {searchLocation.displayName}
        </button>
    )
}

export default City