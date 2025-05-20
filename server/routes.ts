import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertScanSchema, 
  insertScanResultSchema, 
  ScanStatus,
  ResultType,
  Severity,
  ScanType
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import dns from "dns";
import util from "util";

const lookup = util.promisify(dns.lookup);
const resolveSrv = util.promisify(dns.resolveSrv);
const resolveTxt = util.promisify(dns.resolveTxt);
const resolve4 = util.promisify(dns.resolve4);
const resolve6 = util.promisify(dns.resolve6);
const resolveMx = util.promisify(dns.resolveMx);
const resolveNs = util.promisify(dns.resolveNs);

export async function registerRoutes(app: Express): Promise<Server> {
  // All API routes should be prefixed with /api
  
  // Get all scans
  app.get("/api/scans", async (_req: Request, res: Response) => {
    try {
      const scans = await storage.getAllScans();
      return res.json(scans);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  // Get scan by id
  app.get("/api/scans/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scan ID" });
      }

      const scan = await storage.getScan(id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      return res.json(scan);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch scan" });
    }
  });

  // Create a new scan
  app.post("/api/scans", async (req: Request, res: Response) => {
    try {
      const validatedData = insertScanSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const scan = await storage.createScan(validatedData.data);
      
      // Start the scan process asynchronously
      processScan(scan.id, validatedData.data.targetDomain, validatedData.data.scanType, validatedData.data.scanDepth);
      
      return res.status(201).json(scan);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create scan" });
    }
  });

  // Get scan results
  app.get("/api/scans/:id/results", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scan ID" });
      }

      const scan = await storage.getScan(id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      const results = await storage.getScanResults(id);
      return res.json(results);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch scan results" });
    }
  });

  // Subdomain enumeration
  app.post("/api/tools/subdomain-finder", async (req: Request, res: Response) => {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      // Perform basic subdomain enumeration using DNS
      const subdomains = await performSubdomainEnumeration(domain);
      
      return res.json({ subdomains });
    } catch (error) {
      return res.status(500).json({ error: "Failed to perform subdomain enumeration" });
    }
  });

  // Parameter discovery
  app.post("/api/tools/parameter-discovery", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Perform parameter discovery using a mock implementation
      const parameters = await performParameterDiscovery(url);
      
      return res.json({ parameters });
    } catch (error) {
      return res.status(500).json({ error: "Failed to perform parameter discovery" });
    }
  });

  // Vulnerability scanning
  app.post("/api/tools/vulnerability-scan", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Perform vulnerability scanning using a mock implementation
      const vulnerabilities = await performVulnerabilityScan(url);
      
      return res.json({ vulnerabilities });
    } catch (error) {
      return res.status(500).json({ error: "Failed to perform vulnerability scan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for scan processing
async function processScan(scanId: number, domain: string, scanType: string, depth: number): Promise<void> {
  try {
    // Update scan status to in progress
    await storage.updateScanStatus(scanId, ScanStatus.IN_PROGRESS);
    
    let findings: any = {};
    
    // Process scan based on type
    switch (scanType) {
      case ScanType.SUBDOMAIN:
        findings = await performSubdomainEnumeration(domain);
        storeSubdomainResults(scanId, findings);
        break;
      case ScanType.PARAMETER:
        findings = await performParameterDiscovery(domain);
        storeParameterResults(scanId, findings);
        break;
      case ScanType.VULNERABILITY:
        findings = await performVulnerabilityScan(domain);
        storeVulnerabilityResults(scanId, findings);
        break;
      case ScanType.FULL:
        // Perform all scan types
        const subdomains = await performSubdomainEnumeration(domain);
        storeSubdomainResults(scanId, subdomains);
        
        const parameters = await performParameterDiscovery(domain);
        storeParameterResults(scanId, parameters);
        
        const vulnerabilities = await performVulnerabilityScan(domain);
        storeVulnerabilityResults(scanId, vulnerabilities);
        
        findings = {
          subdomains,
          parameters,
          vulnerabilities
        };
        break;
      default:
        break;
    }
    
    // Update scan with findings and mark as completed
    await storage.updateScanFindings(scanId, findings);
    await storage.updateScanStatus(scanId, ScanStatus.COMPLETED);
  } catch (error) {
    console.error(`Error processing scan ${scanId}:`, error);
    await storage.updateScanStatus(scanId, ScanStatus.FAILED);
  }
}

async function performSubdomainEnumeration(domain: string): Promise<string[]> {
  try {
    // Basic DNS-based subdomain enumeration
    const subdomains: string[] = [];
    
    // Common subdomain prefixes to check
    const commonPrefixes = [
      'www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'dev',
      'api', 'test', 'staging', 'app', 'support', 'secure',
      'vpn', 'cdn', 'media', 'static', 'forum', 'ns1', 'ns2'
    ];
    
    // Try to resolve each potential subdomain
    for (const prefix of commonPrefixes) {
      const subdomain = `${prefix}.${domain}`;
      try {
        await lookup(subdomain);
        subdomains.push(subdomain);
      } catch {
        // Ignore resolution failures
      }
    }
    
    // Also try to find subdomains using DNS records
    try {
      const nameservers = await resolveNs(domain);
      for (const ns of nameservers) {
        if (!subdomains.includes(ns) && ns.includes(domain)) {
          subdomains.push(ns);
        }
      }
    } catch {
      // Ignore resolution failures
    }
    
    try {
      const mxRecords = await resolveMx(domain);
      for (const mx of mxRecords) {
        if (!subdomains.includes(mx.exchange) && mx.exchange.includes(domain)) {
          subdomains.push(mx.exchange);
        }
      }
    } catch {
      // Ignore resolution failures
    }
    
    return subdomains;
  } catch (error) {
    console.error("Error in subdomain enumeration:", error);
    return [];
  }
}

async function performParameterDiscovery(url: string): Promise<{ name: string, type: string }[]> {
  // This is a simulated implementation since actual parameter discovery
  // would require more complex logic and potentially violate terms of service
  
  // Common parameters that might be found
  const commonParameters = [
    { name: 'id', type: 'number' },
    { name: 'page', type: 'number' },
    { name: 'q', type: 'string' },
    { name: 'search', type: 'string' },
    { name: 'filter', type: 'string' },
    { name: 'sort', type: 'string' },
    { name: 'limit', type: 'number' },
    { name: 'offset', type: 'number' },
    { name: 'token', type: 'string' },
    { name: 'callback', type: 'string' },
    { name: 'redirect', type: 'url' },
    { name: 'lang', type: 'string' },
    { name: 'theme', type: 'string' }
  ];
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a subset of common parameters
  const paramCount = Math.floor(Math.random() * 8) + 3; // 3-10 parameters
  return commonParameters.slice(0, paramCount);
}

async function performVulnerabilityScan(url: string): Promise<{ type: string, description: string, severity: string }[]> {
  // This is a simulated implementation since actual vulnerability scanning
  // would require more complex logic and potentially violate terms of service
  
  // Common vulnerabilities that might be detected
  const potentialVulnerabilities = [
    { type: 'XSS', description: 'Cross-site scripting vulnerability in search parameter', severity: Severity.HIGH },
    { type: 'SQLi', description: 'SQL injection vulnerability in id parameter', severity: Severity.CRITICAL },
    { type: 'CSRF', description: 'Cross-site request forgery vulnerability in form submission', severity: Severity.MEDIUM },
    { type: 'Open Redirect', description: 'Open redirect vulnerability in redirect parameter', severity: Severity.MEDIUM },
    { type: 'Information Disclosure', description: 'Version information disclosed in HTTP headers', severity: Severity.LOW },
    { type: 'Missing Security Headers', description: 'Missing Content-Security-Policy header', severity: Severity.LOW },
    { type: 'Insecure Cookie', description: 'Cookies set without secure flag', severity: Severity.MEDIUM },
    { type: 'Directory Listing', description: 'Directory listing enabled on server', severity: Severity.LOW }
  ];
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Return a subset of potential vulnerabilities
  const vulnCount = Math.floor(Math.random() * 4) + 1; // 1-4 vulnerabilities
  return potentialVulnerabilities.slice(0, vulnCount);
}

// Functions to store scan results
async function storeSubdomainResults(scanId: number, subdomains: string[]): Promise<void> {
  for (const subdomain of subdomains) {
    await storage.createScanResult({
      scanId,
      resultType: ResultType.SUBDOMAIN,
      severity: Severity.INFO,
      details: { domain: subdomain }
    });
  }
}

async function storeParameterResults(scanId: number, parameters: { name: string, type: string }[]): Promise<void> {
  for (const param of parameters) {
    await storage.createScanResult({
      scanId,
      resultType: ResultType.PARAMETER,
      severity: Severity.INFO,
      details: param
    });
  }
}

async function storeVulnerabilityResults(scanId: number, vulnerabilities: { type: string, description: string, severity: string }[]): Promise<void> {
  for (const vuln of vulnerabilities) {
    await storage.createScanResult({
      scanId,
      resultType: ResultType.VULNERABILITY,
      severity: vuln.severity as Severity,
      details: { type: vuln.type, description: vuln.description }
    });
  }
}
