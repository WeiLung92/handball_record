"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function RecordPage() {
  const router = useRouter();
  return (
    <div>
      <SidebarProvider>
        <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>記錄頁面</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/upload")}>前往上傳頁面</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/record/team")}>查看隊伍與選手</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/record/game")}>查看賽程與結果</SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        </Sidebar>
        <SidebarTrigger/>
      </SidebarProvider>
      
    </div>
  );
}
