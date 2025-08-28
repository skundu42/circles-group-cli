import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  createBaseGroup,
  validateBaseGroupProfile,
  validateBaseGroupSetup,
  BaseGroupProfile,
  BaseGroupSetup,
} from '../utils/base-groups.js';
import { getSigner, validateAddress, cleanupSDK } from '../utils/circles.js';
import { showSuccess, showError, showInfo, cleanupTerminal, divider, kv } from '../utils/ui.js';

const MAX_GROUP_NAME_LENGTH = 50;
const MIN_SYMBOL_LENGTH = 3;
const MAX_SYMBOL_LENGTH = 8;
const MAX_DESCRIPTION_LENGTH = 500;

const getProfileQuestions = () => [
  {
    type: 'input',
    name: 'name',
    message: 'Enter the group name:',
    validate: (input: string) => {
      if (!input.trim()) return 'Group name is required';
      if (input.length > MAX_GROUP_NAME_LENGTH)
        return `Group name must be less than ${MAX_GROUP_NAME_LENGTH} characters`;
      return true;
    },
  },
  {
    type: 'input',
    name: 'symbol',
    message: `Enter the group symbol (${MIN_SYMBOL_LENGTH}-${MAX_SYMBOL_LENGTH} characters):`,
    validate: (input: string) => {
      if (!input.trim()) return 'Group symbol is required';
      if (input.length < MIN_SYMBOL_LENGTH || input.length > MAX_SYMBOL_LENGTH)
        return `Symbol must be between ${MIN_SYMBOL_LENGTH} and ${MAX_SYMBOL_LENGTH} characters`;
      if (!/^[A-Z0-9]+$/.test(input)) return 'Symbol must contain only uppercase letters and numbers';
      return true;
    },
  },
  {
    type: 'input',
    name: 'description',
    message: 'Enter the group description:',
    validate: (input: string) => {
      if (!input.trim()) return 'Group description is required';
      if (input.length > MAX_DESCRIPTION_LENGTH)
        return `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`;
      return true;
    },
  },
  {
    type: 'input',
    name: 'imageUrl',
    message: 'Enter image URL (optional):',
    default: '',
  },
  {
    type: 'input',
    name: 'previewImageUrl',
    message: 'Enter preview image URL (optional):',
    default: '',
  },
];

const getSetupQuestions = () => [
  {
    type: 'input',
    name: 'serviceAddress',
    message: 'Enter the service address:',
    validate: (input: string) => {
      if (!input.trim()) return 'Service address is required';
      if (!validateAddress(input)) return 'Invalid Ethereum address';
      return true;
    },
  },
  {
    type: 'input',
    name: 'feeCollection',
    message: 'Enter the fee collection address:',
    validate: (input: string) => {
      if (!input.trim()) return 'Fee collection address is required';
      if (!validateAddress(input)) return 'Invalid Ethereum address';
      return true;
    },
  },
  {
    type: 'input',
    name: 'initialConditions',
    message: 'Enter initial conditions (comma-separated addresses, optional):',
    default: '',
    filter: (input: string) => {
      if (!input.trim()) return [];
      return input
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);
    },
    validate: (input: string[]) => {
      for (const addr of input) {
        if (!validateAddress(addr)) {
          return `Invalid address: ${addr}`;
        }
      }
      return true;
    },
  },
];

const collectUserInput = async () => {
  const profileAnswers = await inquirer.prompt(getProfileQuestions());
  const setupAnswers = await inquirer.prompt(getSetupQuestions());

  const profile: BaseGroupProfile = {
    name: profileAnswers.name.trim(),
    symbol: profileAnswers.symbol.trim().toUpperCase(),
    description: profileAnswers.description.trim(),
    imageUrl: profileAnswers.imageUrl.trim() || undefined,
    previewImageUrl: profileAnswers.previewImageUrl.trim() || undefined,
  };

  const setup: BaseGroupSetup = {
    serviceAddress: setupAnswers.serviceAddress.trim(),
    feeCollection: setupAnswers.feeCollection.trim(),
    initialConditions: setupAnswers.initialConditions,
  };

  return { profile, setup };
};

const showConfiguration = (profile: BaseGroupProfile, setup: BaseGroupSetup) => {
  console.log('\n📋 Group Configuration:');
  console.log(chalk.cyan(`Name: ${profile.name}`));
  console.log(chalk.cyan(`Symbol: ${profile.symbol}`));
  console.log(chalk.cyan(`Description: ${profile.description}`));
  console.log(chalk.cyan(`Service Address: ${setup.serviceAddress}`));
  console.log(chalk.cyan(`Fee Collection: ${setup.feeCollection}`));
  console.log(chalk.cyan(`Initial Conditions: ${setup.initialConditions.length} addresses`));
};

const confirmCreation = async (): Promise<boolean> => {
  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with creating the Base Group?',
      default: true,
    },
  ]);
  return confirm.proceed;
};

const showDeploymentSummary = (result: any, setup: BaseGroupSetup) => {
  console.log(chalk.blue('\n📋 Deployment Summary:'));
  console.log(divider());
  console.log(kv('Group Address', result.groupAddress));
  console.log(kv('Group Name', result.profile.name));
  console.log(kv('Group Symbol', result.profile.symbol));
  console.log(kv('Description', result.profile.description));
  console.log(kv('Profile CID', result.profileCID));
  if (result.profile.imageUrl) {
    console.log(kv('Avatar Image URL', result.profile.imageUrl));
  }
  if (result.profile.previewImageUrl) {
    console.log(kv('Preview Image URL', result.profile.previewImageUrl));
  }
  console.log(kv('Service Address', setup.serviceAddress));
  console.log(kv('Fee Collection', setup.feeCollection));
  console.log(kv('Initial Conditions', setup.initialConditions.length.toString()));
  console.log(divider());
};

const showNextSteps = (groupAddress: string) => {
  console.log(chalk.blue('\n🔧 Next Steps:'));
  console.log(chalk.gray(`  • cg set-condition --group ${groupAddress} --condition <address> --enabled true`));
  console.log(chalk.gray(`  • cg trust-batch --group ${groupAddress} --members <addresses>`));
  console.log(chalk.gray(`  • cg group-info --group ${groupAddress}`));
  console.log(chalk.gray(`  • cg register-name --group ${groupAddress} --nonce <number>`));
  console.log('');
};

export const createBaseGroupCommand = async () => {
  try {
    showInfo('🚀 Creating a new Base Group...\n');

    const signer = getSigner();
    const senderAddress = signer.address;

    const { profile, setup } = await collectUserInput();

    if (!validateBaseGroupProfile(profile)) {
      throw new Error('Invalid group profile data');
    }

    if (!validateBaseGroupSetup(setup)) {
      throw new Error('Invalid group setup data');
    }

    showConfiguration(profile, setup);

    if (!(await confirmCreation())) {
      showInfo('❌ Base Group creation cancelled');
      return;
    }

    const result = await createBaseGroup(profile, setup, senderAddress);

    showSuccess('✅ Base Group deployment completed!');

    const { addGroup } = await import('../utils/config.js');
    addGroup(result.groupAddress, profile.name, profile.description);

    showDeploymentSummary(result, setup);
    showNextSteps(result.groupAddress);
  } catch (error) {
    showError(`Failed to create Base Group: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
