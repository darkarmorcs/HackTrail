import { ScanResult, ResultType, Severity } from "@shared/schema";
import { SubdomainResult, ParameterResult, VulnerabilityResult, SeverityBadgeColors, StatusBadgeColors } from "../types";

export function extractSubdomains(results: ScanResult[]): SubdomainResult[] {
  return results
    .filter(result => result.resultType === ResultType.SUBDOMAIN)
    .map(result => result.details as SubdomainResult);
}

export function extractParameters(results: ScanResult[]): ParameterResult[] {
  return results
    .filter(result => result.resultType === ResultType.PARAMETER)
    .map(result => result.details as ParameterResult);
}

export function extractVulnerabilities(results: ScanResult[]): VulnerabilityResult[] {
  return results
    .filter(result => result.resultType === ResultType.VULNERABILITY)
    .map(result => ({
      ...(result.details as { type: string; description: string }),
      severity: result.severity as Severity
    }));
}

export function countVulnerabilitiesBySeverity(vulnerabilities: VulnerabilityResult[]): Record<Severity, number> {
  return {
    [Severity.CRITICAL]: vulnerabilities.filter(v => v.severity === Severity.CRITICAL).length,
    [Severity.HIGH]: vulnerabilities.filter(v => v.severity === Severity.HIGH).length,
    [Severity.MEDIUM]: vulnerabilities.filter(v => v.severity === Severity.MEDIUM).length,
    [Severity.LOW]: vulnerabilities.filter(v => v.severity === Severity.LOW).length,
    [Severity.INFO]: vulnerabilities.filter(v => v.severity === Severity.INFO).length,
  };
}

export function getVulnerabilitySummary(vulnerabilities: VulnerabilityResult[]) {
  const counts = countVulnerabilitiesBySeverity(vulnerabilities);
  
  return {
    total: vulnerabilities.length,
    critical: counts[Severity.CRITICAL],
    high: counts[Severity.HIGH],
    medium: counts[Severity.MEDIUM],
    low: counts[Severity.LOW]
  };
}

export const severityBadgeColors: SeverityBadgeColors = {
  [Severity.CRITICAL]: { bg: 'bg-red-500/10', text: 'text-red-500' },
  [Severity.HIGH]: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  [Severity.MEDIUM]: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  [Severity.LOW]: { bg: 'bg-green-500/10', text: 'text-green-500' },
  [Severity.INFO]: { bg: 'bg-blue-500/10', text: 'text-blue-500' }
};

export const statusBadgeColors: StatusBadgeColors = {
  'pending': { bg: 'bg-slate-500/10', text: 'text-slate-500' },
  'in_progress': { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  'completed': { bg: 'bg-green-500/10', text: 'text-green-500' },
  'failed': { bg: 'bg-red-500/10', text: 'text-red-500' },
  'cancelled': { bg: 'bg-slate-500/10', text: 'text-slate-500' }
};

export function formatDate(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0];
}

export function exportToJson(data: any, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(data: any[], filename: string): void {
  if (!data.length) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV format
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        if (typeof cell === 'object') {
          return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
        }
        return `"${cell}"`; 
      }).join(',')
    )
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
