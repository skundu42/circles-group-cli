import inquirer from 'inquirer';
import chalk from 'chalk';
import { setGroupOwner } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo, cleanupTerminal } from '../utils/ui.js';

interface SetGroupOwnerOptions {
  group?: string;
  owner?: string;
}

export const setGroupOwnerCommand = async (options: SetGroupOwnerOptions) => {
  try {
    const { group, owner } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let newOwner = owner;

    // If owner not provided via CLI, prompt for it
    if (!newOwner) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'Enter the new owner address:',
          validate: (input: string) => {
            if (!input.trim()) return 'Owner address is required';
            if (!validateAddress(input)) return 'Invalid Ethereum address';
            return true;
          },
        },
      ]);
      newOwner = answers.owner;
    } else if (!validateAddress(newOwner)) {
      showError('Invalid owner address');
      return;
    }

    // Confirm the action
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Are you sure you want to set ${newOwner} as the new owner of group ${group}?`,
        default: false,
      },
    ]);

    if (!confirm.proceed) {
      showInfo('❌ Owner change cancelled');
      return;
    }

    showInfo(`👑 Setting new owner for group ${group}...`);

    await setGroupOwner(group, newOwner!);

    showSuccess(`✅ Group owner updated successfully!`);
    console.log(chalk.green(`Group: ${group}`));
    console.log(chalk.green(`New Owner: ${newOwner}`));
  } catch (error) {
    showError(`Failed to set group owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    cleanupTerminal();
  }
};
