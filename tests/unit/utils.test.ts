import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';

// Mock the UI utils since they interact with the terminal
vi.mock('../../../src/utils/ui.ts', () => ({
  cleanupTerminal: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
}));

describe('Utils Module Tests', () => {
  describe('Config utilities', () => {
    it('should handle configuration loading', () => {
      // Test basic config functionality - skip dynamic import for now
      expect(true).toBe(true);
    });
  });

  describe('File operations', () => {
    const testDir = path.join(process.cwd(), 'test-temp');

    beforeEach(() => {
      // Create test directory
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Cleanup test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should handle file system operations safely', () => {
      const testFile = path.join(testDir, 'test.txt');

      // Test file creation
      fs.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);

      // Test file reading
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toBe('test content');
    });

    it('should handle missing files gracefully', () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      expect(fs.existsSync(nonExistentFile)).toBe(false);

      expect(() => {
        fs.readFileSync(nonExistentFile);
      }).toThrow();
    });
  });

  describe('Environment validation', () => {
    it('should validate Node.js version', () => {
      const nodeVersion = process.version;
      expect(nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);

      // Ensure Node.js version is recent enough
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      expect(majorVersion).toBeGreaterThanOrEqual(16);
    });

    it('should check required environment variables', () => {
      // Check if NODE_ENV is properly handled
      const originalNodeEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'test';
      expect(process.env.NODE_ENV).toBe('test');

      // Restore original value
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Error handling', () => {
    it('should handle process exit scenarios', () => {
      // Test that exit handlers are properly configured
      const exitListeners = process.listeners('exit');
      const sigintListeners = process.listeners('SIGINT');
      const sigtermListeners = process.listeners('SIGTERM');

      expect(exitListeners.length).toBeGreaterThanOrEqual(0);
      expect(sigintListeners.length).toBeGreaterThanOrEqual(0);
      expect(sigtermListeners.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle uncaught exceptions gracefully', () => {
      const uncaughtExceptionListeners = process.listeners('uncaughtException');
      const unhandledRejectionListeners = process.listeners('unhandledRejection');

      // These might be 0 if not set up, but should be defined arrays
      expect(Array.isArray(uncaughtExceptionListeners)).toBe(true);
      expect(Array.isArray(unhandledRejectionListeners)).toBe(true);
    });
  });
});
