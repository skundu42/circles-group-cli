import chalk from 'chalk';
import ora from 'ora';
import { getBalance as getGroupBalance, validateAddress } from '../utils/circles.js';
import { getWallet, getGroups } from '../utils/config.js';
import { printCommandHeader, divider, kv, nextSteps, formatAddress, cleanupTerminal } from '../utils/ui.js';

interface BalanceOptions {
  group: string;
  user?: string;
}

export const getBalance = async (options: BalanceOptions) => {
  printCommandHeader('Checking balance', '💰');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  const { group: groupAddress, user: userAddress } = options;

  // Validate group address
  if (!validateAddress(groupAddress)) {
    console.log(chalk.red('❌ Invalid group address'));
    process.exit(1);
  }

  // Use current user if no specific user provided
  const targetAddress = userAddress || wallet.address;

  // Validate user address
  if (!validateAddress(targetAddress)) {
    console.log(chalk.red('❌ Invalid user address'));
    process.exit(1);
  }

  const balanceSpinner = ora({ text: 'Fetching balance...', color: 'cyan' }).start();

  try {
    const balance = await getGroupBalance(groupAddress, targetAddress);

    balanceSpinner.succeed('Balance fetched successfully!');

    // Get group info from local config
    const groups = getGroups();
    const groupInfo = groups[groupAddress];

    if (groupInfo) console.log(chalk.green(`\n📋 ${groupInfo.name}`));
    console.log(divider());
    console.log(kv('Group', formatAddress(groupAddress)));
    console.log(kv('User', formatAddress(targetAddress)));
    console.log(kv('Balance', `${balance} tokens`));
    console.log(divider());

    if (targetAddress === wallet.address) {
      nextSteps([
        `cg transfer --group ${groupAddress} --to <address> --amount <amount>`,
        `cg group-info --group ${groupAddress}`,
      ]);
    }
  } catch (error) {
    balanceSpinner.fail('Failed to fetch balance');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        console.log(chalk.yellow('\n💡 Group not found or user is not a member'));
      } else if (error.message.includes('network')) {
        console.log(chalk.yellow('\n💡 Check your network connection'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
