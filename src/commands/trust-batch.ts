import inquirer from 'inquirer';
import chalk from 'chalk';
import { trustBatchWithConditions, TrustBatchMember } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo } from '../utils/ui.js';

interface TrustBatchOptions {
  group?: string;
  members?: string;
  expiry?: number;
}

export const trustBatchCommand = async (options: TrustBatchOptions) => {
  try {
    const { group, members, expiry } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let memberAddresses: string[] = [];
    let expiryTime = expiry;

    // If members not provided via CLI, prompt for them
    if (!members) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'members',
          message: 'Enter avatar addresses to trust (comma-separated):',
          validate: (input: string) => {
            if (!input.trim()) return 'At least one avatar address is required';
            const addresses = input
              .split(',')
              .map(addr => addr.trim())
              .filter(addr => addr.length > 0);
            if (addresses.length === 0) return 'At least one avatar address is required';

            for (const addr of addresses) {
              if (!validateAddress(addr)) {
                return `Invalid address: ${addr}`;
              }
            }
            return true;
          },
          filter: (input: string) => {
            return input
              .split(',')
              .map(addr => addr.trim())
              .filter(addr => addr.length > 0);
          },
        },
      ]);
      memberAddresses = answers.members;
    } else {
      // Parse members from CLI option
      memberAddresses = members
        .split(',')
        .map((addr: string) => addr.trim())
        .filter((addr: string) => addr.length > 0);

      // Validate all addresses
      for (const addr of memberAddresses) {
        if (!validateAddress(addr)) {
          showError(`Invalid address: ${addr}`);
          return;
        }
      }
    }

    // If expiry not provided via CLI, prompt for it
    if (expiryTime === undefined) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'expiry',
          message: 'Enter expiry timestamp for all members (optional, leave empty for no expiry):',
          default: '',
          filter: (input: string) => {
            if (!input.trim()) return undefined;
            const timestamp = parseInt(input);
            return isNaN(timestamp) ? undefined : timestamp;
          },
          validate: (input: string) => {
            if (!input.trim()) return true;
            const timestamp = parseInt(input);
            if (isNaN(timestamp)) return 'Invalid timestamp';
            if (timestamp <= Date.now() / 1000) return 'Expiry must be in the future';
            return true;
          },
        },
      ]);
      expiryTime = answers.expiry;
    }

    // Convert to TrustBatchMember format
    const batchMembers: TrustBatchMember[] = memberAddresses.map(addr => ({
      address: addr,
      expiry: expiryTime,
    }));

    // Show confirmation
    console.log(chalk.cyan('\n📋 Batch Trust Configuration:'));
    console.log(chalk.cyan(`Group: ${group}`));
    console.log(chalk.cyan(`Members to trust: ${memberAddresses.length}`));
    memberAddresses.forEach((addr, index) => {
      console.log(chalk.cyan(`  ${index + 1}. ${addr}`));
    });
    if (expiryTime) {
      console.log(chalk.cyan(`Expiry: ${new Date(expiryTime * 1000).toISOString()}`));
    } else {
      console.log(chalk.cyan(`Expiry: No expiry`));
    }

    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with batch trust operation?',
        default: true,
      },
    ]);

    if (!confirm.proceed) {
      showInfo('❌ Batch trust operation cancelled');
      return;
    }

    showInfo(`🤝 Trusting ${memberAddresses.length} avatars in batch for group ${group}...`);

    await trustBatchWithConditions(group, batchMembers, expiryTime);

    showSuccess(`✅ Batch trust operation completed successfully!`);
    console.log(chalk.green(`Group: ${group}`));
    console.log(chalk.green(`Members trusted: ${memberAddresses.length}`));
    if (expiryTime) {
      console.log(chalk.green(`Expiry: ${new Date(expiryTime * 1000).toISOString()}`));
    } else {
      console.log(chalk.green(`Expiry: No expiry`));
    }
  } catch (error) {
    showError(`Failed to perform batch trust: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
