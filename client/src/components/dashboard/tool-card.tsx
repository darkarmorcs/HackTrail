import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  iconBgColor: string;
}

export function ToolCard({ title, description, icon, path, iconBgColor }: ToolCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-indigo-500/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start">
          <div className={cn("p-3 rounded-lg mr-4", iconBgColor)}>
            {icon}
          </div>
          <div>
            <h4 className="text-white font-medium">{title}</h4>
            <p className="text-slate-400 text-sm mt-1">{description}</p>
            <div className="mt-4">
              <Link href={path}>
                <a className="text-indigo-400 text-sm hover:text-indigo-300">
                  Launch Tool →
                </a>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
