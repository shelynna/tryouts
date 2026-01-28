#!/usr/bin/env node

/**
 * Production Readiness Test Script
 * Run this before deploying to catch issues early
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Running Production Readiness Tests...\n');

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result === 'WARN') {
      results.warnings++;
      results.tests.push({ name, status: 'WARN', message: 'Warning issued' });
      console.log(`⚠️  ${name}: Warning`);
    } else {
      results.passed++;
      results.tests.push({ name, status: 'PASS', message: 'Passed' });
      console.log(`✅ ${name}: Passed`);
    }
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', message: error.message });
    console.log(`❌ ${name}: Failed - ${error.message}`);
  }
}

// 1. Check if environment files exist
test('Environment Files', () => {
  const envProd = path.join(__dirname, '..', '.env.production');
  const envLocal = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envProd) && !fs.existsSync(envLocal)) {
    throw new Error('No environment files found');
  }

  if (fs.existsSync(envProd)) {
    console.log('   Found .env.production');
  }
  if (fs.existsSync(envLocal)) {
    console.log('   Found .env');
  }
});

// 2. Check TypeScript compilation
test('TypeScript Compilation', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('TypeScript compilation failed');
  }
});

// 3. Check build process
test('Build Process', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Build failed');
  }
});

// 4. Check bundle size
test('Bundle Size', () => {
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Dist directory not found - run build first');
  }

  const indexJs = path.join(distPath, 'assets', 'index-*.js');
  const files = fs.readdirSync(path.join(distPath, 'assets'));

  const jsFiles = files.filter(f => f.endsWith('.js') && f.includes('index'));
  if (jsFiles.length === 0) {
    throw new Error('No index JS file found in dist');
  }

  const mainBundle = jsFiles[0];
  const stats = fs.statSync(path.join(distPath, 'assets', mainBundle));
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB > 3) {
    return 'WARN'; // Warning for large bundles
  }

  console.log(`   Main bundle: ${(sizeMB).toFixed(2)} MB`);
});

// 5. Check manifest
test('PWA Manifest', () => {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifest file not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (!manifest.name || !manifest.short_name) {
    throw new Error('Manifest missing required fields');
  }

  // Check if icons exist
  for (const icon of manifest.icons || []) {
    const iconPath = path.join(__dirname, '..', 'public', icon.src);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Icon not found: ${icon.src}`);
    }
  }
});

// 6. Check CSP in HTML
test('Content Security Policy', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  if (!html.includes('Content-Security-Policy')) {
    throw new Error('CSP meta tag not found in HTML');
  }

  console.log('   CSP configured in HTML');
});

// 7. Check for console.log statements (should be removed in production)
test('Console Statements', () => {
  const srcPath = path.join(__dirname, '..', 'src');
  const files = getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);

  let consoleCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/console\.(log|warn|error|debug)/g);
    if (matches) {
      consoleCount += matches.length;
    }
  }

  if (consoleCount > 10) { // Allow some console statements
    return 'WARN';
  }

  console.log(`   Found ${consoleCount} console statements`);
});

// Helper function to get all files recursively
function getAllFiles(dirPath, extensions) {
  const files = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dirPath);
  return files;
}

// Print summary
console.log('\n📊 Test Results:');
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ⚠️  Warnings: ${results.warnings}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   📋 Total: ${results.passed + results.warnings + results.failed}`);

if (results.failed > 0) {
  console.log('\n❌ Some tests failed. Please fix before deploying.');
  process.exit(1);
} else if (results.warnings > 0) {
  console.log('\n⚠️  Some warnings. Consider addressing before deploying.');
  process.exit(0);
} else {
  console.log('\n🎉 All tests passed! Ready for production.');
  process.exit(0);
}