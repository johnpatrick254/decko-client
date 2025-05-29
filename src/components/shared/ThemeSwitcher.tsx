"use client"

import * as React from "react"
import { Moon, Settings2Icon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { SidebarMenuButton } from "../ui/sidebar"
import { Label } from "../ui/label"
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "../ui/select"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <SidebarMenuButton key='theme' tooltip={'theme'} className="flex items-center justify-between  gap-4 rounded px-4 py-2 font-medium transition-all">
        <Label htmlFor="theme-switcher" className="text-nowrap flex items-center">
          <span>
            Theme
          </span>
        </Label>
        <Select
          value={theme}
          defaultValue={'system'}
          onValueChange={(value) => setTheme(value as 'dark' | 'light' | 'system')}
        >
          <SelectTrigger id="theme-switcher" className="w-max !bg-transparent shadow-none !ring-0 outline-none border-none px-0 gap-1.5">
          {theme == 'system' && <Settings2Icon className="h-4 w-5 " />}
          {theme == 'light' && <Sun className="h-4 w-5 " />}
          {theme == 'dark' && <Moon className="h-4 w-5 " />}
            <SelectValue
              defaultValue={theme}
              placeholder="Select theme" className="mr-1.5" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <span >System</span>
            </SelectItem>
            <SelectItem value="light">
              <span >Light</span>
            </SelectItem>
            <SelectItem value="dark">
              <span>Dark</span>
            </SelectItem>
          </SelectContent>
        </Select>
    </SidebarMenuButton>
  )
}
