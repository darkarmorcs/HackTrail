# Bug Bounty Hunting Tool

A comprehensive security testing application with subdomain enumeration, parameter discovery, and vulnerability testing features. This tool provides security researchers and bug bounty hunters with a suite of utilities to identify potential vulnerabilities in web applications.

## Features

- **Dashboard**: Overview of scan statistics and recent activity
- **Subdomain Enumeration**: Discover subdomains of a target domain
- **Parameter Discovery**: Find hidden parameters in web applications
- **Vulnerability Scanner**: Detect security vulnerabilities in web applications
- **Scan History**: Track and review previous security scans
- **Detailed Reports**: View comprehensive scan results with severity ratings

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express
- **State Management**: TanStack React Query
- **Routing**: wouter
- **Form Handling**: React Hook Form with Zod validation
- **Storage**: In-memory storage (configurable for production use)


## Running Locally

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL or MySQL database (optional, for persistent storage)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/bug-bounty-hunting-tool.git
   cd bug-bounty-hunting-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure database (optional):

   **PostgreSQL**:
   ```
   # Create a new PostgreSQL database
   createdb bug_bounty_tool
   
   # Set environment variables in .env file
   DATABASE_URL=postgresql://username:password@localhost:5432/bug_bounty_tool
   ```

   **MySQL**:
   ```
   # Create a new MySQL database
   mysql -u root -p -e "CREATE DATABASE bug_bounty_tool;"
   
   # Set environment variables in .env file
   DATABASE_URL=mysql://username:password@localhost:3306/bug_bounty_tool
   ```

4. Initialize the database (if using database storage):
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at:
   ```
   http://localhost:5000
   ```

## Application Structure

- `client/`: Frontend React application
  - `src/components/`: UI components
  - `src/pages/`: Application pages
  - `src/lib/`: Utilities and shared code
  - `src/hooks/`: Custom React hooks

- `server/`: Backend Express server
  - `index.ts`: Server entry point
  - `routes.ts`: API routes
  - `storage.ts`: Data storage implementation

- `shared/`: Code shared between client and server
  - `schema.ts`: Data models and validation schemas

## Usage Guide

### Starting a New Scan

1. Navigate to the Dashboard
2. Click the "New Scan" button
3. Enter the target domain (e.g., example.com)
4. Select the scan type
   - Full Scan: Performs all available scans
   - Subdomain Enumeration: Discovers subdomains
   - Parameter Discovery: Finds hidden parameters
   - Vulnerability Scan: Tests for security vulnerabilities
5. Set the scan depth (1-5, higher values perform more thorough scans)
6. Click "Start Scan"

### Viewing Scan Results

1. Navigate to Scan History
2. Find your scan in the list
3. Click "View Results"
4. Review the findings across different tabs:
   - Vulnerabilities
   - Subdomains
   - Parameters

### Using Individual Tools

You can also use each tool independently:

1. Navigate to the desired tool from the sidebar
2. Enter the target URL or domain
3. Start the scan
4. View and export the results

## Troubleshooting

If you encounter any issues:

1. Ensure all dependencies are installed
2. Check console for error messages
3. Verify that the server is running (port 5000)
4. For navigation issues, ensure you're using the latest version of the application
5. For "component not found" errors, try restarting the application

## Future Enhancements

- Content Discovery: Find hidden directories and files
- Port Scanner: Discover open ports on target systems
- Technology Detector: Identify technologies used by target applications
- Enhanced reporting capabilities
- Integration with vulnerability databases
