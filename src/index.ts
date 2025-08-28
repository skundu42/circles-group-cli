#!/usr/bin/env node

import { Command } from 'commander';
import { cleanupTerminal } from './utils/ui.js';
import { deployGroup } from './commands/deploy.js';
import { addMember } from './commands/add-member.js';
import { removeMember } from './commands/remove-member.js';
import { listMembers } from './commands/list-members.js';
import { listGroups } from './commands/list-groups.js';
import { getBalance } from './commands/balance.js';
import { transfer } from './commands/transfer.js';
import { setupWallet } from './commands/setup.js';
import { showGroupInfo } from './commands/group-info.js';

// Base Groups commands
import { createBaseGroupCommand } from './commands/create-base-group.js';
import { setMembershipConditionCommand } from './commands/set-membership-condition.js';
import { listMembershipConditionsCommand } from './commands/list-membership-conditions.js';
import { trustBatchCommand } from './commands/trust-batch.js';
import { setGroupOwnerCommand } from './commands/set-group-owner.js';
import { setGroupServiceCommand } from './commands/set-group-service.js';
import { setGroupFeeCollectionCommand } from './commands/set-group-fee-collection.js';
import { registerShortNameCommand } from './commands/register-short-name.js';

const program = new Command();

program.name('cg').description('A comprehensive CLI for managing Circles groups').version('1.0.0');

// Setup command
program.command('setup').description('Setup your wallet and configuration').action(setupWallet);

// Deploy Standard Group command
program
  .command('deploy-group')
  .description('Deploy a new standard Circles group')
  .option('-n, --name <name>', 'Group name')
  .option('-d, --description <description>', 'Group description')
  .option('-m, --members <members>', 'Initial members (comma-separated addresses)')
  .action(deployGroup);

// Deploy Base Group command
program
  .command('deploy-base-group')
  .description('Deploy a new Base Group with membership conditions and trust capabilities')
  .action(createBaseGroupCommand);

// Add member command
program
  .command('add-member')
  .description('Add a new member to a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .requiredOption('-m, --member <address>', 'Member address to add')
  .action(addMember);

// Remove member command
program
  .command('remove-member')
  .description('Remove a member from a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .requiredOption('-m, --member <address>', 'Member address to remove')
  .action(removeMember);

// Group info command
program
  .command('group-info')
  .description('Display comprehensive information about a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .action(showGroupInfo);

// List members command
program
  .command('list-members')
  .description('List all members of a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .action(listMembers);

// List groups command
program.command('list-groups').description('List all groups you are a member of').action(listGroups);

// Balance command
program
  .command('balance')
  .description('Check balance for a user in a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .option('-u, --user <address>', 'User address (default: your address)')
  .action(getBalance);

// Transfer command
program
  .command('transfer')
  .description('Transfer tokens within a group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .requiredOption('-t, --to <address>', 'Recipient address')
  .requiredOption('-a, --amount <amount>', 'Amount to transfer')
  .action(transfer);

program
  .command('set-condition')
  .description('Set membership condition for a Base Group')
  .option('-g, --group <address>', 'Group contract address')
  .option('-c, --condition <condition>', 'Membership condition (address or condition string)')
  .option('-e, --enabled <boolean>', 'Enable/disable the condition', val => val === 'true')
  .action(setMembershipConditionCommand);

program
  .command('list-conditions')
  .description('List all membership conditions for a Base Group')
  .requiredOption('-g, --group <address>', 'Group contract address')
  .action(listMembershipConditionsCommand);

program
  .command('trust-batch')
  .description('Trust multiple avatars in batch (Base Groups only)')
  .option('-g, --group <address>', 'Group contract address')
  .option('-m, --members <addresses>', 'Comma-separated avatar addresses')
  .option('-e, --expiry <timestamp>', 'Expiry timestamp for all members (optional)')
  .action(trustBatchCommand);

program
  .command('set-owner')
  .description('Set the owner of a Base Group')
  .option('-g, --group <address>', 'Group contract address')
  .option('-o, --owner <address>', 'New owner address')
  .action(setGroupOwnerCommand);

program
  .command('set-service')
  .description('Set the service address of a Base Group')
  .option('-g, --group <address>', 'Group contract address')
  .option('-s, --service <address>', 'New service address')
  .action(setGroupServiceCommand);

program
  .command('set-fee-collection')
  .description('Set the fee collection address of a Base Group')
  .option('-g, --group <address>', 'Group contract address')
  .option('-f, --fee-collection <address>', 'New fee collection address')
  .action(setGroupFeeCollectionCommand);

program
  .command('register-name')
  .description('Register a short name with nonce for a Base Group')
  .option('-g, --group <address>', 'Group contract address')
  .option('-n, --nonce <number>', 'Nonce value for registration')
  .action(registerShortNameCommand);

// Ensure terminal cleanup on exit
process.on('exit', cleanupTerminal);
process.on('SIGINT', () => {
  cleanupTerminal();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupTerminal();
  process.exit(0);
});

program.parse();
