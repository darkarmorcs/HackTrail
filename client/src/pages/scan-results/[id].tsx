import React from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Copy, FileText, Clock, Server } from "lucide-react";
import { IconMap } from "@/lib/icon-map";
import { Scan, ScanStatus, Severity } from "@shared/schema";
import { formatDate, statusBadgeColors, severityBadgeColors, exportToJson } from "@/lib/utils/scan-utils";
import { ScanResult, ParameterResult, SubdomainResult, VulnerabilityResult } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScanResults() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/scan-results/:id");
  const { toast } = useToast();
  const scanId = parseInt(params?.id || "0");

  // Fetch scan details
  const { data: scan, isLoading: isScanLoading } = useQuery<Scan>({
    queryKey: [`/api/scans/${scanId}`],
    enabled: !!scanId,
  });

  // Fetch scan results
  const { data: results = [], isLoading: isResultsLoading } = useQuery<ScanResult[]>({
    queryKey: [`/api/scans/${scanId}/results`],
    enabled: !!scanId,
  });

  if (!match) return null;

  // Extract different types of results
  const subdomains: SubdomainResult[] = results
    .filter(result => result.resultType === "subdomain")
    .map(result => result.details as SubdomainResult);

  const parameters: ParameterResult[] = results
    .filter(result => result.resultType === "parameter")
    .map(result => result.details as ParameterResult);

  const vulnerabilities: VulnerabilityResult[] = results
    .filter(result => result.resultType === "vulnerability")
    .map(result => ({
      ...(result.details as { type: string; description: string }),
      severity: result.severity as Severity
    }));

  const handleExport = () => {
    if (!scan) return;
    
    const exportData = {
      scan,
      results: {
        subdomains,
        parameters,
        vulnerabilities
      },
      exportedAt: new Date().toISOString()
    };
    
    exportToJson(exportData, `scan-result-${scan.id}-${scan.targetDomain}.json`);
    
    toast({
      title: "Exported",
      description: "Scan results exported successfully",
      variant: "default",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
        variant: "default",
      });
    });
  };

  const isLoading = isScanLoading || isResultsLoading;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 text-slate-400 hover:text-white"
          onClick={() => setLocation("/scan-history")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scan History
        </Button>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-800" />
            <Skeleton className="h-5 w-48 bg-slate-800" />
          </div>
        ) : scan ? (
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{scan.targetDomain}</h2>
              <Badge
                className={`${statusBadgeColors[scan.status as ScanStatus].bg} ${statusBadgeColors[scan.status as ScanStatus].text}`}
              >
                {scan.status === 'in_progress' ? 'In Progress' : scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1">
              {scan.scanType.charAt(0).toUpperCase() + scan.scanType.slice(1).replace('_', ' ')} • 
              Started: {formatDate(scan.startedAt)} •
              {scan.completedAt ? ` Completed: ${formatDate(scan.completedAt)}` : ' In Progress'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Alert className="bg-red-500/10 border-red-500/20 text-red-500">
              <AlertTitle>Scan Not Found</AlertTitle>
              <AlertDescription>
                The scan you're looking for could not be found. It may have been deleted or never existed.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full bg-slate-800" />
          <Skeleton className="h-96 w-full bg-slate-800" />
        </div>
      ) : scan ? (
        <>
          {/* Scan Status Card */}
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Scan Type</p>
                  <div className="flex items-center">
                    <IconMap 
                      name={
                        scan.scanType === "subdomain" ? "subdomain" :
                        scan.scanType === "parameter" ? "parameter" :
                        scan.scanType === "vulnerability" ? "vulnerability" :
                        "dashboard"
                      } 
                      className="text-indigo-500 mr-2" 
                      size={16} 
                    />
                    <p className="text-white font-medium">
                      {scan.scanType.charAt(0).toUpperCase() + scan.scanType.slice(1).replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Scan Depth</p>
                  <div className="flex items-center">
                    <Server className="text-amber-500 mr-2 h-4 w-4" />
                    <p className="text-white font-medium">Level {scan.scanDepth}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Duration</p>
                  <div className="flex items-center">
                    <Clock className="text-green-500 mr-2 h-4 w-4" />
                    <p className="text-white font-medium">
                      {scan.completedAt 
                        ? `${Math.round((new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime()) / 1000)} seconds` 
                        : 'In Progress'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Total Findings</p>
                  <div className="flex items-center">
                    <FileText className="text-blue-500 mr-2 h-4 w-4" />
                    <p className="text-white font-medium">
                      {subdomains.length + parameters.length + vulnerabilities.length}
                    </p>
                  </div>
                </div>
              </div>

              {scan.status === "in_progress" && (
                <div className="mt-6">
                  <p className="text-sm text-slate-400 mb-2">Scan Progress</p>
                  <Progress value={75} className="h-2 bg-slate-700" indicatorClassName="bg-blue-500" />
                  <p className="text-xs text-slate-400 mt-1 text-right">Estimated time remaining: 2 minutes</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  className="bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue={vulnerabilities.length > 0 ? "vulnerabilities" : (subdomains.length > 0 ? "subdomains" : "parameters")} className="w-full">
            <TabsList className="bg-slate-800 border-slate-700 p-1 mb-6">
              <TabsTrigger 
                value="vulnerabilities" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Vulnerabilities {vulnerabilities.length > 0 && <Badge className="ml-2 bg-red-500/10 text-red-500">{vulnerabilities.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="subdomains" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Subdomains {subdomains.length > 0 && <Badge className="ml-2 bg-indigo-500/10 text-indigo-500">{subdomains.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger 
                value="parameters" 
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
              >
                Parameters {parameters.length > 0 && <Badge className="ml-2 bg-amber-500/10 text-amber-500">{parameters.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vulnerabilities">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Vulnerabilities</CardTitle>
                  <CardDescription className="text-slate-400">
                    Security vulnerabilities found during the scan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vulnerabilities.length > 0 ? (
                    <div className="space-y-4">
                      {vulnerabilities.map((vuln, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-md border ${severityBadgeColors[vuln.severity].bg} border-${vuln.severity === 'critical' ? 'red' : vuln.severity === 'high' ? 'amber' : vuln.severity === 'medium' ? 'yellow' : 'green'}-500/20`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium text-white">{vuln.type}</h4>
                                <Badge className={`ml-2 ${severityBadgeColors[vuln.severity].bg} ${severityBadgeColors[vuln.severity].text}`}>
                                  {vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{vuln.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                              onClick={() => copyToClipboard(JSON.stringify(vuln, null, 2))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
                      <AlertTitle>No Vulnerabilities Found</AlertTitle>
                      <AlertDescription>
                        No vulnerabilities were detected during this scan. Good job!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subdomains">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Subdomains</CardTitle>
                  <CardDescription className="text-slate-400">
                    Discovered subdomains for {scan.targetDomain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subdomains.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {subdomains.map((subdomain, index) => (
                        <div
                          key={index}
                          className="bg-slate-900 rounded-md p-3 border border-slate-700 flex justify-between items-center"
                        >
                          <span className="text-slate-300 font-mono text-sm truncate">
                            {subdomain.domain}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={() => copyToClipboard(subdomain.domain)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                      <AlertTitle>No Subdomains Found</AlertTitle>
                      <AlertDescription>
                        No subdomains were found for this target domain.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parameters">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Parameters</CardTitle>
                  <CardDescription className="text-slate-400">
                    Discovered parameters for {scan.targetDomain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {parameters.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Parameter</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parameters.map((param, index) => (
                            <tr 
                              key={index} 
                              className={index % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}
                            >
                              <td className="py-2 px-4 text-slate-300 font-mono text-sm">
                                {param.name}
                              </td>
                              <td className="py-2 px-4 text-slate-300">
                                <Badge className="bg-slate-700 text-slate-300 hover:bg-slate-600">
                                  {param.type}
                                </Badge>
                              </td>
                              <td className="py-2 px-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                                  onClick={() => copyToClipboard(param.name)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                      <AlertTitle>No Parameters Found</AlertTitle>
                      <AlertDescription>
                        No parameters were found for this target domain.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-400">Scan details could not be loaded.</p>
        </div>
      )}
    </div>
  );
}
