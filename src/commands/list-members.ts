import chalk from 'chalk';
import ora from 'ora';
import { getGroupMembers, validateAddress } from '../utils/circles.js';
import { getGroups, getWallet } from '../utils/config.js';
import { printCommandHeader, kv, formatAddress, nextSteps, cleanupTerminal } from '../utils/ui.js';

interface ListMembersOptions {
  group: string;
}

export const listMembers = async (options: ListMembersOptions) => {
  printCommandHeader('Listing group members', '👥');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  const { group: groupAddress } = options;

  // Validate address
  if (!validateAddress(groupAddress)) {
    console.log(chalk.red('❌ Invalid group address'));
    process.exit(1);
  }

  const listSpinner = ora({ text: 'Fetching group members...', color: 'cyan' }).start();

  try {
    const members = await getGroupMembers(groupAddress);

    listSpinner.succeed('Members fetched successfully!');

    // Get group info from local config
    const groups = getGroups();
    const groupInfo = groups[groupAddress];

    if (groupInfo) {
      console.log(chalk.green(`\n📋 ${groupInfo.name}`));
      if (groupInfo.description) console.log(chalk.gray(`Description: ${groupInfo.description}`));
    }
    console.log(kv('Address', formatAddress(groupAddress)));
    console.log(`${kv('Total members', String(members.length))}\n`);

    // Create JSON output
    const jsonOutput = {
      groupAddress: groupAddress,
      totalMembers: members.length,
      members: members,
    };

    // Output JSON data
    console.log(chalk.blue('📄 Member Data:'));
    console.log(JSON.stringify(jsonOutput, null, 2));

    nextSteps([
      `cg add-member --group ${groupAddress} --member <address>`,
      `cg group-info --group ${groupAddress}`,
      `cg balance --group ${groupAddress}`,
    ]);
  } catch (error) {
    listSpinner.fail('Failed to fetch members');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        console.log(chalk.yellow("\n💡 Group not found or you don't have access"));
      } else if (error.message.includes('network')) {
        console.log(chalk.yellow('\n💡 Check your network connection'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
