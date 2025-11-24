import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { CheckSquare, Star, CheckCircle, Square } from "lucide-react";

const navItems = [
  { title: "All Tasks", view: "all-tasks", icon: CheckSquare },
  { title: "Important", view: "important", icon: Star },
  { title: "Completed", view: "completed", icon: CheckCircle },
  { title: "Incomplete", view: "incomplete", icon: Square },
];

export function AppSidebar({ currentView, setCurrentView }) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="none">
      <SidebarHeader>
        <div className="px-4 py-2 font-bold text-lg">SimpleDo</div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "flex items-center gap-2 w-full justify-start",
                          isActive && "bg-gray-300 hover:bg-gray-300"
                        )}
                        onClick={() => setCurrentView(item.view)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
