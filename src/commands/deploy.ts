import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { deployGroupContract, validateAddress, addGroup, cleanupSDK } from '../utils/circles.js';
import { getWallet } from '../utils/config.js';
import { printCommandHeader, divider, kv, nextSteps, cleanupTerminal } from '../utils/ui.js';

interface DeployGroupOptions {
  name?: string;
  description?: string;
  members?: string;
}

export const deployGroup = async (options: DeployGroupOptions) => {
  printCommandHeader('Deploying new Circles group', '🚀');

  const wallet = getWallet();
  if (!wallet.privateKey || !wallet.address) {
    console.log(chalk.red('❌ Wallet not configured. Run "cg setup" first.'));
    process.exit(1);
  }

  let name = options.name;
  let description = options.description;
  let initialMembers: string[] = [];

  // Interactive prompts if not provided via CLI
  if (!name) {
    const { groupName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'groupName',
        message: 'Enter group name:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Group name is required';
          }
          return true;
        },
      },
    ]);
    name = groupName;
  }

  if (!description) {
    const { groupDescription } = await inquirer.prompt([
      {
        type: 'input',
        name: 'groupDescription',
        message: 'Enter group description (optional):',
      },
    ]);
    description = groupDescription;
  }

  if (options.members) {
    initialMembers = options.members.split(',').map((addr: string) => addr.trim());
  } else {
    const { addInitialMembers } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addInitialMembers',
        message: 'Do you want to add initial members?',
        default: false,
      },
    ]);

    if (addInitialMembers) {
      const { membersInput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'membersInput',
          message: 'Enter member addresses (comma-separated):',
          validate: (input: string) => {
            if (!input.trim()) {
              return true; // Allow empty
            }
            const addresses = input.split(',').map(addr => addr.trim());
            for (const addr of addresses) {
              if (!validateAddress(addr)) {
                return `Invalid address: ${addr}`;
              }
            }
            return true;
          },
        },
      ]);

      if (membersInput.trim()) {
        initialMembers = membersInput.split(',').map((addr: string) => addr.trim());
      }
    }
  }

  // Validate initial members
  for (const member of initialMembers) {
    if (!validateAddress(member)) {
      console.log(chalk.red(`❌ Invalid member address: ${member}`));
      return;
    }
  }

  const deploySpinner = ora({ text: 'Deploying group contract...', color: 'cyan' }).start();

  try {
    const group = await deployGroupContract(name!, description || '', initialMembers);

    deploySpinner.succeed('Group deployed successfully!');

    console.log(chalk.green('\n✅ Group deployed!'));
    console.log(divider());
    console.log(kv('Name', name!));
    if (description) console.log(kv('Description', description));
    console.log(kv('Contract', group.address));
    console.log(kv('Owner', wallet.address));
    if (initialMembers.length > 0) console.log(kv('Initial members', initialMembers.join(', ')));
    console.log(divider());

    // Save group to local config
    addGroup(group.address, name!, description);

    nextSteps([
      `cg add-member --group ${group.address} --member <address>`,
      `cg group-info --group ${group.address}`,
      `cg list-members --group ${group.address}`,
    ]);
  } catch (error) {
    deploySpinner.fail('Failed to deploy group');
    console.error(chalk.red('Error:', error));

    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('\n💡 Make sure you have enough xDAI for gas fees'));
      } else if (error.message.includes('network')) {
        console.log(chalk.yellow('\n💡 Check your network connection and RPC URL'));
      }
    }
  } finally {
    try {
      // Clean up SDK connections
      await cleanupSDK();
    } catch {
      console.warn('Warning: Failed to cleanup SDK connections');
    }

    // Clean up terminal state
    cleanupTerminal();

    // Ensure process exits cleanly
    process.exit(0);
  }
};
