import chalk from 'chalk';
import ora from 'ora';
import { addMemberToGroup, validateAddress, getGroupMembers } from '../utils/circles.js';
import { getWallet } from '../utils/config.js';
import { printCommandHeader, divider, kv, nextSteps, formatAddress, cleanupTerminal } from '../utils/ui.js';

interface AddMemberOptions {
  group: string;
  member: string;
}

export const addMember = async (options: AddMemberOptions) => {
  printCommandHeader('Adding member to group', '👥');

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

  // Check if member is already in the group
  try {
    const existingMembers = await getGroupMembers(groupAddress);
    const normalizedMemberAddress = memberAddress.toLowerCase();
    if (existingMembers.includes(normalizedMemberAddress)) {
      console.log(chalk.yellow('⚠️  Member is already in the group'));
      return;
    }
  } catch {
    console.log(chalk.red('❌ Error checking existing members'));
    return;
  }

  const addSpinner = ora({ text: 'Adding member to group...', color: 'cyan' }).start();

  try {
    await addMemberToGroup(groupAddress, memberAddress);

    addSpinner.succeed('Member added successfully!');

    console.log(chalk.green('\n✅ Member added!'));
    console.log(divider());
    console.log(kv('Group', formatAddress(groupAddress)));
    console.log(kv('Member', formatAddress(memberAddress)));
    console.log(divider());
    nextSteps([`cg group-info --group ${groupAddress}`, `cg list-members --group ${groupAddress}`]);
  } catch (error) {
    addSpinner.fail('Failed to add member');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('not authorized')) {
        console.log(chalk.yellow('\n💡 Only group owners can add members'));
      } else if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('\n💡 Make sure you have enough xDAI for gas fees'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
