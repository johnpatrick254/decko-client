"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaxDaysOld } from '@/provider/maxDaysOldProvider';
import { useEventQueue } from '@/provider/eventsqueue';
import { useEventFilter } from '@/provider/eventfilterprovider';

export function TimeFilterTabs() {
  const { maxDaysOld, setMaxDaysOld } = useMaxDaysOld();
  const { resetQueue } = useEventQueue();
  const { searchLocation } = useEventFilter();

  // Convert maxDaysOld to a tab value
  const getTabValue = (days: number): string => {
    switch (days) {
      case 7:
        return 'this-week';
      case 14:
        return 'next-week';
      case 30:
        return 'this-month';
      default:
        return 'this-week'; // Default to this week
    }
  };

  // Convert tab value to maxDaysOld
  const getDaysFromTab = (tab: string): number => {
    switch (tab) {
      case 'this-week':
        return 7;
      case 'next-week':
        return 14;
      case 'this-month':
        return 30;
      default:
        return 7; // Default to 7 days
    }
  };

  const handleTabChange = (value: string) => {
    setMaxDaysOld(getDaysFromTab(value));
    resetQueue(searchLocation,getDaysFromTab(value));
  };

  return (
     <div className="w-full px-4 max-w-md">
      <Tabs
        defaultValue={getTabValue(maxDaysOld)}
        value={getTabValue(maxDaysOld)}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="this-week" className="text-xs">This Week</TabsTrigger>
          <TabsTrigger value="next-week" className="text-xs">Next Week</TabsTrigger>
          <TabsTrigger value="this-month" className="text-xs">This Month</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
