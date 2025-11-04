#!/usr/bin/env node

/**
 * Script to update all microservice server files with security middleware.
 *
 * WHY: Applies consistent security controls (rate limiting, CORS, headers)
 * across all 14 microservices by updating their server.js files to use
 * the shared security middleware module.
 */

import { readFileSync, writeFileSync } from 'fs';

const serverFiles = [
  '/home/user/devtools-dashboard/services/ai-safety/prompt-monitor-api/server.js',
  '/home/user/devtools-dashboard/services/ai-safety/robustness-api/server.js',
  '/home/user/devtools-dashboard/services/ai-safety/redteam-api/server.js',
  '/home/user/devtools-dashboard/services/ai-safety/tool-gate-api/server.js',
  '/home/user/devtools-dashboard/services/misinfo/ingest-api/server.js',
  '/home/user/devtools-dashboard/services/misinfo/nlp-api/server.js',
  '/home/user/devtools-dashboard/services/misinfo/facts-api/server.js',
  '/home/user/devtools-dashboard/services/misinfo/forensics-api/server.js',
  '/home/user/devtools-dashboard/services/resilience/compliance-api/server.js',
  '/home/user/devtools-dashboard/services/resilience/logs-api/server.js',
  '/home/user/devtools-dashboard/services/resilience/ransomware-api/server.js',
];

for (const file of serverFiles) {
  console.log(`Processing: ${file}`);

  try {
    let content = readFileSync(file, 'utf-8');

    // Check if already updated
    if (content.includes('applySecurityMiddleware')) {
      console.log(`  ✓ Already updated`);
      continue;
    }

    // Replace imports
    content = content.replace(
      /import cors from ['"]cors['"];?\n/g,
      ''
    );

    // Add security middleware import
    if (!content.includes('security-middleware')) {
      const importMatch = content.match(/import express from ['"]express['"];?/);
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          `${importMatch[0]}\nimport { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';`
        );
      }
    }

    // Replace middleware setup
    content = content.replace(
      /app\.use\(cors\(\)\);?\n?app\.use\(express\.json\(\)\);?/g,
      '// Apply security middleware (headers, CORS, rate limiting, body size limits)\napplySecurityMiddleware(app);'
    );

    // Alternative pattern
    content = content.replace(
      /app\.use\(express\.json\(\)\);?\n?app\.use\(cors\(\)\);?/g,
      '// Apply security middleware (headers, CORS, rate limiting, body size limits)\napplySecurityMiddleware(app);'
    );

    writeFileSync(file, content, 'utf-8');
    console.log(`  ✓ Updated successfully`);
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  }
}

console.log('\n✅ Security update complete!');
