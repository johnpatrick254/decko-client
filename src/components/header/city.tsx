'use client'
import React from 'react';
import { useSidebar } from '../ui/sidebar';
import { useSettings } from '@/provider/settingsprovider';

function City() {
    const { toggleSidebar } = useSidebar()
    const {location:city} = useSettings()
    return (
        <button onClick={toggleSidebar} className="cursor-pointer w-max text-primary bg-primary-foreground font-semibold px-3 py-1.5 rounded-sm shadow-md hover border-b hover:shadow-sm transition-all duration-500">
           {city}
        </button>
    )
}

export default City