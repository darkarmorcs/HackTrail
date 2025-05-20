import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IconMap, IconName } from "@/lib/icon-map";
import { ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  change: {
    value: string;
    positive: boolean;
  };
  icon: IconName;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconColor
}: StatsCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            <p className={cn(
              "text-xs mt-1 flex items-center",
              change.positive ? "text-green-500" : "text-red-500"
            )}>
              <ArrowUpIcon className="h-3 w-3 mr-1" />
              {change.value}
            </p>
          </div>
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <IconMap name={icon} className={iconColor} size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
