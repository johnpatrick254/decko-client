"use client"
import React from 'react'
import { Button } from '../ui/button';
import { useEventsCounterContext } from '@/provider/eventcounterprovider';

function UnreadCounter() {
  const { count: eventCount } = useEventsCounterContext();

  const currentCount = eventCount;

  return (
    <Button variant={'outline'} className='p-2 h-10 shadow-md w-10 text-sm rounded-full z-50 border border-gray-400   ease-in-out'>
      {currentCount}
    </Button>
  )
}

export default UnreadCounter