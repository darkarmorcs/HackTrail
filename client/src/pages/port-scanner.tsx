import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconMap } from "@/lib/icon-map";
import { Network, Download, Copy, AlertCircle, Loader2, Server, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToJson, exportToCsv } from "@/lib/utils/scan-utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// Define port scan result type
interface PortScanResult {
  port: number;
  state: "open" | "closed" | "filtered";
  service?: string;
  banner?: string;
}

const formSchema = z.object({
  target: z
    .string()
    .min(3, "Target must be at least 3 characters")
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
      "Please enter a valid domain name or IP address"
    ),
  portRange: z.string().default("1-1000"),
  scanSpeed: z.number().min(1).max(5).default(3),
  scanVersion: z.boolean().default(false),
  scanSpecificPorts: z.boolean().default(false),
  specificPorts: z.string().optional(),
  commonPortsOnly: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function PortScanner() {
  const { toast } = useToast();
  const [portResults, setPortResults] = useState<PortScanResult[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("input");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: "",
      portRange: "1-1000",
      scanSpeed: 3,
      scanVersion: false,
      scanSpecificPorts: false,
      specificPorts: "",
      commonPortsOnly: true,
    },
  });
  
  const watchScanSpecificPorts = form.watch("scanSpecificPorts");
  const watchCommonPortsOnly = form.watch("commonPortsOnly");

  const { mutate: scanPorts, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/tools/port-scanner", values);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.ports.length === 0) {
        setNoResults(true);
        setPortResults([]);
        toast({
          title: "No Open Ports",
          description: "No open ports were detected for this target.",
          variant: "default",
        });
      } else {
        setNoResults(false);
        setPortResults(data.ports);
        setActiveTab("results");
        toast({
          title: "Scan Complete",
          description: `Found ${data.ports.filter(p => p.state === "open").length} open ports out of ${data.ports.length} scanned.`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to scan ports: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setNoResults(false);
    scanPorts(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Port information copied to clipboard",
        variant: "default",
      });
    });
  };

  const handleExportJSON = () => {
    if (portResults.length === 0) return;
    
    const target = form.getValues("target");
    const data = {
      target,
      scanTime: new Date().toISOString(),
      ports: portResults
    };
    
    exportToJson(data, `port-scan-${target}-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: "Exported",
      description: "Results exported as JSON",
      variant: "default",
    });
  };

  const handleExportCSV = () => {
    if (portResults.length === 0) return;
    
    const target = form.getValues("target");
    
    exportToCsv(portResults, `port-scan-${target}-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Exported",
      description: "Results exported as CSV",
      variant: "default",
    });
  };

  const getPortStateColor = (state: string): string => {
    switch(state) {
      case "open": return "bg-green-500 text-white";
      case "filtered": return "bg-amber-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Network className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Port Scanner</h2>
            <p className="text-slate-400 mt-1">Discover open ports and services on target hosts</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={portResults.length === 0 && !isPending}>
            Results {portResults.length > 0 && <Badge className="ml-2 bg-blue-500 text-white">{portResults.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Scan Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure your port scanning options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-300">Target Host</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              placeholder="example.com or 192.168.1.1"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400 text-xs">
                            Domain name or IP address to scan
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="commonPortsOnly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium text-slate-300">Common Ports Only</FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Only scan well-known and commonly used ports
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {!watchCommonPortsOnly && (
                      <FormField
                        control={form.control}
                        name="portRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Port Range</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                placeholder="1-1000, 443, 8080-8090"
                                {...field}
                                disabled={watchScanSpecificPorts}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              Range of ports to scan (e.g., 1-1000)
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="scanSpecificPorts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium text-slate-300">Specific Ports</FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Scan only specific ports instead of a range
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-blue-500"
                              disabled={watchCommonPortsOnly}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {watchScanSpecificPorts && !watchCommonPortsOnly && (
                      <FormField
                        control={form.control}
                        name="specificPorts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Specific Ports</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                placeholder="22, 80, 443, 8080"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              Comma separated list of ports (e.g., 22, 80, 443)
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    )}

                    <Separator className="bg-slate-700" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-300">Scan Options</h4>
                    
                      <FormField
                        control={form.control}
                        name="scanSpeed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">
                              Scan Speed ({field.value}/5)
                            </FormLabel>
                            <FormControl>
                              <div className="pt-2">
                                <Slider
                                  min={1}
                                  max={5}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Stealthy</span>
                                <span>Fast</span>
                              </div>
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scanVersion"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium text-slate-300">Service Version Detection</FormLabel>
                              <FormDescription className="text-xs text-slate-400">
                                Attempt to detect service versions running on ports
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning Ports...
                        </>
                      ) : (
                        <>
                          <Network className="mr-2 h-4 w-4" />
                          Start Port Scan
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">About Port Scanning</CardTitle>
                <CardDescription className="text-slate-400">
                  How to effectively discover and analyze open ports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-medium">What is Port Scanning?</h3>
                  <p className="text-slate-400 text-sm">
                    Port scanning is the process of checking a target host for open ports and services. This can help identify potential entry points and vulnerabilities in a network or system.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">Common Port Numbers</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-slate-300 text-sm font-medium">Web Services:</p>
                      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                        <li>HTTP: 80</li>
                        <li>HTTPS: 443</li>
                        <li>Web Proxy: 8080</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium">Remote Access:</p>
                      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                        <li>SSH: 22</li>
                        <li>Telnet: 23</li>
                        <li>RDP: 3389</li>
                      </ul>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-slate-300 text-sm font-medium">Mail Services:</p>
                      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                        <li>SMTP: 25</li>
                        <li>POP3: 110</li>
                        <li>IMAP: 143</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium">File Transfer:</p>
                      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                        <li>FTP: 21</li>
                        <li>SFTP: 22</li>
                        <li>SMB: 445</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert className="bg-indigo-500/10 border-indigo-500/20 text-indigo-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Responsible Testing</AlertTitle>
                  <AlertDescription className="text-sm">
                    Always ensure you have permission to scan the target host. Port scanning without authorization may be illegal in some jurisdictions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Port Scan Results 
                    {portResults.length > 0 && (
                      <Badge className="ml-2 bg-blue-500 text-white">
                        {portResults.filter(p => p.state === "open").length} open
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Discovered ports on {form.getValues("target")}
                  </CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={handleExportJSON}
                    disabled={portResults.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={handleExportCSV}
                    disabled={portResults.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-slate-400">Scanning ports...</span>
                  </div>
                ) : noResults ? (
                  <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <AlertTitle>No Open Ports Found</AlertTitle>
                    <AlertDescription>
                      No open ports were detected on this target. The host may be behind a firewall or not reachable.
                    </AlertDescription>
                  </Alert>
                ) : portResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Port</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">State</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 hidden md:table-cell">Banner/Version</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portResults.map((result, index) => (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}
                          >
                            <td className="py-2 px-4 text-slate-300 font-mono text-sm">
                              {result.port}
                            </td>
                            <td className="py-2 px-4">
                              <Badge className={getPortStateColor(result.state)}>
                                {result.state}
                              </Badge>
                            </td>
                            <td className="py-2 px-4 text-slate-300">
                              {result.service || "unknown"}
                            </td>
                            <td className="py-2 px-4 text-slate-300 hidden md:table-cell">
                              <span className="text-xs font-mono">
                                {result.banner || "N/A"}
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
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
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Server className="text-slate-500 mb-2 h-10 w-10" />
                    <p className="text-slate-400">Enter a target and start scanning to find open ports</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}