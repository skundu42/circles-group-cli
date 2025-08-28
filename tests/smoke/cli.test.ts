import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve('./dist/src/index.js');

// Helper function to run CLI commands safely
const runCLI = (args: string[]): { stdout: string; stderr: string; exitCode: number } => {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: 10000,
      stdio: 'pipe',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
};

describe('CLI Application Smoke Tests', () => {
  it('should display help when no arguments provided', () => {
    const result = runCLI([]);
    // CLI may exit with 1 when no arguments provided, but should still show help
    expect([0, 1]).toContain(result.exitCode);
    // Check both stdout and stderr as commander may output to either
    const output = result.stdout + result.stderr;
    expect(output).toContain('A comprehensive CLI for managing Circles groups');
  });

  it('should display help with --help flag', () => {
    const result = runCLI(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain('Options:');
  });

  it('should display version with --version flag', () => {
    const result = runCLI(['--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
  });

  it('should show error for unknown command', () => {
    const result = runCLI(['unknown-command']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('unknown command');
  });

  it('should list available commands in help output', () => {
    const result = runCLI(['--help']);
    expect(result.exitCode).toBe(0);

    const expectedCommands = [
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

    for (const command of expectedCommands) {
      expect(result.stdout).toContain(command);
    }
  });

  it('should validate CLI binary exists and is executable', () => {
    expect(() => {
      execSync(`test -f ${CLI_PATH}`, { stdio: 'ignore' });
    }).not.toThrow();
  });
});
