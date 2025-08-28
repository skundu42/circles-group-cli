import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { removeMemberFromGroup, validateAddress, getGroupMembers } from '../utils/circles.js';
import { getWallet } from '../utils/config.js';
import { printCommandHeader, divider, kv, nextSteps, formatAddress, cleanupTerminal } from '../utils/ui.js';

interface RemoveMemberOptions {
  group: string;
  member: string;
}

export const removeMember = async (options: RemoveMemberOptions) => {
  printCommandHeader('Removing member from group', '👋');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  const { group: groupAddress, member: memberAddress } = options;

  // Validate addresses
  if (!validateAddress(groupAddress)) {
    console.log(chalk.red('❌ Invalid group address'));
    process.exit(1);
  }

  if (!validateAddress(memberAddress)) {
    console.log(chalk.red('❌ Invalid member address'));
    process.exit(1);
  }

  // Check if member is in the group
  try {
    const existingMembers = await getGroupMembers(groupAddress);
    const normalizedMemberAddress = memberAddress.toLowerCase();
    if (!existingMembers.includes(normalizedMemberAddress)) {
      console.log(chalk.yellow('⚠️  Member is not in the group'));
      return;
    }
  } catch {
    console.log(chalk.red('❌ Error checking existing members'));
    return;
  }

  // Confirm removal
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove ${memberAddress} from the group?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Removal cancelled.'));
    return;
  }

  const removeSpinner = ora({ text: 'Removing member from group...', color: 'cyan' }).start();

  try {
    await removeMemberFromGroup(groupAddress, memberAddress);

    removeSpinner.succeed('Member removed successfully!');

    console.log(chalk.green('\n✅ Member removed!'));
    console.log(divider());
    console.log(kv('Group', formatAddress(groupAddress)));
    console.log(kv('Member', formatAddress(memberAddress)));
    console.log(divider());
    nextSteps([`cg list-members --group ${groupAddress}`]);
  } catch (error) {
    removeSpinner.fail('Failed to remove member');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('not authorized')) {
        console.log(chalk.yellow('\n💡 Only group owners can remove members'));
      } else if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('\n💡 Make sure you have enough xDAI for gas fees'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
