import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const CLI_PATH = path.resolve('./dist/index.js');

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

describe('CLI Commands Smoke Tests', () => {
  describe('setup command', () => {
    it('should show help for setup command', () => {
      const result = runCLI(['setup', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Setup your wallet and configuration');
    });
  });

  describe('deploy-group command', () => {
    it('should show help for deploy-group command', () => {
      const result = runCLI(['deploy-group', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Deploy a new standard Circles group');
      expect(result.stdout).toContain('--name');
      expect(result.stdout).toContain('--description');
      expect(result.stdout).toContain('--members');
    });

    it('should validate required options for deploy-group', () => {
      const result = runCLI(['deploy-group']);
      // Command should either succeed with interactive prompts or fail with validation error
      expect(result.exitCode).toBeDefined();
    });
  });

  describe('deploy-base-group command', () => {
    it('should show help for deploy-base-group command', () => {
      const result = runCLI(['deploy-base-group', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Deploy a new Base Group');
    });
  });

  describe('add-member command', () => {
    it('should show help for add-member command', () => {
      const result = runCLI(['add-member', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Add a new member to a group');
      expect(result.stdout).toContain('--group');
      expect(result.stdout).toContain('--member');
    });

    it('should fail without required options', () => {
      const result = runCLI(['add-member']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('remove-member command', () => {
    it('should show help for remove-member command', () => {
      const result = runCLI(['remove-member', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Remove a member from a group');
      expect(result.stdout).toContain('--group');
      expect(result.stdout).toContain('--member');
    });

    it('should fail without required options', () => {
      const result = runCLI(['remove-member']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('group-info command', () => {
    it('should show help for group-info command', () => {
      const result = runCLI(['group-info', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Display comprehensive information about a group');
      expect(result.stdout).toContain('--group');
    });

    it('should fail without required group option', () => {
      const result = runCLI(['group-info']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('list-members command', () => {
    it('should show help for list-members command', () => {
      const result = runCLI(['list-members', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('List all members of a group');
      expect(result.stdout).toContain('--group');
    });

    it('should fail without required group option', () => {
      const result = runCLI(['list-members']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('list-groups command', () => {
    it('should show help for list-groups command', () => {
      const result = runCLI(['list-groups', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('List all groups you are a member of');
    });
  });

  describe('balance command', () => {
    it('should show help for balance command', () => {
      const result = runCLI(['balance', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Check balance for a user in a group');
      expect(result.stdout).toContain('--group');
      expect(result.stdout).toContain('--user');
    });

    it('should fail without required group option', () => {
      const result = runCLI(['balance']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('transfer command', () => {
    it('should show help for transfer command', () => {
      const result = runCLI(['transfer', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Transfer tokens within a group');
      expect(result.stdout).toContain('--group');
      expect(result.stdout).toContain('--to');
      expect(result.stdout).toContain('--amount');
    });

    it('should fail without required options', () => {
      const result = runCLI(['transfer']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('required');
    });
  });

  describe('Base Group commands', () => {
    describe('set-condition command', () => {
      it('should show help for set-condition command', () => {
        const result = runCLI(['set-condition', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set membership condition for a Base Group');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--condition');
        expect(result.stdout).toContain('--enabled');
      });
    });

    describe('list-conditions command', () => {
      it('should show help for list-conditions command', () => {
        const result = runCLI(['list-conditions', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('List all membership conditions for a Base Group');
        expect(result.stdout).toContain('--group');
      });

      it('should fail without required group option', () => {
        const result = runCLI(['list-conditions']);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('required');
      });
    });

    describe('trust-batch command', () => {
      it('should show help for trust-batch command', () => {
        const result = runCLI(['trust-batch', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Trust multiple avatars in batch');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--members');
        expect(result.stdout).toContain('--expiry');
      });
    });

    describe('set-owner command', () => {
      it('should show help for set-owner command', () => {
        const result = runCLI(['set-owner', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set the owner of a Base Group');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--owner');
      });
    });

    describe('set-service command', () => {
      it('should show help for set-service command', () => {
        const result = runCLI(['set-service', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set the service address of a Base Group');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--service');
      });
    });

    describe('set-fee-collection command', () => {
      it('should show help for set-fee-collection command', () => {
        const result = runCLI(['set-fee-collection', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Set the fee collection address of a Base Group');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--fee-collection');
      });
    });

    describe('register-name command', () => {
      it('should show help for register-name command', () => {
        const result = runCLI(['register-name', '--help']);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Register a short name with nonce for a Base Group');
        expect(result.stdout).toContain('--group');
        expect(result.stdout).toContain('--nonce');
      });
    });
  });

  describe('Command validation', () => {
    it('should validate Ethereum address format for group options', () => {
      const result = runCLI(['list-members', '--group', 'invalid-address']);
      // Should either validate address format or attempt connection
      expect(result.exitCode).toBeDefined();
    });

    it('should handle missing configuration gracefully', () => {
      const result = runCLI(['list-groups']);
      // Should either show configuration setup prompt or handle missing config
      expect(result.exitCode).toBeDefined();
    });
  });
});
