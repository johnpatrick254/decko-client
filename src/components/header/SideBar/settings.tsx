"use client"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/provider/settingsprovider";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";

export function Settings() {
    const {
        showSwipeIcons,
        setShowSwipeIcons,
        textSize,
        setTextSize
    } = useSettings();

    return (
        <>
       
            <SidebarMenuItem key='swipe-icon'>
                <SidebarMenuButton tooltip={'theme'} className="flex items-center justify-between  gap-4 rounded px-4 py-2 font-medium transition-all">
                    <div className="space-y-1">
                        <Label htmlFor="swipe-icons">Show Swipe Icons</Label>
                    </div>
                    <Switch
                        id="swipe-icons"
                        checked={showSwipeIcons}
                        onCheckedChange={setShowSwipeIcons}
                    />
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem key='text-size'>
                <SidebarMenuButton tooltip={'theme'} className="flex  items-center justify-between  gap-4 rounded px-4 py-2 font-medium transition-all">
                    <Label htmlFor="text-size" className="text-nowrap">Text Size</Label>
                    <Select
                        defaultValue={textSize}
                        onValueChange={(value) => setTextSize(value as 'sm' | 'md' | 'lg')}
                    >
                        <SelectTrigger id="text-size" className="w-max shadow-none !ring-0 outline-none border-none px-0 gap-1.5">
                            <SelectValue
                                placeholder="Select text size" className="mr-1.5" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sm">
                                <span className="text-sm">Small</span>
                            </SelectItem>
                            <SelectItem value="md">
                                <span className="text-md">Medium</span>
                            </SelectItem>
                            <SelectItem value="lg">
                                <span className="text-lg">Large</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <ThemeSwitcher />

          
        </>
    );
}