"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LayoutDashboard, History, TrendingUp, Settings, Briefcase, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/history", icon: History, label: "History" },
    { to: "/analytics", icon: TrendingUp, label: "Analytics" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  // Helper to check if a route is active (handles nested routes)
  const isRouteActive = (itemPath: string) => {
    if (itemPath === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(itemPath);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <span className="font-serif text-xl font-light tracking-tight">FinSight</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isRouteActive(item.to)}>
                  <Link href={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.email}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={signOut}>
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
