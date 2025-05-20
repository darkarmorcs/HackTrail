import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecentScansTable } from "@/components/dashboard/recent-scans-table";
import { History, Download, Plus } from "lucide-react";
import { ScanModal } from "@/components/scan/scan-modal";
import { ScanFormData } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Scan } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ScanHistory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch scans data
  const { data: scans = [], isLoading } = useQuery<Scan[]>({
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

  // Handle starting a new scan
  const handleStartScan = (data: ScanFormData) => {
    createScan(data);
  };

  // Handle view scan
  const handleViewScan = (scanId: number) => {
    navigate(`/scan-results/${scanId}`);
  };

  // Filter scans based on search term and status filter
  const filteredScans = scans.filter(scan => {
    const matchesSearch = searchTerm === "" || 
      scan.targetDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.scanType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === null || scan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Export all scan history
  const handleExportHistory = () => {
    if (filteredScans.length === 0) return;
    
    const exportData = {
      scans: filteredScans,
      exportedAt: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Scan history exported successfully",
      variant: "default",
    });
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <History className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Scan History</h2>
            <p className="text-slate-400 mt-1">View and manage your previous scans</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline"
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={handleExportHistory}
            disabled={filteredScans.length === 0}
          >
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
          <Button 
            onClick={() => setScanModalOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium"
          >
            <Plus className="mr-1 h-4 w-4" /> New Scan
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white">Filters</CardTitle>
          <CardDescription className="text-slate-400">
            Filter and search your scan history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by domain or scan type..."
                className="bg-slate-900 border-slate-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white w-full md:w-auto"
                  >
                    Status: {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-100">
                  <DropdownMenuItem 
                    className="text-slate-100 focus:bg-slate-700 focus:text-white"
                    onClick={() => setStatusFilter(null)}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-slate-100 focus:bg-slate-700 focus:text-white"
                    onClick={() => setStatusFilter("completed")}
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-slate-100 focus:bg-slate-700 focus:text-white"
                    onClick={() => setStatusFilter("in_progress")}
                  >
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-slate-100 focus:bg-slate-700 focus:text-white"
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-slate-100 focus:bg-slate-700 focus:text-white"
                    onClick={() => setStatusFilter("failed")}
                  >
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scans Table */}
      <RecentScansTable 
        scans={filteredScans} 
        onViewScan={handleViewScan} 
      />

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
