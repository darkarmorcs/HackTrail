import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconMap } from "@/lib/icon-map";
import { FolderOpen, Download, Copy, AlertCircle, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToJson, exportToCsv } from "@/lib/utils/scan-utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the content discovery result type
interface ContentResult {
  path: string;
  statusCode: number;
  contentType?: string;
  contentLength?: number;
}

const formSchema = z.object({
  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  wordlistType: z.enum(["default", "common", "large", "custom"]),
  customWordlist: z.string().optional(),
  recursive: z.boolean().default(false),
  fileExtensions: z.string().optional(),
  threads: z.number().min(1).max(10).default(5),
  statusCodesToInclude: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContentDiscovery() {
  const { toast } = useToast();
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("input");
  const [customWordlist, setCustomWordlist] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      wordlistType: "default",
      recursive: false,
      threads: 5,
      fileExtensions: "php,html,js,txt",
      statusCodesToInclude: "200,204,301,302,307,401,403",
    },
  });

  const watchWordlistType = form.watch("wordlistType");

  const { mutate: discoverContent, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert form data to FormData if we have a custom wordlist
      let data: any = values;
      
      if (values.wordlistType === "custom" && customWordlist) {
        const formData = new FormData();
        
        // Add form values to FormData
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        
        // Add the file
        formData.append("customWordlistFile", customWordlist);
        
        data = formData;
      }
      
      const res = await apiRequest("POST", "/api/tools/content-discovery", data, 
        values.wordlistType === "custom" ? {} : { "Content-Type": "application/json" });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paths.length === 0) {
        setNoResults(true);
        setContentResults([]);
        toast({
          title: "No Content Found",
          description: "No content was discovered for this URL.",
          variant: "default",
        });
      } else {
        setNoResults(false);
        setContentResults(data.paths);
        setActiveTab("results");
        toast({
          title: "Scan Complete",
          description: `Found ${data.paths.length} resources.`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to discover content: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // Validate custom wordlist is provided if that option is selected
    if (data.wordlistType === "custom" && !customWordlist) {
      toast({
        title: "Error",
        description: "Please upload a custom wordlist file",
        variant: "destructive",
      });
      return;
    }
    
    setNoResults(false);
    discoverContent(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCustomWordlist(files[0]);
      toast({
        title: "File Uploaded",
        description: `Wordlist '${files[0].name}' (${Math.round(files[0].size / 1024)} KB) loaded`,
        variant: "default",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Path copied to clipboard",
        variant: "default",
      });
    });
  };

  const handleExportJSON = () => {
    if (contentResults.length === 0) return;
    
    const url = form.getValues("url");
    const data = {
      url,
      contentResults,
      timestamp: new Date().toISOString(),
    };
    
    exportToJson(data, `content-discovery-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: "Exported",
      description: "Results exported as JSON",
      variant: "default",
    });
  };

  const handleExportCSV = () => {
    if (contentResults.length === 0) return;
    
    const url = form.getValues("url");
    
    exportToCsv(contentResults, `content-discovery-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Exported",
      description: "Results exported as CSV",
      variant: "default",
    });
  };

  const getStatusColor = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return "bg-green-500 text-white";
    if (statusCode >= 300 && statusCode < 400) return "bg-blue-500 text-white";
    if (statusCode >= 400 && statusCode < 500) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FolderOpen className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Content Discovery</h2>
            <p className="text-slate-400 mt-1">Find hidden files and directories in web applications</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={contentResults.length === 0 && !isPending}>
            Results {contentResults.length > 0 && <Badge className="ml-2 bg-purple-500 text-white">{contentResults.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Target URL</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter a URL to scan for hidden content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-300">Target URL</FormLabel>
                          <FormControl>
                            <Input
                              className="bg-slate-900 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500"
                              placeholder="https://example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400 text-xs">
                            The base URL to scan (e.g., https://example.com)
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wordlistType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium text-slate-300">Wordlist Selection</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="default" className="text-purple-500" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal text-slate-300">
                                  Default Wordlist (1,000 common paths)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="common" className="text-purple-500" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal text-slate-300">
                                  Common Wordlist (5,000 paths)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="large" className="text-purple-500" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal text-slate-300">
                                  Large Wordlist (20,000 paths) - May take longer
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="custom" className="text-purple-500" />
                                </FormControl>
                                <FormLabel className="text-sm font-normal text-slate-300">
                                  Custom Wordlist (Upload your own file)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchWordlistType === "custom" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-300">Custom Wordlist File</Label>
                        <div className="flex flex-col space-y-2">
                          <Input 
                            type="file" 
                            accept=".txt,.list,.wordlist"
                            onChange={handleFileChange}
                            className="bg-slate-900 border-slate-700 text-white file:bg-purple-500 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1"
                          />
                          {customWordlist && (
                            <p className="text-xs text-slate-400">
                              File: {customWordlist.name} ({Math.round(customWordlist.size/1024)} KB)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator className="bg-slate-700" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-300">Advanced Options</h4>

                      <FormField
                        control={form.control}
                        name="fileExtensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">File Extensions</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-slate-900 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500"
                                placeholder="php,html,js,txt"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              Comma-separated file extensions to check (leave empty for no extension)
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recursive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium text-slate-300">Recursive Scanning</FormLabel>
                              <FormDescription className="text-xs text-slate-400">
                                Recursively scan discovered directories (may take longer)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-purple-500"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="threads"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">
                              Threads ({field.value})
                            </FormLabel>
                            <FormControl>
                              <div className="pt-2">
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              Number of concurrent connections (higher values may trigger rate limiting)
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="statusCodesToInclude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">Status Codes to Include</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-slate-900 border-slate-700 text-white focus:border-purple-500 focus:ring-purple-500"
                                placeholder="200,204,301,302,307,401,403"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-slate-400 text-xs">
                              Comma-separated HTTP status codes to include in results
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-purple-500 text-white hover:bg-purple-600"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Discover Content
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">About Content Discovery</CardTitle>
                <CardDescription className="text-slate-400">
                  How to effectively find hidden content in web applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-medium">What is Content Discovery?</h3>
                  <p className="text-slate-400 text-sm">
                    Content discovery is the process of finding hidden files, directories, and other resources on a web server that may not be linked from the main site. This can reveal sensitive information, backup files, administrative interfaces, and other valuable targets.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">Wordlist Selection</h3>
                  <p className="text-slate-400 text-sm">
                    The choice of wordlist is crucial for effective content discovery:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li><span className="text-purple-400">Default</span>: Good starting point with common paths</li>
                    <li><span className="text-purple-400">Common</span>: More comprehensive list of common web paths</li>
                    <li><span className="text-purple-400">Large</span>: Extensive set of potential paths (takes longer)</li>
                    <li><span className="text-purple-400">Custom</span>: Upload your own wordlist for targeted scanning</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">File Extensions</h3>
                  <p className="text-slate-400 text-sm">
                    Adding file extensions can help discover specific file types. Common extensions include:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-slate-700 text-slate-300">php</Badge>
                    <Badge className="bg-slate-700 text-slate-300">html</Badge>
                    <Badge className="bg-slate-700 text-slate-300">js</Badge>
                    <Badge className="bg-slate-700 text-slate-300">txt</Badge>
                    <Badge className="bg-slate-700 text-slate-300">bak</Badge>
                    <Badge className="bg-slate-700 text-slate-300">old</Badge>
                    <Badge className="bg-slate-700 text-slate-300">backup</Badge>
                    <Badge className="bg-slate-700 text-slate-300">xml</Badge>
                    <Badge className="bg-slate-700 text-slate-300">json</Badge>
                    <Badge className="bg-slate-700 text-slate-300">config</Badge>
                  </div>
                </div>

                <Alert className="bg-indigo-500/10 border-indigo-500/20 text-indigo-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Responsible Testing</AlertTitle>
                  <AlertDescription className="text-sm">
                    Always ensure you have permission to scan the target website. Content discovery can generate significant traffic to the target server.
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
                    Content Discovery Results 
                    {contentResults.length > 0 && (
                      <Badge className="ml-2 bg-purple-500 text-white">{contentResults.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Discovered resources for {form.getValues("url")}
                  </CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={handleExportJSON}
                    disabled={contentResults.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={handleExportCSV}
                    disabled={contentResults.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <span className="ml-2 text-slate-400">Discovering content...</span>
                  </div>
                ) : noResults ? (
                  <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <AlertTitle>No Results Found</AlertTitle>
                    <AlertDescription>
                      No content was discovered. Try adjusting your scan parameters or using a different wordlist.
                    </AlertDescription>
                  </Alert>
                ) : contentResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Path</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 hidden md:table-cell">Content Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400 hidden md:table-cell">Size</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentResults.map((result, index) => (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}
                          >
                            <td className="py-2 px-4 text-slate-300 font-mono text-sm truncate max-w-xs">
                              {result.path}
                            </td>
                            <td className="py-2 px-4">
                              <Badge className={getStatusColor(result.statusCode)}>
                                {result.statusCode}
                              </Badge>
                            </td>
                            <td className="py-2 px-4 text-slate-300 hidden md:table-cell">
                              {result.contentType || 'N/A'}
                            </td>
                            <td className="py-2 px-4 text-slate-300 hidden md:table-cell">
                              {result.contentLength ? `${Math.round(result.contentLength / 1024)} KB` : 'N/A'}
                            </td>
                            <td className="py-2 px-4 flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={() => copyToClipboard(result.path)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={() => window.open(`${form.getValues("url")}${result.path}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <IconMap name="content-discovery" className="text-slate-500 mb-2" size={40} />
                    <p className="text-slate-400">Enter a URL and start scanning to find content</p>
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

// Extra components needed
const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

const ExternalLink = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);