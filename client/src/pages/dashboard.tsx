import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { VulnerabilitySummary } from "@/components/dashboard/vulnerability-summary";
import { RecentScansTable } from "@/components/dashboard/recent-scans-table";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/dashboard/tool-card";
import { ScanModal } from "@/components/scan/scan-modal";
import { IconMap } from "@/lib/icon-map";
import { ScanFormData, StatsData, ChartData, VulnerabilitySummary as VSummary } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { Scan, ScanType } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("week");

  // Fetch scans data
  const { data: scans = [], isLoading: isScansLoading } = useQuery<Scan[]>({
    queryKey: ["/api/scans"],
  });

  // Create a new scan
  const { mutate: createScan, isPending: isCreatingScan } = useMutation({
    mutationFn: async (data: ScanFormData) => {
      const res = await apiRequest("POST", "/api/scans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      toast({
        title: "Scan Started",
        description: "Your scan has been started successfully.",
        variant: "default",
      });
      setScanModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start scan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Calculate stats data
  const statsData: StatsData = {
    totalScans: scans.length,
    totalVulnerabilities: scans.reduce((acc, scan) => {
      if (scan.findings) {
        const findings = scan.findings as any;
        return acc + (findings.critical || 0) + (findings.high || 0) + (findings.medium || 0) + (findings.low || 0);
      }
      return acc;
    }, 0),
    totalSubdomains: scans.reduce((acc, scan) => {
      if (scan.findings && scan.findings.subdomains) {
        return acc + (scan.findings.subdomains.length || 0);
      }
      return acc;
    }, 0),
    totalParameters: scans.reduce((acc, scan) => {
      if (scan.findings && scan.findings.parameters) {
        return acc + (scan.findings.parameters.length || 0);
      }
      return acc;
    }, 0),
  };

  // Mock chart data based on period
  const getChartData = (): ChartData => {
    // For a real app, this would come from backend data
    // This is just sample data for demonstration
    if (chartPeriod === "day") {
      return {
        scans: [20, 35, 45, 30, 50, 25, 40],
        vulnerabilities: [5, 10, 8, 12, 15, 6, 9],
        days: ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM"],
      };
    } else if (chartPeriod === "week") {
      return {
        scans: [40, 65, 35, 78, 45, 50, 65],
        vulnerabilities: [15, 25, 10, 30, 20, 15, 25],
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      };
    } else {
      return {
        scans: [150, 240, 320, 280, 190, 220, 350],
        vulnerabilities: [45, 65, 50, 70, 55, 40, 80],
        days: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
      };
    }
  };

  // Vulnerability summary data
  const vulnerabilitySummary: VSummary = {
    total: statsData.totalVulnerabilities,
    critical: scans.reduce((acc, scan) => {
      if (scan.findings) {
        const findings = scan.findings as any;
        return acc + (findings.critical || 0);
      }
      return acc;
    }, 0),
    high: scans.reduce((acc, scan) => {
      if (scan.findings) {
        const findings = scan.findings as any;
        return acc + (findings.high || 0);
      }
      return acc;
    }, 0),
    medium: scans.reduce((acc, scan) => {
      if (scan.findings) {
        const findings = scan.findings as any;
        return acc + (findings.medium || 0);
      }
      return acc;
    }, 0),
    low: scans.reduce((acc, scan) => {
      if (scan.findings) {
        const findings = scan.findings as any;
        return acc + (findings.low || 0);
      }
      return acc;
    }, 0),
  };

  // Handle starting a new scan
  const handleStartScan = (data: ScanFormData) => {
    createScan(data);
  };

  // Handle view scan
  const handleViewScan = (scanId: number) => {
    navigate(`/scan-results/${scanId}`);
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-400 mt-1">Overview of your security tests and findings</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setScanModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
          >
            <Plus className="mr-1 h-4 w-4" /> New Scan
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Scans"
          value={statsData.totalScans}
          change={{ value: "12% from last month", positive: true }}
          icon="dashboard"
          iconBgColor="bg-indigo-500/10"
          iconColor="text-indigo-500"
        />
        
        <StatsCard
          title="Vulnerabilities"
          value={statsData.totalVulnerabilities}
          change={{ value: "5% from last month", positive: false }}
          icon="vulnerability"
          iconBgColor="bg-red-500/10"
          iconColor="text-red-500"
        />
        
        <StatsCard
          title="Subdomains"
          value={statsData.totalSubdomains}
          change={{ value: "18% from last month", positive: true }}
          icon="subdomain"
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-500"
        />
        
        <StatsCard
          title="Parameters"
          value={statsData.totalParameters}
          change={{ value: "7% from last month", positive: true }}
          icon="parameter"
          iconBgColor="bg-green-500/10"
          iconColor="text-green-500"
        />
      </div>

      {/* Charts and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ActivityChart 
          data={getChartData()} 
          period={chartPeriod} 
          setPeriod={setChartPeriod} 
        />
        <VulnerabilitySummary data={vulnerabilitySummary} />
      </div>

      {/* Recent Scans Table */}
      <RecentScansTable 
        scans={scans.slice(0, 5)} 
        onViewScan={handleViewScan} 
      />

      {/* Tools Grid */}
      <h3 className="text-lg font-semibold text-white mb-4 mt-6">Quick Access Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <ToolCard
          title="Subdomain Finder"
          description="Discover subdomains of target websites"
          path="/subdomain-finder"
          icon={<IconMap name="subdomain" className="text-indigo-500" size={20} />}
          iconBgColor="bg-indigo-500/10"
        />
        
        <ToolCard
          title="Parameter Discovery"
          description="Find hidden parameters in web applications"
          path="/parameter-discovery"
          icon={<IconMap name="parameter" className="text-amber-500" size={20} />}
          iconBgColor="bg-amber-500/10"
        />
        
        <ToolCard
          title="Vulnerability Scanner"
          description="Detect common security vulnerabilities"
          path="/vulnerability-scanner"
          icon={<IconMap name="vulnerability" className="text-red-500" size={20} />}
          iconBgColor="bg-red-500/10"
        />
        
        <ToolCard
          title="Technology Detector"
          description="Identify technologies used by websites"
          path="/tech-detector"
          icon={<IconMap name="tech-detector" className="text-blue-500" size={20} />}
          iconBgColor="bg-blue-500/10"
        />
        
        <ToolCard
          title="Content Discovery"
          description="Find hidden files and directories"
          path="/content-discovery"
          icon={<IconMap name="content-discovery" className="text-green-500" size={20} />}
          iconBgColor="bg-green-500/10"
        />
        
        <ToolCard
          title="Report Generator"
          description="Create professional security reports"
          path="/reports"
          icon={<IconMap name="reports" className="text-yellow-500" size={20} />}
          iconBgColor="bg-yellow-500/10"
        />
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onSubmit={handleStartScan}
        isLoading={isCreatingScan}
      />
    </div>
  );
}
