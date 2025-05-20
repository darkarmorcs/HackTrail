import React, { useState } from "react";
import { ShieldAlert, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";

export function MobileHeader() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-slate-800 border-r border-slate-700">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center ml-4 space-x-2">
            <ShieldAlert className="text-indigo-400" size={20} />
            <h1 className="text-xl font-semibold text-white">HackTrail</h1>
          </div>
        </div>
        
        <div>
          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white">
            <User size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
