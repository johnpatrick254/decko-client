"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User2Icon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import SignOutButton from "@/components/auth/SignoutButton"
import { useUser } from "@clerk/nextjs"
import { useMemo } from "react"

import { useEffect } from "react"
import { getUserId } from "@/lib/getuserid"
import { syncUser } from "@/lib/utils"

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useUser();

  useEffect(() => {
    const localId = getUserId();
    const userId = user?.id
    if (userId && (localId !== userId)) {
      const sync = async (localId: string, userId: string) => {
        if (userId) {
          await syncUser(localId, userId);
          localStorage.setItem("user_id", userId);
        }
      }
      sync(localId, userId)
    }

  }, [user?.id])

  if (!user) return null

  const userData = {
    name: user.fullName || user.firstName || "User",
    email: user.primaryEmailAddress?.emailAddress || "",
    avatar: user.imageUrl
  }

  return (
    <SidebarMenu key={'side-nav'}>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="rounded-lg"><User2Icon /></AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{userData.name}</span>
            <span className="truncate text-xs">{userData.email}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}