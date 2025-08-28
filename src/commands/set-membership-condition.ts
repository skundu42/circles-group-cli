import inquirer from 'inquirer';
import chalk from 'chalk';
import { setMembershipCondition, getMembershipConditions } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showSuccess, showError, showInfo } from '../utils/ui.js';

interface SetMembershipConditionOptions {
  group?: string;
  condition?: string;
  enabled?: boolean;
}

export const setMembershipConditionCommand = async (options: SetMembershipConditionOptions) => {
  try {
    const { group, condition, enabled } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    let membershipCondition = condition;
    let membershipEnabled = enabled;

    // If condition not provided via CLI, prompt for it
    if (!membershipCondition) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'condition',
          message: 'Enter the membership condition (address or condition string):',
          validate: (input: string) => {
            if (!input.trim()) return 'Membership condition is required';
            return true;
          },
        },
      ]);
      membershipCondition = answers.condition;
    }

    // If enabled not provided via CLI, prompt for it
    if (membershipEnabled === undefined) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable this membership condition?',
          default: true,
        },
      ]);
      membershipEnabled = answers.enabled;
    }

    // Ensure all required values are present
    if (!membershipCondition) {
      showError('Membership condition is required');
      return;
    }

    if (membershipEnabled === undefined) {
      showError('Membership enabled status is required');
      return;
    }

    showInfo(`🔧 Setting membership condition for group ${group}...`);

    await setMembershipCondition(group, membershipCondition, membershipEnabled);

    showSuccess(`✅ Membership condition set successfully!`);
    console.log(chalk.green(`Condition: ${membershipCondition}`));
    console.log(chalk.green(`Enabled: ${membershipEnabled}`));

    // Show current membership conditions
    showInfo('\n📋 Current membership conditions:');
    const conditions = await getMembershipConditions(group);

    if (conditions.length === 0) {
      console.log(chalk.yellow('No membership conditions set'));
    } else {
      conditions.forEach((cond, index) => {
        console.log(chalk.cyan(`${index + 1}. ${cond.condition} (${cond.enabled ? 'Enabled' : 'Disabled'})`));
      });
    }
  } catch (error) {
    showError(`Failed to set membership condition: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
