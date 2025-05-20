import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconMap } from "@/lib/icon-map";
import { Key, Download, Copy, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToJson, exportToCsv } from "@/lib/utils/scan-utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ParameterResult } from "@/lib/types";

const formSchema = z.object({
  url: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .url("Please enter a valid URL (e.g., https://example.com/page)"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ParameterDiscovery() {
  const { toast } = useToast();
  const [parameters, setParameters] = useState<ParameterResult[]>([]);
  const [noResults, setNoResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const { mutate: findParameters, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/tools/parameter-discovery", values);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.parameters.length === 0) {
        setNoResults(true);
        setParameters([]);
        toast({
          title: "No Parameters Found",
          description: "No parameters were found for this URL.",
          variant: "default",
        });
      } else {
        setNoResults(false);
        setParameters(data.parameters);
        toast({
          title: "Scan Complete",
          description: `Found ${data.parameters.length} parameters.`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to find parameters: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setNoResults(false);
    findParameters(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Results copied to clipboard",
        variant: "default",
      });
    });
  };

  const handleExportJSON = () => {
    if (parameters.length === 0) return;
    
    const url = form.getValues("url");
    const data = {
      url,
      parameters,
      timestamp: new Date().toISOString(),
    };
    
    exportToJson(data, `parameters-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: "Exported",
      description: "Results exported as JSON",
      variant: "default",
    });
  };

  const handleExportCSV = () => {
    if (parameters.length === 0) return;
    
    const url = form.getValues("url");
    
    exportToCsv(parameters, `parameters-${new URL(url).hostname}-${new Date().toISOString().split('T')[0]}.csv`);
    
    toast({
      title: "Exported",
      description: "Results exported as CSV",
      variant: "default",
    });
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Key className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Parameter Discovery</h2>
            <p className="text-slate-400 mt-1">Find hidden parameters in web applications</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">URL Input</CardTitle>
            <CardDescription className="text-slate-400">
              Enter a URL to find hidden parameters
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
                          className="bg-slate-900 border-slate-700 text-white focus:border-amber-500 focus:ring-amber-500"
                          placeholder="https://example.com/page"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Parameters...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Discover Parameters
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
                  disabled={parameters.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={handleExportCSV}
                  disabled={parameters.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => copyToClipboard(JSON.stringify(parameters, null, 2))}
                  disabled={parameters.length === 0}
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
            <CardTitle className="text-lg font-semibold text-white">
              Results
              {parameters.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">{parameters.length}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Discovered parameters for the target URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <span className="ml-2 text-slate-400">Finding parameters...</span>
              </div>
            ) : noResults ? (
              <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                  No parameters were found for the target URL. Try a different URL or adjust your search parameters.
                </AlertDescription>
              </Alert>
            ) : parameters.length > 0 ? (
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
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <IconMap name="parameter" className="text-slate-500 mb-2" size={40} />
                <p className="text-slate-400">Enter a URL and start scanning to find parameters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
