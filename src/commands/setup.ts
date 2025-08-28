import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { setWallet, setNetwork, getWallet } from '../utils/config.js';
import { printCommandHeader, divider, kv, cleanupTerminal } from '../utils/ui.js';

// Constants
const PRIVATE_KEY_LENGTH = 66;

export const setupWallet = async () => {
  printCommandHeader('Setting up Circles Groups CLI', '🔧');

  const currentWallet = getWallet();

  if (currentWallet.privateKey && currentWallet.address) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Wallet already configured. Do you want to overwrite it?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled.'));
      return;
    }
  }

  const { walletType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'walletType',
      message: 'How would you like to set up your wallet?',
      choices: [
        { name: 'Enter private key', value: 'privateKey' },
        { name: 'Generate new wallet', value: 'generate' },
        { name: 'Use existing wallet file', value: 'file' },
      ],
    },
  ]);

  let privateKey: string;
  let address: string;

  switch (walletType) {
    case 'privateKey': {
      const { privateKeyInput } = await inquirer.prompt([
        {
          type: 'password',
          name: 'privateKeyInput',
          message: 'Enter your private key:',
          mask: '*',
          validate: (input: string) => {
            if (!input.startsWith('0x')) {
              return 'Private key must start with 0x';
            }
            if (input.length !== PRIVATE_KEY_LENGTH) {
              return 'Invalid private key length';
            }
            try {
              new ethers.Wallet(input);
              return true;
            } catch {
              return 'Invalid private key';
            }
          },
        },
      ]);
      privateKey = privateKeyInput;
      address = new ethers.Wallet(privateKey).address;
      break;
    }

    case 'generate': {
      const spinner = ora('Generating new wallet...').start();
      const wallet = ethers.Wallet.createRandom();
      privateKey = wallet.privateKey;
      address = wallet.address;
      spinner.succeed('New wallet generated!');
      console.log(chalk.red('⚠️  IMPORTANT: Save your private key securely!'));
      console.log(kv('Private Key', privateKey));
      console.log(kv('Address', address));
      break;
    }

    case 'file': {
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter path to your wallet file:',
          default: './wallet.json',
        },
      ]);

      try {
        const fs = await import('fs/promises');
        const walletData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        privateKey = walletData.privateKey;
        address = new ethers.Wallet(privateKey).address;
      } catch (error) {
        console.error(chalk.red('Error reading wallet file:', error));
        return;
      }
      break;
    }

    default:
      console.log(chalk.red('Invalid option'));
      return;
  }

  const rpcUrl = 'https://rpc.gnosischain.com';
  const chainId = 100;

  const setupSpinner = ora('Saving configuration...').start();

  try {
    setWallet(privateKey, address);
    setNetwork(rpcUrl, chainId);
    setupSpinner.succeed('Configuration saved successfully!');

    console.log(chalk.green('\n✅ Setup complete!'));
    console.log(divider());
    console.log(kv('Wallet address', address));
    console.log(kv('Network', rpcUrl));
    console.log(kv('Chain ID', String(chainId)));
    console.log(divider());

    console.log(chalk.blue('\nYou can now use the CLI commands:'));
    console.log(chalk.gray('  cg deploy --name "My Group"'));
    console.log(chalk.gray('  cg add-member --group <address> --member <address>'));
    console.log(chalk.gray('  cg group-info --group <address>'));
  } catch (error) {
    setupSpinner.fail('Failed to save configuration');
    console.error(chalk.red('Error:', error));
  } finally {
    cleanupTerminal();
    process.exit(0);
  }
};
