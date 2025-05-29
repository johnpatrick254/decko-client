"use client"

import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Location } from "@/provider/settingsprovider"
import { useEventQueue } from "@/provider/eventsqueue"

export function NavMain({
  items,
}: {
  items: {
    title: Location,
    coords: number[]
  }[]
}) {

  const { toggleSidebar, open } = useSidebar();
  const { setFilter } = useEventQueue();
  const isMobile = useIsMobile()
  const handleNavMenuClick = (item: {
    title: Location,
    coords: number[]
  }) => {
    setFilter({
      coordinates: item.coords,
      displayName: item.title
    });
    if (isMobile) {
      toggleSidebar();
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[0.7rem] uppercase tracking-wider text-gray-600">select city</SidebarGroupLabel>
      <SidebarMenu className="pl-1.5 pt-2" key={'dash-sidebar'}>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton onClick={() => handleNavMenuClick(item)} tooltip={item.title} className={cn("flex items-center gap-4 rounded px-4 py-2 font-medium transition-all",
              (!open ) && "relative right-2 hidden"
            )}>
              <span >{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
