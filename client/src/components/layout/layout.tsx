import React from "react";
import { MobileHeader } from "./header";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <Sidebar />
        
        {/* Mobile header */}
        <MobileHeader />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto md:ml-64 pt-16 md:pt-0 bg-slate-900">
          {children}
        </main>
      </div>
      
      {/* Footer with copyright */}
      <footer className="bg-slate-800 text-slate-400 text-center py-3 text-sm border-t border-slate-700 md:ml-64">
        <div className="container mx-auto">
          <p>
            © {new Date().getFullYear()} <a href="https://facebook.com/darkarmorcs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">DarkArmor Cyber Solutions</a>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
