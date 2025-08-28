import chalk from 'chalk';
import ora from 'ora';
import {
  getGroupDetails,
  getGroupMembers,
  getTrustConnections,
  getBalance,
  validateAddress,
  cleanupSDK,
} from '../utils/circles.js';
import { getMembershipConditions } from '../utils/base-groups.js';
import { getWallet, getGroups } from '../utils/config.js';
import { printCommandHeader, divider, kv, formatAddress, cleanupTerminal } from '../utils/ui.js';

interface GroupInfoOptions {
  group: string;
}

export const showGroupInfo = async (options: GroupInfoOptions) => {
  printCommandHeader('Group Information', '📊');

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

  const infoSpinner = ora({ text: 'Fetching group information...', color: 'cyan' }).start();

  try {
    // Get all group data
    const [groupDetails, members, trustConnections, membershipConditions] = await Promise.all([
      getGroupDetails(groupAddress),
      getGroupMembers(groupAddress),
      getTrustConnections(groupAddress),
      getMembershipConditions(groupAddress).catch(() => []), // Handle non-base groups
    ]);

    infoSpinner.succeed('Group information fetched successfully!');

    // Get local group info
    const localGroups = getGroups();
    const localInfo = localGroups[groupAddress];

    // Display group header
    console.log(chalk.green(`\n📋 ${groupDetails.name || localInfo?.name || 'Unknown Group'}`));
    if (groupDetails.description || localInfo?.description) {
      console.log(chalk.gray(`Description: ${groupDetails.description || localInfo?.description}`));
    }
    console.log(divider());

    // Basic group info
    console.log(chalk.blue('📋 Basic Information:'));
    console.log(kv('Contract Address', groupAddress));
    console.log(kv('Group Name', groupDetails.name || 'Unknown'));
    console.log(kv('Group Symbol', groupDetails.symbol || 'Unknown'));
    console.log(kv('Total Members', String(members.length)));
    console.log(kv('Trust Connections', String(trustConnections.length)));
    if (localInfo?.deployedAt) {
      console.log(kv('Deployed', new Date(localInfo.deployedAt).toLocaleDateString()));
    }
    console.log(divider());

    // Group administration
    console.log(chalk.blue('⚙️  Group Administration:'));
    console.log(kv('Owner', formatAddress(groupDetails.owner)));
    console.log(kv('Service Address', formatAddress(groupDetails.service)));
    console.log(kv('Fee Collection', formatAddress(groupDetails.feeCollection)));
    if (groupDetails.shortName) {
      console.log(kv('Short Name', groupDetails.shortName));
    }
    console.log(divider());

    // Token information
    console.log(chalk.blue('🪙 Token Information:'));
    console.log(kv('Token Name', groupDetails.tokenName || 'Unknown'));
    console.log(kv('Token Symbol', groupDetails.tokenSymbol || 'Unknown'));
    console.log(kv('Total Supply', groupDetails.totalSupply || '0'));
    console.log(divider());

    // Membership conditions (for base groups)
    if (membershipConditions.length > 0) {
      console.log(chalk.blue('🔐 Membership Conditions:'));
      for (const condition of membershipConditions) {
        const status = condition.enabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled');
        console.log(chalk.white(`  ${status} ${condition.condition}`));
      }
      console.log(divider());
    }

    // Members section
    console.log(chalk.blue('👥 Members:'));
    if (members.length === 0) {
      console.log(chalk.yellow('  No members found'));
    } else {
      console.log(chalk.white(`  Total members: ${members.length}`));

      // Show current user's membership status
      const isCurrentUserMember = members.some(member => member.toLowerCase() === wallet.address?.toLowerCase());

      if (isCurrentUserMember) {
        console.log(chalk.green(`  ✅ You are a member of this group`));

        // Show current user's balance
        try {
          const balance = await getBalance(groupAddress, wallet.address);
          console.log(chalk.cyan(`  💰 Your balance: ${balance} tokens`));
        } catch {
          console.log(chalk.gray(`  💰 Your balance: Unable to fetch`));
        }
      } else {
        console.log(chalk.yellow(`  ⚠️  You are not a member of this group`));
      }
    }

    // Trust network summary
    console.log(divider());
    console.log(chalk.blue('🤝 Trust Network Summary:'));

    const trustStats = {
      totalConnections: trustConnections.length,
      unlimitedTrusts: trustConnections.filter(conn => conn.limit === '0').length,
      limitedTrusts: trustConnections.filter(conn => conn.limit !== '0').length,
      avgTrustLimit:
        trustConnections.length > 0
          ? trustConnections.filter(conn => conn.limit !== '0').reduce((sum, conn) => sum + parseFloat(conn.limit), 0) /
              trustConnections.filter(conn => conn.limit !== '0').length || 0
          : 0,
    };

    console.log(kv('Total Trust Connections', String(trustStats.totalConnections)));
    console.log(kv('Unlimited Trusts', String(trustStats.unlimitedTrusts)));
    console.log(kv('Limited Trusts', String(trustStats.limitedTrusts)));
    if (trustStats.avgTrustLimit > 0) {
      console.log(kv('Average Trust Limit', trustStats.avgTrustLimit.toFixed(2)));
    }

    // Network connectivity
    if (members.length > 1) {
      const maxPossibleConnections = members.length * (members.length - 1);
      const connectivityPercentage = (trustConnections.length / maxPossibleConnections) * 100;
      console.log(kv('Network Connectivity', `${connectivityPercentage.toFixed(1)}%`));
    }

    console.log(divider());

    // Available actions
    console.log(chalk.blue('🔧 Available Actions:'));
    console.log(chalk.gray(`  • cg add-member --group ${groupAddress} --member <address>`));
    console.log(chalk.gray(`  • cg remove-member --group ${groupAddress} --member <address>`));
    console.log(chalk.gray(`  • cg balance --group ${groupAddress}`));
    console.log(chalk.gray(`  • cg transfer --group ${groupAddress} --to <address> --amount <amount>`));

    // Cleanup and exit
    await cleanupSDK();
    cleanupTerminal();
    process.exit(0);
  } catch (error) {
    infoSpinner.fail('Failed to fetch group information');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        console.log(chalk.yellow("\n💡 Group not found or you don't have access"));
      } else if (error.message.includes('network')) {
        console.log(chalk.yellow('\n💡 Check your network connection'));
      } else if (error.message.includes('Invalid group address')) {
        console.log(chalk.yellow('\n💡 Please provide a valid group address (42 characters starting with 0x)'));
      } else if (error.message.includes('Only Gnosis Chain')) {
        console.log(chalk.yellow('\n💡 This CLI only supports Gnosis Chain mainnet'));
      }
    }
  } finally {
    try {
      await cleanupSDK();
    } catch {
      console.warn('Warning: Failed to cleanup SDK connections');
    }
    cleanupTerminal();
    process.exit(0);
  }
};
