import React from "react";
import { MobileHeader } from "./header";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile header */}
      <MobileHeader />
      
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto md:ml-64 pt-16 md:pt-0 bg-slate-900">
        {children}
      </main>
    </div>
  );
}
