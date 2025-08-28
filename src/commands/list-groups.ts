import chalk from 'chalk';
import ora from 'ora';
import { getUserGroups } from '../utils/circles.js';
import { getWallet, getGroups } from '../utils/config.js';
import { printCommandHeader, divider, kv, formatAddress, nextSteps, cleanupTerminal } from '../utils/ui.js';

export const listGroups = async () => {
  printCommandHeader('Listing your groups', '📋');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  const listSpinner = ora({ text: 'Fetching your groups...', color: 'cyan' }).start();

  try {
    const userGroups = await getUserGroups(wallet.address);
    const localGroups = getGroups();

    listSpinner.succeed('Groups fetched successfully!');

    console.log(chalk.green(`\n👤 Wallet: ${formatAddress(wallet.address!)}`));
    console.log(`${kv('Total groups', String(userGroups.length))}\n`);

    if (userGroups.length === 0) {
      console.log(chalk.yellow('You are not a member of any groups.'));
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.gray('  circles-groups deploy --name "My First Group"'));
      return;
    }

    // Display groups
    console.log(chalk.blue('Your Groups:'));
    console.log(divider());

    for (const group of userGroups) {
      const localInfo = localGroups[group.address];

      if (localInfo) {
        console.log(chalk.white(`📋 ${localInfo.name}`));
        if (localInfo.description) console.log(chalk.gray(`   Description: ${localInfo.description}`));
      } else {
        console.log(chalk.white(`📋 Unknown Group`));
      }
      console.log(chalk.gray(`   Address: ${formatAddress(group.address)}`));
      console.log(chalk.gray(`   Deployed: ${localInfo?.deployedAt || 'Unknown'}\n`));
    }

    nextSteps(['cg list-members --group <address>', 'cg deploy --name "New Group"', 'cg balance --group <address>']);
  } catch (error) {
    listSpinner.fail('Failed to fetch groups');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('network')) {
        console.log(chalk.yellow('\n💡 Check your network connection'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
