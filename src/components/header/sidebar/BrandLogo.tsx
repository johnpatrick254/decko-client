"use client"

import * as React from "react"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar"
import Image from "next/image"
import logo from "../../../../public/icon.png"
import Link from "next/link"

export function BrandLogo() {
    const {toggleSidebar ,open} = useSidebar();
    const handleClick =()=>{
        if(open){
            toggleSidebar();
        }
    }

    return (
        <SidebarMenu key="brand-side">
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mt-2"
                >
                   <Link onClick={handleClick} href={'/'} className="flex items-center gap-1">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg  text-sidebar-primary-foreground">
                            <div className="flex w-7 overflow-hidden h-7 ">
                                <Image
                                    src={logo}
                                    alt="logo"
                                    className="w-full h-full object-contain  size-4"
                                    priority

                                />
                            </div>
                        </div>
                        <div className="grid flex-1 text-left text-2xl leading-tight">
                            <span className="truncate font-semibold" id="logo-text">
                                Decko
                            </span>
                            {/* <span className="truncate text-xs">Trial</span> */}
                        </div>
                   </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
