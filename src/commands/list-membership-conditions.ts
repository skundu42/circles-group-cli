import chalk from 'chalk';
import { getMembershipConditions } from '../utils/base-groups.js';
import { validateAddress } from '../utils/circles.js';
import { showError, showInfo } from '../utils/ui.js';

// Constants
const DIVIDER_LENGTH = 50;

interface ListMembershipConditionsOptions {
  group?: string;
}

export const listMembershipConditionsCommand = async (options: ListMembershipConditionsOptions) => {
  try {
    const { group } = options;

    if (!group) {
      showError('Group address is required. Use --group <address>');
      return;
    }

    if (!validateAddress(group)) {
      showError('Invalid group address');
      return;
    }

    showInfo(`📋 Fetching membership conditions for group ${group}...`);

    const conditions = await getMembershipConditions(group);

    console.log(chalk.cyan('\n🏛️  Membership Conditions:'));
    console.log(chalk.cyan('='.repeat(DIVIDER_LENGTH)));

    if (conditions.length === 0) {
      console.log(chalk.yellow('No membership conditions set for this group'));
    } else {
      conditions.forEach((condition, index) => {
        console.log(chalk.white(`${index + 1}. Condition: ${chalk.bold(condition.condition)}`));
        console.log(chalk.gray(`   Status: ${condition.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`));
        console.log('');
      });
    }

    console.log(chalk.cyan(`Total conditions: ${conditions.length}`));
  } catch (error) {
    showError(`Failed to get membership conditions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
