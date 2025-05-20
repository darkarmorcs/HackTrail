import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartData } from "@/lib/types";

interface ActivityChartProps {
  data: ChartData;
  period: "day" | "week" | "month";
  setPeriod: (period: "day" | "week" | "month") => void;
}

export function ActivityChart({ data, period, setPeriod }: ActivityChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-white">Activity Overview</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={period === "day" ? "secondary" : "outline"}
              size="sm"
              className={period === "day" 
                ? "bg-indigo-500/80 text-white hover:bg-indigo-500/90"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-200"
              }
              onClick={() => setPeriod("day")}
            >
              Day
            </Button>
            <Button
              variant={period === "week" ? "secondary" : "outline"}
              size="sm"
              className={period === "week" 
                ? "bg-indigo-500/80 text-white hover:bg-indigo-500/90"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-200"
              }
              onClick={() => setPeriod("week")}
            >
              Week
            </Button>
            <Button
              variant={period === "month" ? "secondary" : "outline"}
              size="sm"
              className={period === "month" 
                ? "bg-indigo-500/80 text-white hover:bg-indigo-500/90"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-slate-200"
              }
              onClick={() => setPeriod("month")}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-6">
        <div className="h-64 flex items-end border-b border-l border-slate-700 relative">
          <div className="absolute bottom-0 left-0 w-full h-full flex items-end">
            <div className="flex-1 flex items-end justify-around">
              {data.scans.map((value, index) => (
                <div 
                  key={`scan-${index}`}
                  className="w-6 bg-indigo-500 rounded-t-sm" 
                  style={{ height: `${value}%` }}
                ></div>
              ))}
            </div>
            <div className="flex-1 flex items-end justify-around">
              {data.vulnerabilities.map((value, index) => (
                <div 
                  key={`vuln-${index}`}
                  className="w-6 bg-red-500 rounded-t-sm" 
                  style={{ height: `${value}%` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 pb-2 text-xs text-slate-500">
            {data.days.map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm mr-2"></div>
            <span className="text-xs text-slate-400">Scans</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
            <span className="text-xs text-slate-400">Vulnerabilities</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
