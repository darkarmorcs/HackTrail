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
      const { domain, techniques = "all", wordlist = "default" } = req.body;
      
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      // Perform enhanced subdomain enumeration using multiple techniques
      const subdomains = await performSubdomainEnumeration(domain, techniques, wordlist);
      
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
  
  // Content discovery
  app.post("/api/tools/content-discovery", async (req: Request, res: Response) => {
    try {
      const { 
        url, 
        wordlistType = "default", 
        recursive = false, 
        fileExtensions = "", 
        threads = 5,
        statusCodesToInclude = "200,204,301,302,307,401,403" 
      } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // Validate URL format
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
      }
      
      // For now, generate simulated content discovery results
      // In a real implementation, this would connect to target and check paths
      const paths = await simulateContentDiscovery(
        url, 
        wordlistType, 
        recursive, 
        fileExtensions, 
        parseInt(String(threads)), 
        statusCodesToInclude
      );
      
      return res.json({ paths });
    } catch (error) {
      console.error("Content discovery error:", error);
      return res.status(500).json({ error: "Failed to perform content discovery" });
    }
  });

  // Add function for content discovery implementation
  app.get("/api/wordlists", async (_req: Request, res: Response) => {
    try {
      const wordlists = {
        default: { name: "Default", count: 1000, description: "Common paths for web applications" },
        common: { name: "Common", count: 5000, description: "Extended list of common web paths" },
        large: { name: "Large", count: 20000, description: "Comprehensive list of potential paths" }
      };
      return res.json({ wordlists });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch wordlists" });
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

async function performSubdomainEnumeration(domain: string, techniques = "all", wordlist = "default"): Promise<string[]> {
  try {
    // Enhanced subdomain enumeration with multiple techniques
    const subdomains: string[] = [];
    
    // Common subdomain prefixes for basic enumeration
    let prefixes: string[] = [];
    
    // Select wordlist based on parameter
    if (wordlist === "default") {
      prefixes = [
        'www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'dev',
        'api', 'test', 'staging', 'app', 'support', 'secure',
        'vpn', 'cdn', 'media', 'static', 'forum', 'ns1', 'ns2'
      ];
    } else if (wordlist === "common") {
      // Extended list for common enumeration
      prefixes = [
        'www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'dev', 'api', 'test', 'staging', 'app', 
        'support', 'secure', 'vpn', 'cdn', 'media', 'static', 'forum', 'ns1', 'ns2', 'portal', 
        'intranet', 'remote', 'server', 'services', 'store', 'web', 'cloud', 'exchange', 'internal',
        'corp', 'docs', 'download', 'downloads', 'email', 'host', 'login', 'manage', 'management',
        'mobile', 'new', 'news', 'old', 'pop', 'pop3', 'private', 'repository', 'search', 'smtp',
        'social', 'sql', 'ssh', 'staff', 'svn', 'ww1', 'ww2', 'www1', 'www2', 'git', 'beta', 'demo'
      ];
    } else if (wordlist === "large") {
      // Load an extended wordlist for more comprehensive scanning
      prefixes = [
        'www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'dev', 'api', 'test', 'staging', 'app', 
        'support', 'secure', 'vpn', 'cdn', 'media', 'static', 'forum', 'ns1', 'ns2', 'portal', 
        'intranet', 'remote', 'server', 'services', 'store', 'web', 'cloud', 'exchange', 'internal',
        'corp', 'docs', 'download', 'downloads', 'email', 'host', 'login', 'manage', 'management',
        'mobile', 'new', 'news', 'old', 'pop', 'pop3', 'private', 'repository', 'search', 'smtp',
        'social', 'sql', 'ssh', 'staff', 'svn', 'ww1', 'ww2', 'www1', 'www2', 'git', 'beta', 'demo',
        // Additional extended prefixes
        'accounting', 'accounts', 'analytics', 'apollo', 'assets', 'auth', 'authentication',
        'backup', 'backups', 'billing', 'calendar', 'chat', 'cms', 'community', 'config',
        'connect', 'contact', 'control', 'core', 'cp', 'crm', 'customer', 'customers', 'dashboard',
        'data', 'database', 'db', 'debug', 'desktop', 'dev1', 'dev2', 'development', 'devops',
        'director', 'directory', 'dns', 'domain', 'domains', 'drupal', 'edu', 'events', 'example',
        'extranet', 'feed', 'file', 'files', 'finance', 'forms', 'gateway', 'groups', 'help',
        'home', 'hr', 'httpd', 'id', 'image', 'images', 'imap', 'img', 'info', 'integration',
        'internet', 'ip', 'ipv6', 'jenkins', 'jira', 'lab', 'labs', 'library', 'link', 'lists',
        'localhost', 'log', 'logs', 'lyncdiscover', 'mail2', 'mailgate', 'manager', 'marketing',
        'member', 'members', 'mercury', 'monitor', 'monitoring', 'mssql', 'mysql', 'name', 'nat',
        'new-staff', 'newmail', 'newsletter', 'ns3', 'ns4', 'office', 'online', 'operations', 'oracle',
        'order', 'orders', 'owa', 'partners', 'password', 'payments', 'payroll', 'pgsql', 'phpmyadmin',
        'podcast', 'preprod', 'pre-prod', 'preview', 'print', 'priv', 'prod', 'production', 'profiles',
        'project', 'projects', 'proxy', 'public', 'qa', 'redirect', 'reports', 'research', 'resources',
        'restricted', 'reviews', 'root', 'router', 'rss', 's1', 's2', 's3', 'sales', 'sample', 'samples',
        'sandbox', 'sc', 'search', 'secure1', 'secure2', 'security', 'seo', 'server1', 'server2',
        'service', 'sftp', 'sharepoint', 'shop2', 'signup', 'site', 'siteadmin', 'sitebuilder',
        'sites', 'sms', 'solr', 'sso', 'status', 'storage', 'store2', 'streaming', 'support2',
        'surveys', 'sysadmin', 'system', 'teamcity', 'temp', 'terraform', 'tftp', 'thunder', 'ticket',
        'tickets', 'time', 'tools', 'tracking', 'traffic', 'training', 'translate', 'traveler',
        'ts', 'update', 'updates', 'upload', 'uploads', 'user', 'users', 'video', 'videos', 'view',
        'virtual', 'vm', 'voip', 'vpn2', 'weather', 'webadmin', 'webconf', 'webdisk', 'webmail',
        'webmaster', 'wordpress', 'workspace', 'wp', 'www3', 'www4', 'jenkins', 'jira', 'gitlab',
        'github', 'status', 'confluence', 'wiki', 'grafana', 'prometheus', 'kibana', 'elastic',
        'splunk', 'nagios', 'zabbix', 'kubernetes', 'k8s', 'redis', 'memcached', 'mongodb'
      ];
    } else if (wordlist === "custom" && Array.isArray(techniques)) {
      // Use the provided custom wordlist
      prefixes = techniques;
    }
    
    // Remove duplicates
    prefixes = [...new Set(prefixes)];
    
    // Techniques to use for enumeration
    const useDNS = techniques === "all" || techniques === "dns";
    const useBruteForce = techniques === "all" || techniques === "bruteforce";
    const usePermutations = techniques === "all" || techniques === "permutations";
    
    // 1. DNS-based enumeration
    if (useDNS) {
      // Try to find subdomains using DNS records
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
      
      // Try to get TXT records which might contain subdomain info
      try {
        const txtRecords = await resolveTxt(domain);
        for (const txt of txtRecords) {
          // Look for SPF records that might have domain info
          const txtStr = txt.join('');
          if (txtStr.includes('include:')) {
            const matches = txtStr.match(/include:([a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+)/g);
            if (matches) {
              for (const match of matches) {
                const includeDomain = match.substring(8); // Remove 'include:'
                if (includeDomain.includes(domain) && !subdomains.includes(includeDomain)) {
                  subdomains.push(includeDomain);
                }
              }
            }
          }
        }
      } catch {
        // Ignore resolution failures
      }
    }
    
    // 2. Brute force common subdomains
    if (useBruteForce) {
      const lookupPromises = prefixes.map(async (prefix) => {
        const subdomain = `${prefix}.${domain}`;
        try {
          await lookup(subdomain);
          return subdomain;
        } catch {
          return null;
        }
      });
      
      // Run DNS lookups in batches to avoid overwhelming the DNS server
      const batchSize = 10;
      for (let i = 0; i < lookupPromises.length; i += batchSize) {
        const batch = lookupPromises.slice(i, i + batchSize);
        const results = await Promise.all(batch);
        results.forEach(result => {
          if (result && !subdomains.includes(result)) {
            subdomains.push(result);
          }
        });
      }
    }
    
    // 3. Permutation-based discovery (combine discovered subdomains with common prefixes)
    if (usePermutations && subdomains.length > 0) {
      const discoveredPrefixes = subdomains.map(s => s.split('.')[0]);
      const permutations = new Set<string>();
      
      // Create permutations with common separators
      const separators = ['-', '.'];
      for (const prefix of discoveredPrefixes) {
        for (const commonPrefix of prefixes) {
          for (const separator of separators) {
            permutations.add(`${prefix}${separator}${commonPrefix}.${domain}`);
            permutations.add(`${commonPrefix}${separator}${prefix}.${domain}`);
          }
        }
      }
      
      // Try to resolve permutation-based subdomains
      const permutationPromises = Array.from(permutations).map(async (subdomain) => {
        try {
          await lookup(subdomain);
          return subdomain;
        } catch {
          return null;
        }
      });
      
      // Run in batches
      const batchSize = 10;
      for (let i = 0; i < permutationPromises.length; i += batchSize) {
        const batch = permutationPromises.slice(i, i + batchSize);
        const results = await Promise.all(batch);
        results.forEach(result => {
          if (result && !subdomains.includes(result)) {
            subdomains.push(result);
          }
        });
      }
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

// Function to simulate content discovery (for demonstration purposes)
async function simulateContentDiscovery(
  url: string,
  wordlistType: string,
  recursive: boolean,
  fileExtensions: string,
  threads: number,
  statusCodesToInclude: string
): Promise<{ path: string, statusCode: number, contentType?: string, contentLength?: number }[]> {
  // Parse the input parameters
  const baseUrl = new URL(url);
  const statusCodes = statusCodesToInclude.split(',').map(code => parseInt(code.trim()));
  const extensions = fileExtensions ? fileExtensions.split(',').map(ext => ext.trim()) : [''];
  
  // Simulate processing time based on wordlist size and options
  const processingDelay = wordlistType === 'large' ? 3000 : (wordlistType === 'common' ? 2000 : 1000);
  await new Promise(resolve => setTimeout(resolve, processingDelay));
  
  // Determine number of results based on wordlist type
  let resultCount = 0;
  switch(wordlistType) {
    case 'large': resultCount = Math.floor(Math.random() * 15) + 10; break;   // 10-25 results
    case 'common': resultCount = Math.floor(Math.random() * 10) + 5; break;   // 5-15 results
    default: resultCount = Math.floor(Math.random() * 5) + 3; break;          // 3-8 results
  }
  
  // Add more results if recursive is enabled
  if (recursive) {
    resultCount += Math.floor(resultCount * 0.5);
  }
  
  // Common content types
  const contentTypes = [
    'text/html',
    'application/json',
    'text/plain',
    'application/xml',
    'application/javascript',
    'text/css',
    'application/pdf'
  ];
  
  // Common paths for simulation (these would come from wordlists in real impl)
  const commonPaths = [
    '/admin',
    '/login',
    '/api',
    '/backup',
    '/config',
    '/dashboard',
    '/dev',
    '/docs',
    '/images',
    '/includes',
    '/js',
    '/log',
    '/logs',
    '/old',
    '/private',
    '/robots.txt',
    '/sitemap.xml',
    '/temp',
    '/test',
    '/uploads',
    '/v1',
    '/v2',
    '/wp-admin',
    '/wp-content',
    '/administrator',
    '/.git',
    '/.env',
    '/phpinfo.php',
    '/info.php',
    '/server-status',
    '/console',
    '/api/v1',
    '/api/users',
    '/backup.zip',
    '/config.json',
    '/debug',
    '/.htpasswd',
    '/assets'
  ];
  
  // Generate results
  const results: { path: string, statusCode: number, contentType?: string, contentLength?: number }[] = [];
  
  // Add some directory results
  const directories = shuffle(commonPaths).slice(0, resultCount/2);
  for (const dir of directories) {
    const statusCode = randomChoice(statusCodes.length > 0 ? statusCodes : [200, 301, 302, 403]);
    results.push({
      path: dir,
      statusCode,
      contentType: statusCode < 300 ? 'text/html' : undefined,
      contentLength: statusCode < 300 ? Math.floor(Math.random() * 50000) + 1000 : undefined
    });
    
    // Add a subdirectory if recursive is enabled
    if (recursive && Math.random() > 0.7) {
      const subDir = randomChoice(['config', 'includes', 'old', 'backup', 'test']);
      results.push({
        path: `${dir}/${subDir}`,
        statusCode: randomChoice([200, 403, 301]),
        contentType: 'text/html',
        contentLength: Math.floor(Math.random() * 30000) + 500
      });
    }
  }
  
  // Add some file results with extensions
  const files = shuffle(commonPaths).slice(0, resultCount/2);
  for (const file of files) {
    for (const ext of extensions) {
      if (Math.random() > 0.6 || ext === '') continue; // Skip some to avoid too many results
      
      const filePath = ext ? `${file}.${ext}` : file;
      const statusCode = randomChoice(statusCodes.length > 0 ? statusCodes : [200, 404, 403]);
      
      let contentType: string | undefined;
      switch(ext) {
        case 'html': contentType = 'text/html'; break;
        case 'js': contentType = 'application/javascript'; break;
        case 'json': contentType = 'application/json'; break;
        case 'xml': contentType = 'application/xml'; break;
        case 'txt': contentType = 'text/plain'; break;
        case 'php': contentType = 'text/html'; break;
        default: contentType = randomChoice(contentTypes);
      }
      
      results.push({
        path: filePath,
        statusCode,
        contentType: statusCode < 300 ? contentType : undefined,
        contentLength: statusCode < 300 ? Math.floor(Math.random() * 100000) + 500 : undefined
      });
    }
  }
  
  // Ensure we have the requested number of results
  return results.slice(0, resultCount);
}

// Helper function to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Helper function to choose a random item from an array
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
