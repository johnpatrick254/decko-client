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
            title: "New York" as Location,
        },
        {
            title: "Fort Lauderdale" as Location,
        },
        {
            title: "Nairobi" as Location,
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
