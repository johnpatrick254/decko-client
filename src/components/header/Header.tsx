import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import City from './City';

function Header() {
  return (
    <div className='absolute top-0 w-full flex justify-between items-start pt-5 px-5 bg-background'>
      <SidebarTrigger className="-ml-1 z-50 ring-1 ring-primary backdrop-blur-md" />
      <City/>
    </div>
  )
}

export default Header