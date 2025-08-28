import inquirer from 'inquirer';
import chalk from 'chalk';
import { setGroupService } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo } from '../utils/ui.js';

interface SetGroupServiceOptions {
  group?: string;
  service?: string;
}

export const setGroupServiceCommand = async (options: SetGroupServiceOptions) => {
  try {
    const { group, service } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let serviceAddress = service;

    // If service not provided via CLI, prompt for it
    if (!serviceAddress) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'service',
          message: 'Enter the new service address:',
          validate: (input: string) => {
            if (!input.trim()) return 'Service address is required';
            if (!validateAddress(input)) return 'Invalid Ethereum address';
            return true;
          },
        },
      ]);
      serviceAddress = answers.service;
    } else if (!validateAddress(serviceAddress)) {
      showError('Invalid service address');
      return;
    }

    // At this point, serviceAddress is guaranteed to be a valid string
    if (!serviceAddress) {
      showError('Service address is required');
      return;
    }

    // Confirm the action
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Are you sure you want to set ${serviceAddress} as the new service address for group ${group}?`,
        default: false,
      },
    ]);

    if (!confirm.proceed) {
      showInfo('❌ Service address change cancelled');
      return;
    }

    showInfo(`🔧 Setting new service address for group ${group}...`);

    await setGroupService(group, serviceAddress);

    showSuccess(`✅ Group service address updated successfully!`);
    console.log(chalk.green(`Group: ${group}`));
    console.log(chalk.green(`New Service Address: ${serviceAddress}`));
  } catch (error) {
    showError(`Failed to set group service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
