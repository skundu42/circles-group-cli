import inquirer from 'inquirer';
import chalk from 'chalk';
import { registerShortNameWithNonce } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo, cleanupTerminal } from '../utils/ui.js';

interface RegisterShortNameOptions {
  group?: string;
  nonce?: string | number;
}

export const registerShortNameCommand = async (options: RegisterShortNameOptions) => {
  try {
    const { group, nonce } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let nonceValue = nonce;

    // If nonce not provided via CLI, prompt for it
    if (nonceValue === undefined) {
      const answers = await inquirer.prompt([
        {
          type: 'number',
          name: 'nonce',
          message: 'Enter the nonce value for short name registration:',
          validate: (input: number) => {
            if (isNaN(input)) return 'Nonce must be a valid number';
            if (input < 0) return 'Nonce must be non-negative';
            return true;
          },
        },
      ]);
      nonceValue = answers.nonce;
    } else {
      // Validate nonce from CLI
      const parsedNonce = parseInt(String(nonceValue));
      if (isNaN(parsedNonce) || parsedNonce < 0) {
        showError('Nonce must be a valid non-negative number');
        return;
      }
      nonceValue = parsedNonce;
    }

    // Confirm the action
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: `Are you sure you want to register a short name with nonce ${nonceValue} for group ${group}?`,
        default: false,
      },
    ]);

    if (!confirm.proceed) {
      showInfo('❌ Short name registration cancelled');
      return;
    }

    showInfo(`📝 Registering short name with nonce ${nonceValue} for group ${group}...`);

    await registerShortNameWithNonce(group, Number(nonceValue));

    showSuccess(`✅ Short name registration completed successfully!`);
    console.log(chalk.green(`Group: ${group}`));
    console.log(chalk.green(`Nonce: ${nonceValue}`));
  } catch (error) {
    showError(`Failed to register short name: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    cleanupTerminal();
  }
};
