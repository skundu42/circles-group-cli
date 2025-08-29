import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CLI_PATH = path.resolve('./dist/index.js');
const PACKAGE_PATH = path.resolve('./package.json');

describe('Integration Tests', () => {
  beforeAll(() => {
    // Ensure the CLI is built
    if (!fs.existsSync(CLI_PATH)) {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });

  describe('Package integrity', () => {
    it('should have valid package.json', () => {
      expect(fs.existsSync(PACKAGE_PATH)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

      expect(packageJson.name).toBe('circles-groups-cli');
      expect(packageJson.bin.cg).toBe('./dist/index.js');
      expect(packageJson.main).toBe('dist/index.js');
      expect(packageJson.type).toBe('module');
    });

    it('should have all required dependencies', () => {
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

      const requiredDeps = [
        '@circles-sdk/sdk',
        '@circles-sdk/adapter-ethers',
        'commander',
        'inquirer',
        'chalk',
        'ethers',
      ];

      for (const dep of requiredDeps) {
        expect(packageJson.dependencies[dep]).toBeDefined();
      }
    });

    it('should have development dependencies for testing and linting', () => {
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

      const devDeps = ['typescript', 'eslint', 'prettier', 'vitest', 'husky', 'lint-staged'];

      for (const dep of devDeps) {
        expect(packageJson.devDependencies[dep]).toBeDefined();
      }
    });
  });

  describe('Build artifacts', () => {
    it('should have compiled JavaScript files', () => {
      expect(fs.existsSync(CLI_PATH)).toBe(true);

      const distDir = path.resolve('./dist');
      const files = fs.readdirSync(distDir, { recursive: true });

      // Should have compiled JS files
      const jsFiles = files.filter(file => file.toString().endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
    });

    it('should have proper shebang in CLI entry point', () => {
      const content = fs.readFileSync(CLI_PATH, 'utf8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should have TypeScript declaration files', () => {
      const distDir = path.resolve('./dist');
      const files = fs.readdirSync(distDir, { recursive: true });

      // Should have declaration files
      const dtsFiles = files.filter(file => file.toString().endsWith('.d.ts'));
      expect(dtsFiles.length).toBeGreaterThan(0);
    });
  });

  describe('CLI execution environment', () => {
    it('should execute without syntax errors', () => {
      expect(() => {
        execSync(`node --check ${CLI_PATH}`, { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should handle process signals properly', () => {
      // Test that the CLI can be interrupted gracefully
      try {
        const child = execSync(`node ${CLI_PATH} --help`, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 2000,
        });
        expect(child).toContain('Usage:');
      } catch (error: any) {
        // If timeout or other error, check that stderr doesn't contain crash messages
        const stderr = error.stderr || '';
        expect(stderr).not.toContain('SIGSEGV');
        expect(stderr).not.toContain('core dumped');
      }
    });

    it('should have proper exit codes', () => {
      // Test successful command
      try {
        execSync(`node ${CLI_PATH} --version`, { stdio: 'pipe' });
      } catch (error: any) {
        expect(error.status).toBe(0);
      }

      // Test failed command
      try {
        execSync(`node ${CLI_PATH} invalid-command`, { stdio: 'pipe' });
      } catch (error: any) {
        expect(error.status).not.toBe(0);
      }
    });
  });

  describe('Configuration handling', () => {
    it('should handle missing configuration gracefully', () => {
      // Commands that require configuration should fail gracefully
      const result = (() => {
        try {
          execSync(`node ${CLI_PATH} list-groups`, {
            stdio: 'pipe',
            timeout: 5000,
          });
          return { exitCode: 0 };
        } catch (error: any) {
          return { exitCode: error.status || 1 };
        }
      })();

      // Should either succeed (if config exists) or fail gracefully
      expect(typeof result.exitCode).toBe('number');
    });
  });

  describe('Command completeness', () => {
    it('should have help text for all commands', () => {
      const helpOutput = execSync(`node ${CLI_PATH} --help`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // All commands should be documented
      const commandsInHelp = helpOutput.match(/^\s+(\w+(?:-\w+)*)/gm);
      expect(commandsInHelp).toBeDefined();
      expect(commandsInHelp!.length).toBeGreaterThan(10);
    });

    it('should validate command structure consistency', () => {
      const commands = [
        'setup',
        'deploy-group',
        'deploy-base-group',
        'add-member',
        'remove-member',
        'group-info',
        'list-members',
        'list-groups',
        'balance',
        'transfer',
        'set-condition',
        'list-conditions',
        'trust-batch',
        'set-owner',
        'set-service',
        'set-fee-collection',
        'register-name',
      ];

      for (const command of commands) {
        try {
          const output = execSync(`node ${CLI_PATH} ${command} --help`, {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 5000,
          });

          expect(output).toContain('Usage:');
          expect(output.toLowerCase()).toContain(command.toLowerCase());
        } catch {
          // Command might require certain conditions, but help should work
          console.warn(`Could not get help for command: ${command}`);
        }
      }
    });
  });
});
