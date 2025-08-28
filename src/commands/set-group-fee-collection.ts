import inquirer from 'inquirer';
import chalk from 'chalk';
import { setGroupFeeCollection } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo } from '../utils/ui.js';

interface SetGroupFeeCollectionOptions {
  group?: string;
  feeCollection?: string;
}

export const setGroupFeeCollectionCommand = async (options: SetGroupFeeCollectionOptions) => {
  try {
    const { group, feeCollection } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let feeCollectionAddress = feeCollection;

    // If fee collection not provided via CLI, prompt for it
    if (!feeCollectionAddress) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'feeCollection',
          message: 'Enter the new fee collection address:',
          validate: (input: string) => {
            if (!input.trim()) return 'Fee collection address is required';
            if (!validateAddress(input)) return 'Invalid Ethereum address';
            return true;
          },
        },
      ]);
      feeCollectionAddress = answers.feeCollection;
    } else if (!validateAddress(feeCollectionAddress)) {
      showError('Invalid fee collection address');
      return;
    }

    // Confirm the action
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Are you sure you want to set ${feeCollectionAddress} as the new fee collection address for group ${group}?`,
        default: false,
      },
    ]);

    if (!confirm.proceed) {
      showInfo('❌ Fee collection address change cancelled');
      return;
    }

    showInfo(`💰 Setting new fee collection address for group ${group}...`);

    await setGroupFeeCollection(group, feeCollectionAddress!);

    showSuccess(`✅ Group fee collection address updated successfully!`);
    console.log(chalk.green(`Group: ${group}`));
    console.log(chalk.green(`New Fee Collection Address: ${feeCollectionAddress}`));
  } catch (error) {
    showError(`Failed to set group fee collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
