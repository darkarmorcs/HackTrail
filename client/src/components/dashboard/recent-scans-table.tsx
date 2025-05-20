import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Filter, MoreHorizontal } from "lucide-react";
import { Scan, ScanResult, ScanStatus, Severity } from "@shared/schema";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  formatDate, 
  statusBadgeColors, 
  exportToJson,
  severityBadgeColors
} from "@/lib/utils/scan-utils";
import { Link } from "wouter";

interface RecentScansTableProps {
  scans: Scan[];
  onViewScan: (scanId: number) => void;
}

export function RecentScansTable({ scans, onViewScan }: RecentScansTableProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Recent Scans</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
            >
              <Filter className="mr-1 h-4 w-4" />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-100">
            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">All Scans</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">Completed</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">In Progress</DropdownMenuItem>
            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">Failed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Target Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Findings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <tr key={scan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {scan.targetDomain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {scan.scanType.charAt(0).toUpperCase() + scan.scanType.slice(1).replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(scan.startedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadgeColors[scan.status as ScanStatus].bg} ${statusBadgeColors[scan.status as ScanStatus].text}`}>
                        {scan.status === 'in_progress' ? 'In Progress' : 
                         scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {scan.status === 'completed' && scan.findings ? (
                        <div className="flex space-x-1">
                          {scan.findings.critical > 0 && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityBadgeColors.critical.bg} ${severityBadgeColors.critical.text}`}>
                              {scan.findings.critical}
                            </span>
                          )}
                          {scan.findings.high > 0 && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityBadgeColors.high.bg} ${severityBadgeColors.high.text}`}>
                              {scan.findings.high}
                            </span>
                          )}
                          {scan.findings.medium > 0 && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityBadgeColors.medium.bg} ${severityBadgeColors.medium.text}`}>
                              {scan.findings.medium}
                            </span>
                          )}
                        </div>
                      ) : scan.status === 'in_progress' ? (
                        <div className="flex items-center">
                          <div className="w-16 bg-slate-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                          </div>
                          <span className="ml-2 text-xs text-slate-400">75%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-blue-500 hover:text-blue-400 hover:bg-transparent"
                          onClick={() => onViewScan(scan.id)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-slate-300 hover:bg-transparent"
                          onClick={() => {
                            if (scan.findings) {
                              exportToJson(scan, `scan-${scan.id}-${scan.targetDomain}.json`);
                            }
                          }}
                          disabled={!scan.findings}
                        >
                          <Download size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-400 hover:text-slate-300 hover:bg-transparent"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-100">
                            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">Rescan</DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-100 focus:bg-slate-700 focus:text-white">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-400">
                    No scans found. Start a new scan to see results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
