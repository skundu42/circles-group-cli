import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  transfer as transferTokens,
  validateAddress,
  validateAmount,
  getBalance as getGroupBalance,
} from '../utils/circles.js';
import { getWallet, getGroups } from '../utils/config.js';
import { printCommandHeader, divider, kv, nextSteps, formatAddress, cleanupTerminal } from '../utils/ui.js';

interface TransferOptions {
  group: string;
  to: string;
  amount: string;
}

export const transfer = async (options: TransferOptions) => {
  printCommandHeader('Transferring tokens', '💸');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  const { group: groupAddress, to: toAddress, amount: transferAmount } = options;

  // Validate addresses
  if (!validateAddress(groupAddress)) {
    console.log(chalk.red('❌ Invalid group address'));
    process.exit(1);
  }

  if (!validateAddress(toAddress)) {
    console.log(chalk.red('❌ Invalid recipient address'));
    process.exit(1);
  }

  // Validate amount
  if (!validateAmount(transferAmount)) {
    console.log(chalk.red('❌ Invalid transfer amount'));
    process.exit(1);
  }

  // Check if transferring to self
  if (toAddress === wallet.address) {
    console.log(chalk.yellow('⚠️  Cannot transfer to yourself'));
    return;
  }

  // Get current balance
  try {
    const currentBalance = await getGroupBalance(groupAddress, wallet.address);
    const balanceNum = parseFloat(currentBalance);
    const amountNum = parseFloat(transferAmount);

    if (amountNum > balanceNum) {
      console.log(
        chalk.red(`❌ Insufficient balance. You have ${currentBalance} tokens, trying to send ${transferAmount}`)
      );
      return;
    }
  } catch {
    console.log(chalk.red('❌ Error checking balance'));
    return;
  }

  // Get group info
  const groups = getGroups();
  const groupInfo = groups[groupAddress];

  // Confirm transfer
  console.log(chalk.blue('Transfer Details:'));
  if (groupInfo) {
    console.log(chalk.gray(`Group: ${groupInfo.name}`));
  }
  console.log(chalk.gray(`From: ${wallet.address}`));
  console.log(chalk.gray(`To: ${toAddress}`));
  console.log(chalk.gray(`Amount: ${transferAmount} tokens`));
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed with this transfer?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Transfer cancelled.'));
    return;
  }

  const transferSpinner = ora({ text: 'Processing transfer...', color: 'cyan' }).start();

  try {
    await transferTokens(groupAddress, toAddress, transferAmount);

    transferSpinner.succeed('Transfer completed successfully!');

    console.log(chalk.green('\n✅ Transfer successful!'));
    console.log(divider());
    console.log(kv('Group', formatAddress(groupAddress)));
    console.log(kv('From', formatAddress(wallet.address!)));
    console.log(kv('To', formatAddress(toAddress)));
    console.log(kv('Amount', `${transferAmount} tokens`));
    console.log(divider());

    // Show updated balance
    try {
      const newBalance = await getGroupBalance(groupAddress, wallet.address);
      console.log(kv('New balance', `${newBalance} tokens`));
    } catch {
      console.log(chalk.yellow('Could not fetch updated balance'));
    }

    nextSteps([`cg balance --group ${groupAddress}`, `cg list-members --group ${groupAddress}`]);
  } catch (error) {
    transferSpinner.fail('Transfer failed');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('insufficient balance')) {
        console.log(chalk.yellow('\n💡 Insufficient balance for transfer'));
      } else if (error.message.includes('not trusted')) {
        console.log(chalk.yellow('\n💡 Recipient is not trusted or trust limit exceeded'));
      } else if (error.message.includes('not authorized')) {
        console.log(chalk.yellow('\n💡 You are not authorized to transfer in this group'));
      } else if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('\n💡 Make sure you have enough xDAI for gas fees'));
      }
    }
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
