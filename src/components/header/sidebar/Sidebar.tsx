"use client"
import * as React from "react"
import {
    SidebarContent,
    Sidebar,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { BrandLogo } from "./BrandLogo";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { NavMain } from "./nav-main";
import { SignInButton } from "@/components/auth/SignInButton";
import { NavUser } from "./nav-user";
import { Settings } from "./settings";
import SignOutButton from "@/components/auth/SignoutButton";
import { Location } from "@/provider/settingsprovider";
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [

        {
            title: "Fort Lauderdale" as Location,
            coords:[
                26.122438,
                -80.137314
            ]
        },
        {
            title: "Nairobi" as Location,
            coords:[
                -1.286389,
                36.817223
            ]
        }, 
        {
            title: "San Francisco" as Location,
            coords:[
                37.773972,
                -122.431297
            ]
        }
    ]
}

export function SideBar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { open, isMobile } = useSidebar();
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <BrandLogo />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="py-8 space-y-2">
                {
                    (open || isMobile)
                    &&
                    <SidebarGroup className="mt-auto" key={'dash-settings'}>
                        <SidebarMenu className="pl-1.5 pt-2" >
                            <SidebarGroupLabel className="text-[0.7rem] uppercase tracking-wider text-gray-600">Settings</SidebarGroupLabel>
                            <Settings />
                        </SidebarMenu>
                    </SidebarGroup>
                }
                <SignedOut>
                    <SignInButton />
                </SignedOut>
                <SignedIn>
                    <NavUser />
                    <SignOutButton />
                </SignedIn>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
