import { Scan, ScanResult, ScanType, ScanStatus, ResultType, Severity } from "@shared/schema";

export interface StatsData {
  totalScans: number;
  totalVulnerabilities: number;
  totalSubdomains: number;
  totalParameters: number;
}

export interface ChartData {
  scans: number[];
  vulnerabilities: number[];
  days: string[];
}

export interface VulnerabilitySummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  iconBgColor: string;
  iconColor: string;
}

export interface ScanFormData {
  targetDomain: string;
  scanType: ScanType;
  scanDepth: number;
  saveResults: boolean;
}

export interface SubdomainResult {
  domain: string;
}

export interface ParameterResult {
  name: string;
  type: string;
}

export interface VulnerabilityResult {
  type: string;
  description: string;
  severity: Severity;
}

export interface ScanResultsData {
  scan: Scan;
  results: ScanResult[];
  subdomains: SubdomainResult[];
  parameters: ParameterResult[];
  vulnerabilities: VulnerabilityResult[];
}

export type SeverityBadgeColors = Record<Severity, {
  bg: string;
  text: string;
}>;

export type StatusBadgeColors = Record<ScanStatus, {
  bg: string;
  text: string;
}>;
