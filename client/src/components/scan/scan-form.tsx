import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScanType } from "@shared/schema";
import { ScanFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

// Form validation schema
const formSchema = z.object({
  targetDomain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Please enter a valid domain name (e.g., example.com)"
    ),
  scanType: z.nativeEnum(ScanType),
  scanDepth: z.number().min(1).max(5),
  saveResults: z.boolean().default(true),
});

interface ScanFormProps {
  onSubmit: (data: ScanFormData) => void;
  defaultValues: ScanFormData;
  isLoading: boolean;
}

export function ScanForm({ onSubmit, defaultValues, isLoading }: ScanFormProps) {
  const form = useForm<ScanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="targetDomain"
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scanType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-300">Scan Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Select scan type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value={ScanType.FULL} className="focus:bg-slate-800 focus:text-white">Full Scan</SelectItem>
                  <SelectItem value={ScanType.SUBDOMAIN} className="focus:bg-slate-800 focus:text-white">Subdomain Enumeration</SelectItem>
                  <SelectItem value={ScanType.PARAMETER} className="focus:bg-slate-800 focus:text-white">Parameter Discovery</SelectItem>
                  <SelectItem value={ScanType.VULNERABILITY} className="focus:bg-slate-800 focus:text-white">Vulnerability Scan</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scanDepth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-slate-300">Scan Depth</FormLabel>
              <div className="flex items-center">
                <FormControl>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[field.value]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                    className="h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </FormControl>
                <span className="text-white ml-2">{field.value}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Fast</span>
                <span>Thorough</span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="saveResults"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-slate-300">
                  Save results for later analysis
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="text-slate-300 hover:text-white bg-transparent border-slate-700 hover:bg-slate-700"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-500 text-white hover:bg-indigo-600"
            disabled={isLoading}
          >
            {isLoading ? "Starting Scan..." : "Start Scan"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
