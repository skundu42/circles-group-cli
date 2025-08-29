# Circles Groups CLI

A comprehensive command-line interface for managing Circles groups with deployment, member management, trust operations, and advanced Base Groups functionality.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Command Overview](#command-overview)
3. [Standard Groups Commands](#standard-groups-commands)
4. [Base Groups Commands](#base-groups-commands)
5. [Trust Management](#trust-management)
6. [Group Information & Discovery](#group-information--discovery)
7. [Token Operations](#token-operations)
8. [Complete Workflows](#complete-workflows)
9. [Troubleshooting](#troubleshooting)

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Gnosis Chain wallet with xDAI for gas fees

### Installation

#### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g circles-groups-cli

# Verify installation
cg --help
```

#### Option 2: Install from source

```bash
# Clone and install
git clone https://github.com/skundu42/circles-groups-cli.git
cd circles-groups-cli
npm install
npm run build
npm link
```

**Note**: After installation, the `cg` command should be available globally. If you encounter any issues, ensure the build completed successfully and try running `npm link` again.

### Initial Setup

```bash
# Configure your wallet and network
cg setup
```

This interactive command will:

- Set up your private key securely
- Configure network settings (default: Gnosis Chain mainnet)
- Validate your wallet configuration

## Command Overview

```
Commands:
  setup                         Setup your wallet and configuration
  deploy-group [options]        Deploy a new standard Circles group
  add-member [options]          Add a new member to a group
  remove-member [options]       Remove a member from a group
  group-info [options]          Display comprehensive information about a group
  list-members [options]        List all members of a group
  list-groups                   List all groups you are a member of
  balance [options]             Check balance for a user in a group
  transfer [options]            Transfer tokens within a group
  deploy-base-group             Deploy a new Base Group with membership conditions and trust capabilities
  set-condition [options]       Set membership condition for a Base Group
  list-conditions [options]     List all membership conditions for a Base Group
  trust-batch [options]         Trust multiple avatars in batch (Base Groups only)
  set-owner [options]           Set the owner of a Base Group
  set-service [options]         Set the service address of a Base Group
  set-fee-collection [options]  Set the fee collection address of a Base Group
  register-name [options]       Register a short name with nonce for a Base Group
  help [command]                display help for command
```

## Command Detailed View

The CLI provides two types of group management:

### Standard Groups

Basic Circles groups with simple member management and trust operations.

### Base Groups

Advanced groups with membership conditions, batch operations, and administrative capabilities.

## Standard Groups Commands

### Deploy Standard Group

```bash
cg deploy-group [options]
```

**Description**: Deploy a new standard Circles group with basic functionality.

**Options**:

- `-n, --name <name>` - Group name (required)
- `-d, --description <description>` - Group description
- `-m, --members <members>` - Initial members (comma-separated addresses)

**Examples**:

```bash
# Interactive deployment
cg deploy-group

# Command-line deployment
cg deploy-group --name "My Community" --description "A local community group"

# With initial members
cg deploy-group --name "Project Team" --members "0x1234...,0x5678..."
```

**What it does**:

- Creates a new Circles group contract
- Registers the group with the Circles protocol
- Sets up initial trust relationships
- Returns the group contract address

### Add Member

```bash
cg add-member --group <address> --member <address>
```

**Description**: Add a new member to a standard group by establishing trust.

**Options**:

- `-g, --group <address>` - Group contract address (required)
- `-m, --member <address>` - Member address to add (required)

**Examples**:

```bash
# Add a single member
cg add-member --group 0x1234... --member 0x5678...

# Interactive mode
cg add-member --group 0x1234...
```

**What it does**:

- Establishes trust relationship between group and new member
- Allows the new member to participate in group activities
- Updates group membership status

### Remove Member

```bash
cg remove-member --group <address> --member <address>
```

**Description**: Remove a member from a standard group by revoking trust.

**Options**:

- `-g, --group <address>` - Group contract address (required)
- `-m, --member <address>` - Member address to remove (required)

**Examples**:

```bash
# Remove a member
cg remove-member --group 0x1234... --member 0x5678...

# Interactive mode
cg remove-member --group 0x1234...
```

**What it does**:

- Revokes trust relationship between group and member
- Removes member's ability to participate in group activities
- Updates group membership status

## Base Groups Commands

### Deploy Base Group

```bash
cg deploy-base-group
```

**Description**: Deploy a new Base Group with advanced features including membership conditions and batch operations.

**Interactive Prompts**:

- **Group Name**: Human-readable name for the group
- **Group Symbol**: 3-8 character symbol (uppercase letters and numbers)
- **Description**: Detailed description of the group's purpose
- **Image URL**: Optional image for the group profile
- **Preview Image URL**: Optional preview image
- **Service Address**: Address for group services
- **Fee Collection Address**: Address for collecting fees
- **Initial Conditions**: Comma-separated addresses for initial membership conditions

**Examples**:

```bash
# Interactive deployment
cg deploy-base-group

# Example inputs:
# Name: "Community DAO"
# Symbol: "CDAO"
# Description: "A decentralized community organization"
# Service Address: "0x1234567890123456789012345678901234567890"
# Fee Collection: "0x0987654321098765432109876543210987654321"
# Initial Conditions: "0x1111...,0x2222..."
```

**What it does**:

- Creates group profile with metadata
- Deploys Base Group contract using factory
- Sets up service and fee collection addresses
- Configures initial membership conditions
- Returns group contract address and avatar

### Set Membership Condition

```bash
cg set-condition [options]
```

**Description**: Set membership conditions for a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address
- `-c, --condition <condition>` - Membership condition (address or condition string)
- `-e, --enabled <boolean>` - Enable/disable the condition

**Examples**:

```bash
# Set address-based condition
cg set-condition --group 0x1234... --condition 0x5678... --enabled true

# Set logic-based condition
cg set-condition --group 0x1234... --condition "balance >= 100" --enabled true

# Interactive mode
cg set-condition --group 0x1234...
```

**What it does**:

- Defines who can be part of the group
- Supports address-based and logic-based conditions
- Can be enabled or disabled
- Affects future membership decisions

### List Membership Conditions

```bash
cg list-conditions --group <address>
```

**Description**: List all membership conditions for a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address (required)

**Examples**:

```bash
# List all conditions
cg list-conditions --group 0x1234...
```

**Output Example**:

```
🏛️  Membership Conditions:
==================================================
1. Condition: 0x3333333333333333333333333333333333333333
   Status: Enabled

2. Condition: balance >= 50
   Status: Enabled

Total conditions: 2
```

### Set Group Owner

```bash
cg set-owner [options]
```

**Description**: Change the owner of a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address
- `-o, --owner <address>` - New owner address

**Examples**:

```bash
# Change owner
cg set-owner --group 0x1234... --owner 0x5678...

# Interactive mode
cg set-owner --group 0x1234...
```

**What it does**:

- Transfers ownership of the Base Group
- Only current owner can perform this operation
- New owner gains administrative privileges

### Set Group Service

```bash
cg set-service [options]
```

**Description**: Update the service address of a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address
- `-s, --service <address>` - New service address

**Examples**:

```bash
# Update service address
cg set-service --group 0x1234... --service 0x5678...

# Interactive mode
cg set-service --group 0x1234...
```

**What it does**:

- Updates the service provider address
- Affects group service integrations
- Requires owner permissions

### Set Fee Collection

```bash
cg set-fee-collection [options]
```

**Description**: Update the fee collection address of a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address
- `-f, --fee-collection <address>` - New fee collection address

**Examples**:

```bash
# Update fee collection address
cg set-fee-collection --group 0x1234... --fee-collection 0x5678...

# Interactive mode
cg set-fee-collection --group 0x1234...
```

**What it does**:

- Updates where group fees are collected
- Affects revenue distribution
- Requires owner permissions

### Register Short Name

```bash
cg register-name [options]
```

**Description**: Register a short name with nonce for a Base Group.

**Options**:

- `-g, --group <address>` - Group contract address
- `-n, --nonce <number>` - Nonce value for registration

**Examples**:

```bash
# Register with nonce
cg register-name --group 0x1234... --nonce 1

# Interactive mode
cg register-name --group 0x1234...
```

**What it does**:

- Registers a short, memorable name for the group
- Uses nonce to ensure uniqueness
- Makes group easier to identify

## Trust Management

### Trust Batch

```bash
cg trust-batch [options]
```

**Description**: Trust multiple avatars in batch (Base Groups only).

**Options**:

- `-g, --group <address>` - Group contract address
- `-m, --members <addresses>` - Comma-separated avatar addresses
- `-e, --expiry <timestamp>` - Expiry timestamp for all members (optional)

**Examples**:

```bash
# Trust multiple avatars
cg trust-batch --group 0x1234... --members "0x1111...,0x2222...,0x3333..."

# Trust with expiry
cg trust-batch --group 0x1234... --members "0x1111...,0x2222..." --expiry 1735689600

# Interactive mode
cg trust-batch --group 0x1234...
```

**What it does**:

- Trusts multiple avatars in a single transaction
- Applies same expiry to all members
- More efficient than individual trust operations
- Only available for Base Groups

## Group Information & Discovery

### Group Information

```bash
cg group-info --group <address>
```

**Description**: Display comprehensive information about a group.

**Options**:

- `-g, --group <address>` - Group contract address (required)

**Examples**:

```bash
# Get group information
cg group-info --group 0x1234...
```

**What it shows**:

- Group name and description
- Member list and trust relationships
- Token balances and transfers
- Group configuration details

### List Members

```bash
cg list-members --group <address>
```

**Description**: List all members of a group with trust information.

**Options**:

- `-g, --group <address>` - Group contract address (required)

**Examples**:

```bash
# List group members
cg list-members --group 0x1234...
```

**What it shows**:

- All group members
- Trust relationship details
- Member addresses and status

### List Groups

```bash
cg list-groups
```

**Description**: List all groups you are a member of.

**Examples**:

```bash
# List your groups
cg list-groups
```

**What it shows**:

- All groups where you're a member
- Group addresses and basic information
- Your role in each group

## Token Operations

### Check Balance

```bash
cg balance [options]
```

**Description**: Check token balance for a user in a group.

**Options**:

- `-g, --group <address>` - Group contract address (required)
- `-u, --user <address>` - User address (default: your address)

**Examples**:

```bash
# Check your balance
cg balance --group 0x1234...

# Check another user's balance
cg balance --group 0x1234... --user 0x5678...
```

**What it shows**:

- Token balance in the specified group
- Balance history and changes
- Trust limits and available amounts

### Transfer Tokens

```bash
cg transfer [options]
```

**Description**: Transfer tokens within a group.

**Options**:

- `-g, --group <address>` - Group contract address (required)
- `-t, --to <address>` - Recipient address (required)
- `-a, --amount <amount>` - Amount to transfer (required)

**Examples**:

```bash
# Transfer tokens
cg transfer --group 0x1234... --to 0x5678... --amount 100

# Interactive mode
cg transfer --group 0x1234...
```

**What it does**:

- Transfers tokens from your account to recipient
- Respects trust limits and group rules
- Updates balances for both parties

## Complete Workflows

### Workflow 1: Community Governance DAO

```bash
# 1. Deploy Base Group
cg deploy-base-group
# Name: "Governance DAO"
# Symbol: "GDAO"
# Service: 0x...
# Fee Collection: 0x...

# 2. Set governance conditions
cg set-condition --group <group-address> --condition "stake >= 1000" --enabled true
cg set-condition --group <group-address> --condition "0xGovernanceTokenContract" --enabled true

# 3. Add governance participants
cg add-member --group <group-address> --member 0xMember1
cg add-member --group <group-address> --member 0xMember2
cg add-member --group <group-address> --member 0xMember3

# 4. Register short name
cg register-name --group <group-address> --nonce 1
```

### Workflow 2: Investment Club

```bash
# 1. Deploy Base Group
cg deploy-base-group
# Name: "Investment Club"
# Symbol: "INVCL"

# 2. Set investment conditions
cg set-condition --group <group-address> --condition "balance >= 10000" --enabled true
cg set-condition --group <group-address> --condition "0xKYCProvider" --enabled true

# 3. Add accredited investors
cg add-member --group <group-address> --member 0xInvestor1
cg add-member --group <group-address> --member 0xInvestor2
cg add-member --group <group-address> --member 0xInvestor3

# 4. Set fee collection
cg set-fee-collection --group <group-address> --fee-collection 0xTreasuryAddress
```

### Workflow 3: Standard Community Group

```bash
# 1. Deploy standard group
cg deploy-group --name "Local Community" --description "Neighborhood group"

# 2. Add initial members
cg add-member --group <group-address> --member 0xMember1
cg add-member --group <group-address> --member 0xMember2

# 3. Check group status
cg group-info --group <group-address>

# 4. Transfer tokens
cg transfer --group <group-address> --to 0xRecipient --amount 50
```

## Troubleshooting

### CLI Installation Issues

#### 1. "cg command not found"

```bash
# Solution: Ensure proper installation
npm run build
npm link

# Verify installation
which cg
cg --help
```

#### 2. "Permission denied" when running cg

```bash
# Solution: Make the CLI executable
chmod +x dist/index.js
npm link
```

#### 3. "Module not found" errors

```bash
# Solution: Rebuild the project
npm run build
npm link
```

### Common Issues

#### 1. "Wallet not configured"

```bash
# Solution: Run setup
cg setup
```

#### 2. "Insufficient funds"

- Ensure you have enough xDAI for gas fees on Gnosis Chain
- Check your wallet balance

#### 3. "Group not found"

- Verify the group address is correct
- Check if you're a member of the group
- Use `cg list-groups` to see your groups

#### 4. "Not authorized"

- Only group owners can perform administrative operations
- Only group members can trust other members
- Check your permissions in the group

#### 5. "Failed to create Base Group"

- Check service and fee collection addresses
- Ensure sufficient gas for transaction
- Verify network connectivity

#### 6. "Invalid membership condition"

- Check condition format
- Verify address validity
- Ensure condition logic is correct

### Debug Commands

```bash
# Check group status
cg group-info --group <group-address>

# List all membership conditions (Base Groups)
cg list-conditions --group <group-address>

# Verify trust relationships
cg list-members --group <group-address>

# Check your groups
cg list-groups

# Verify wallet configuration
cg setup
```
