import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { IStorage } from './storage';
import { InsertScan, Scan, ScanStatus, InsertScanResult, ScanResult, InsertUser, User } from '@shared/schema';

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  private db: any;
  private pool: Pool;

  constructor() {
    // Connection setup
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(this.pool, { schema });
    
    console.log('Database connection established');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(schema.users).where(schema.users.id.eq(id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await this.db.select().from(schema.users).where(schema.users.username.eq(username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await this.db.insert(schema.users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Scan operations
  async createScan(insertScan: InsertScan): Promise<Scan> {
    try {
      const scanData = {
        ...insertScan,
        status: ScanStatus.PENDING,
        startedAt: new Date(),
        completedAt: null,
        findings: null
      };
      
      const [scan] = await this.db.insert(schema.scans).values(scanData).returning();
      return scan;
    } catch (error) {
      console.error('Error creating scan:', error);
      throw error;
    }
  }

  async getScan(id: number): Promise<Scan | undefined> {
    try {
      const [scan] = await this.db.select().from(schema.scans).where(schema.scans.id.eq(id));
      return scan;
    } catch (error) {
      console.error('Error getting scan:', error);
      return undefined;
    }
  }

  async getAllScans(): Promise<Scan[]> {
    try {
      const scans = await this.db.select().from(schema.scans).orderBy(schema.scans.startedAt.desc());
      return scans;
    } catch (error) {
      console.error('Error getting all scans:', error);
      return [];
    }
  }

  async updateScanStatus(id: number, status: ScanStatus): Promise<Scan | undefined> {
    try {
      const completedAt = status === ScanStatus.COMPLETED ? new Date() : null;
      
      const [updatedScan] = await this.db
        .update(schema.scans)
        .set({ status, completedAt })
        .where(schema.scans.id.eq(id))
        .returning();
        
      return updatedScan;
    } catch (error) {
      console.error('Error updating scan status:', error);
      return undefined;
    }
  }

  async updateScanFindings(id: number, findings: any): Promise<Scan | undefined> {
    try {
      const [updatedScan] = await this.db
        .update(schema.scans)
        .set({ findings })
        .where(schema.scans.id.eq(id))
        .returning();
        
      return updatedScan;
    } catch (error) {
      console.error('Error updating scan findings:', error);
      return undefined;
    }
  }

  // Scan result operations
  async createScanResult(insertResult: InsertScanResult): Promise<ScanResult> {
    try {
      const resultData = {
        ...insertResult,
        severity: insertResult.severity || null,
        timestamp: new Date()
      };
      
      const [result] = await this.db.insert(schema.scanResults).values(resultData).returning();
      return result;
    } catch (error) {
      console.error('Error creating scan result:', error);
      throw error;
    }
  }

  async getScanResults(scanId: number): Promise<ScanResult[]> {
    try {
      const results = await this.db
        .select()
        .from(schema.scanResults)
        .where(schema.scanResults.scanId.eq(scanId))
        .orderBy(schema.scanResults.timestamp.desc());
        
      return results;
    } catch (error) {
      console.error('Error getting scan results:', error);
      return [];
    }
  }
}