import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { IconMap } from "@/lib/icon-map";
import { ShieldAlert, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function NavItem({ href, icon, children, active }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-slate-300 hover:bg-slate-700"
        )}
      >
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-slate-800 border-r border-slate-700 fixed h-full z-10">
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="text-indigo-400" size={20} />
          <h1 className="text-xl font-semibold text-white">HackTrail</h1>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto py-4 px-3">
        <NavSection title="Dashboard">
          <NavItem 
            href="/" 
            icon={<IconMap name="dashboard" className="mr-2" size={18} />} 
            active={location === "/"}
          >
            Overview
          </NavItem>
          <NavItem 
            href="/scan-history" 
            icon={<IconMap name="history" className="mr-2" size={18} />} 
            active={location === "/scan-history"}
          >
            Scan History
          </NavItem>
        </NavSection>
        
        <NavSection title="Reconnaissance">
          <NavItem 
            href="/subdomain-finder" 
            icon={<IconMap name="subdomain" className="mr-2" size={18} />} 
            active={location === "/subdomain-finder"}
          >
            Subdomain Finder
          </NavItem>
          <NavItem 
            href="/port-scanner" 
            icon={<IconMap name="port-scanner" className="mr-2" size={18} />} 
            active={location === "/port-scanner"}
          >
            Port Scanner
          </NavItem>
          <NavItem 
            href="/tech-detector" 
            icon={<IconMap name="tech-detector" className="mr-2" size={18} />} 
            active={location === "/tech-detector"}
          >
            Technology Detector
          </NavItem>
        </NavSection>
        
        <NavSection title="Vulnerability Testing">
          <NavItem 
            href="/vulnerability-scanner" 
            icon={<IconMap name="vulnerability" className="mr-2" size={18} />} 
            active={location === "/vulnerability-scanner"}
          >
            Vulnerability Scanner
          </NavItem>
          <NavItem 
            href="/parameter-discovery" 
            icon={<IconMap name="parameter" className="mr-2" size={18} />} 
            active={location === "/parameter-discovery"}
          >
            Parameter Discovery
          </NavItem>
          <NavItem 
            href="/content-discovery" 
            icon={<IconMap name="content-discovery" className="mr-2" size={18} />} 
            active={location === "/content-discovery"}
          >
            Content Discovery
          </NavItem>
        </NavSection>
        
        <NavSection title="Reporting">
          <NavItem 
            href="/reports" 
            icon={<IconMap name="reports" className="mr-2" size={18} />} 
            active={location === "/reports"}
          >
            Generate Reports
          </NavItem>
          <NavItem 
            href="/settings" 
            icon={<IconMap name="settings" className="mr-2" size={18} />} 
            active={location === "/settings"}
          >
            Settings
          </NavItem>
        </NavSection>
      </ScrollArea>
      
      <Separator className="bg-slate-700" />
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white">
            <User size={16} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Security Researcher</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
