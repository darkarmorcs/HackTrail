import { 
  users, type User, type InsertUser,
  scans, type Scan, type InsertScan,
  scanResults, type ScanResult, type InsertScanResult,
  ScanStatus
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scan operations
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  getAllScans(): Promise<Scan[]>;
  updateScanStatus(id: number, status: ScanStatus): Promise<Scan | undefined>;
  updateScanFindings(id: number, findings: any): Promise<Scan | undefined>;
  
  // Scan result operations
  createScanResult(result: InsertScanResult): Promise<ScanResult>;
  getScanResults(scanId: number): Promise<ScanResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private scanResults: Map<number, ScanResult>;
  private userId: number;
  private scanId: number;
  private resultId: number;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.scanResults = new Map();
    this.userId = 1;
    this.scanId = 1;
    this.resultId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Scan operations
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanId++;
    const scan: Scan = { 
      ...insertScan, 
      id, 
      status: ScanStatus.PENDING, 
      startedAt: new Date(), 
      completedAt: null,
      findings: null
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getAllScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async updateScanStatus(id: number, status: ScanStatus): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;

    const updatedScan: Scan = { 
      ...scan, 
      status, 
      completedAt: status === ScanStatus.COMPLETED ? new Date() : scan.completedAt 
    };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async updateScanFindings(id: number, findings: any): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;

    const updatedScan: Scan = { ...scan, findings };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  // Scan result operations
  async createScanResult(insertResult: InsertScanResult): Promise<ScanResult> {
    const id = this.resultId++;
    // Ensure severity is never undefined by defaulting to null
    const result: ScanResult = { 
      ...insertResult, 
      id, 
      timestamp: new Date(),
      severity: insertResult.severity || null 
    };
    this.scanResults.set(id, result);
    return result;
  }

  async getScanResults(scanId: number): Promise<ScanResult[]> {
    return Array.from(this.scanResults.values())
      .filter(result => result.scanId === scanId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
