import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconMap } from "@/lib/icon-map";
import { Radar, Download, Copy, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportToJson, exportToCsv } from "@/lib/utils/scan-utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Please enter a valid domain name (e.g., example.com)"
    ),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubdomainFinder() {
  const { toast } = useToast();
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [noResults, setNoResults] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
    },
  });

  const { mutate: findSubdomains, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/tools/subdomain-finder", values);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.subdomains.length === 0) {
        setNoResults(true);
        setSubdomains([]);
        toast({
          title: "No Subdomains Found",
          description: "No subdomains were found for this domain.",
          variant: "default",
        });
      } else {
        setNoResults(false);
        setSubdomains(data.subdomains);
        toast({
          title: "Scan Complete",
          description: `Found ${data.subdomains.length} subdomains.`,
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to find subdomains: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setNoResults(false);
    findSubdomains(data);
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
    if (subdomains.length === 0) return;
    
    const domain = form.getValues("domain");
    const data = {
      domain,
      subdomains,
      timestamp: new Date().toISOString(),
    };
    
    exportToJson(data, `subdomains-${domain}-${new Date().toISOString().split('T')[0]}.json`);
    
    toast({
      title: "Exported",
      description: "Results exported as JSON",
      variant: "default",
    });
  };

  const handleExportCSV = () => {
    if (subdomains.length === 0) return;
    
    const domain = form.getValues("domain");
    const data = subdomains.map(subdomain => ({ subdomain }));
    
    exportToCsv(data, `subdomains-${domain}-${new Date().toISOString().split('T')[0]}.csv`);
    
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
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Radar className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Subdomain Finder</h2>
            <p className="text-slate-400 mt-1">Discover subdomains of target websites</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Domain Input</CardTitle>
            <CardDescription className="text-slate-400">
              Enter a domain to find its subdomains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-300">Target Domain</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="example.com"
                          {...field}
                        />
                      </FormControl>
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
                      Finding Subdomains...
                    </>
                  ) : (
                    <>
                      <Radar className="mr-2 h-4 w-4" />
                      Find Subdomains
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
                  disabled={subdomains.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={handleExportCSV}
                  disabled={subdomains.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => copyToClipboard(subdomains.join('\n'))}
                  disabled={subdomains.length === 0}
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
              {subdomains.length > 0 && (
                <Badge className="ml-2 bg-indigo-500 text-white">{subdomains.length}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Discovered subdomains for the target domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="ml-2 text-slate-400">Finding subdomains...</span>
              </div>
            ) : noResults ? (
              <Alert className="bg-slate-700/50 border-slate-600 text-slate-300">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <AlertTitle>No Results Found</AlertTitle>
                <AlertDescription>
                  No subdomains were found for the target domain. Try a different domain or adjust your search parameters.
                </AlertDescription>
              </Alert>
            ) : subdomains.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subdomains.map((subdomain, index) => (
                  <div
                    key={index}
                    className="bg-slate-900 rounded-md p-3 border border-slate-700 flex justify-between items-center"
                  >
                    <span className="text-slate-300 font-mono text-sm truncate">
                      {subdomain}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={() => copyToClipboard(subdomain)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <IconMap name="subdomain" className="text-slate-500 mb-2" size={40} />
                <p className="text-slate-400">Enter a domain and start scanning to find subdomains</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
