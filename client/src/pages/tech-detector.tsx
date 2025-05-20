import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Download, Copy, AlertCircle, Loader2, FileWarning, ExternalLink } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

interface TechResult {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  icon?: string;
}

const formSchema = z.object({
  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .url("Please enter a valid URL (e.g., https://example.com)")
});

type FormValues = z.infer<typeof formSchema>;

export default function TechDetector() {
  const { toast } = useToast();
  const [techResults, setTechResults] = useState<TechResult[]>([]);
  const [noResults, setNoResults] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("input");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: ""
    }
  });

  const { mutate: detectTech, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/tools/tech-detector", values);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.technologies.length === 0) {
        setNoResults(true);
        setTechResults([]);
        toast({
          title: "No Technologies Detected",
          description: "No technologies were detected for this URL.",
          variant: "default",
        });
      } else {
        setNoResults(false);
        setTechResults(data.technologies);
        setActiveTab("results");
        toast({
          title: "Detection Complete",
          description: `Found ${data.technologies.length} technologies.`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to detect technologies: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setNoResults(false);
    detectTech(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Technology information copied to clipboard",
        variant: "default",
      });
    });
  };

  const handleExportJSON = () => {
    if (techResults.length === 0) return;
    
    const url = form.getValues("url");
    const data = {
      url,
      scanTime: new Date().toISOString(),
      technologies: techResults
    };
    
    exportToJson(data, `tech-detection-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: "Exported",
      description: "Results exported as JSON",
      variant: "default",
    });
  };

  const handleExportCSV = () => {
    if (techResults.length === 0) return;
    
    const url = form.getValues("url");
    
    exportToCsv(techResults, `tech-detection-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Exported",
      description: "Results exported as CSV",
      variant: "default",
    });
  };

  // Group results by category
  const resultsByCategory = techResults.reduce((acc: Record<string, TechResult[]>, tech) => {
    if (!acc[tech.category]) {
      acc[tech.category] = [];
    }
    acc[tech.category].push(tech);
    return acc;
  }, {});

  // Get background color based on confidence
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return "bg-green-500 text-white";
    if (confidence >= 70) return "bg-blue-500 text-white";
    if (confidence >= 50) return "bg-amber-500 text-white";
    return "bg-slate-500 text-white";
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Layers className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Technology Detector</h2>
            <p className="text-slate-400 mt-1">Identify technologies used on websites</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="results" disabled={techResults.length === 0 && !isPending}>
            Results {techResults.length > 0 && <Badge className="ml-2 bg-indigo-500 text-white">{techResults.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">URL Input</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter a URL to detect its technologies
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
                              className="bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
                              placeholder="https://example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400 text-xs">
                            The website to analyze for technologies
                          </FormDescription>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-indigo-500 text-white hover:bg-indigo-600"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Detecting Technologies...
                        </>
                      ) : (
                        <>
                          <Layers className="mr-2 h-4 w-4" />
                          Detect Technologies
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <Separator className="my-6 bg-slate-700" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300">Export Options</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={handleExportJSON}
                      disabled={techResults.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={handleExportCSV}
                      disabled={techResults.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => copyToClipboard(JSON.stringify(techResults, null, 2))}
                      disabled={techResults.length === 0}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">About Technology Detection</CardTitle>
                <CardDescription className="text-slate-400">
                  How technology detection helps with bug bounty hunting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-medium">Why Detect Technologies?</h3>
                  <p className="text-slate-400 text-sm">
                    Technology detection helps identify what software, frameworks, libraries, and services a website is using. This information is crucial for bug bounty hunters because:
                  </p>
                  <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 ml-2">
                    <li>You can find websites using outdated or vulnerable versions of software</li>
                    <li>Specific vulnerabilities are often associated with particular technologies</li>
                    <li>Some technologies have known security misconfigurations or common pitfalls</li>
                    <li>It helps prioritize testing efforts based on your expertise with certain technologies</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">Common Technology Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Badge className="bg-blue-500/10 text-blue-500 justify-start text-xs py-1 px-3">Web Servers</Badge>
                    <Badge className="bg-green-500/10 text-green-500 justify-start text-xs py-1 px-3">CMS</Badge>
                    <Badge className="bg-purple-500/10 text-purple-500 justify-start text-xs py-1 px-3">JavaScript Frameworks</Badge>
                    <Badge className="bg-amber-500/10 text-amber-500 justify-start text-xs py-1 px-3">Programming Languages</Badge>
                    <Badge className="bg-red-500/10 text-red-500 justify-start text-xs py-1 px-3">Analytics</Badge>
                    <Badge className="bg-indigo-500/10 text-indigo-500 justify-start text-xs py-1 px-3">Security Tools</Badge>
                    <Badge className="bg-orange-500/10 text-orange-500 justify-start text-xs py-1 px-3">Databases</Badge>
                    <Badge className="bg-cyan-500/10 text-cyan-500 justify-start text-xs py-1 px-3">CDN</Badge>
                    <Badge className="bg-pink-500/10 text-pink-500 justify-start text-xs py-1 px-3">Cloud Services</Badge>
                  </div>
                </div>

                <Alert className="bg-indigo-500/10 border-indigo-500/20 text-indigo-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Finding Vulnerabilities</AlertTitle>
                  <AlertDescription className="text-sm">
                    Once you've identified the technologies, research known CVEs and vulnerabilities specific to those technologies, especially for the detected versions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="mt-6 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Technology Detection Results
                    {techResults.length > 0 && (
                      <Badge className="ml-2 bg-indigo-500 text-white">{techResults.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Technologies detected on {form.getValues("url")}
                  </CardDescription>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button
                    variant="outline"
                    className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={handleExportJSON}
                    disabled={techResults.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => window.open(form.getValues("url"), '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Site
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="ml-2 text-slate-400 mt-2">Analyzing website technologies...</span>
                    <Progress value={75} className="w-64 h-2 mt-4 bg-slate-700" />
                  </div>
                ) : noResults ? (
                  <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <AlertTitle>No Technologies Detected</AlertTitle>
                    <AlertDescription>
                      No technologies were detected for this URL. This could be due to restricted access or heavy obfuscation.
                    </AlertDescription>
                  </Alert>
                ) : techResults.length > 0 ? (
                  <div className="space-y-6">
                    {/* Summary by Category */}
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Category Distribution</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(resultsByCategory).map(category => (
                          <Badge key={category} className="bg-indigo-500/10 text-indigo-500">
                            {category}: {resultsByCategory[category].length}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-700" />
                    
                    {/* Detailed Results by Category */}
                    <div className="space-y-6">
                      {Object.entries(resultsByCategory).map(([category, technologies]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="text-white font-medium">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {technologies.map((tech, index) => (
                              <Card key={index} className="bg-slate-900 border-slate-700 hover:border-indigo-500/30 transition-colors">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                      {/* If we had real icons, we'd use them here */}
                                      <div className="w-8 h-8 bg-indigo-500/10 rounded-md flex items-center justify-center text-indigo-500 mr-3">
                                        <Layers className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <h4 className="text-white font-medium">{tech.name}</h4>
                                        {tech.version && (
                                          <p className="text-xs text-slate-400">Version: {tech.version}</p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge className={`${getConfidenceColor(tech.confidence)}`}>
                                      {tech.confidence}%
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Layers className="text-slate-500 mb-2 h-10 w-10" />
                    <p className="text-slate-400">Enter a URL and start detecting to find technologies</p>
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