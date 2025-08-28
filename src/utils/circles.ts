import { Sdk, circlesConfig } from '@circles-sdk/sdk';
import { PrivateKeyContractRunner } from '@circles-sdk/adapter-ethers';
import { ethers } from 'ethers';
import { getProvider, getSigner, getNetwork } from './config.js';

// Constants
const GNOSIS_CHAIN_ID = 100;
const DEFAULT_SYMBOL_LENGTH = 8;
const INDEXING_WAIT_TIME = 15000; // 15 seconds
const DEFAULT_PAGE_SIZE = 20;
const LARGE_PAGE_SIZE = 200;
const MAX_GROUP_QUERY_SIZE = 100;
const AVATAR_QUERY_SIZE = 42;
const STANDARD_QUERY_SIZE = 1000;
const TRUST_RELATIONS_PAGE_SIZE = 200;

// Type interfaces for better type safety
interface GroupQueryRow {
  group?: string;
  name?: string;
  symbol?: string;
  description?: string;
  owner?: string;
  service?: string;
  feeCollection?: string;
  groupName?: string;
  groupSymbol?: string;
  groupDescription?: string;
  member?: string;
}

interface GroupDetails {
  name: string;
  symbol: string;
  description: string;
  owner: string;
  service: string;
  feeCollection: string;
  shortName?: string | null;
  tokenSymbol?: string;
  tokenName?: string;
  totalSupply?: string;
}

// Group registration profile interface
interface GroupRegistrationProfile {
  name: string;
  symbol: string;
  description: string;
}

// Mint policy interface
interface MintPolicy {
  [key: string]: unknown;
}

interface SdkWithContractRunner {
  contractRunner?: {
    address?: string;
  };
  registerGroupV2?: (_mintPolicy: MintPolicy, _profile: GroupRegistrationProfile) => Promise<unknown>;
  registerGroup?: (_mintPolicy: MintPolicy, _profile: GroupRegistrationProfile) => Promise<unknown>;
}

interface TrustRelationRow {
  truster?: string;
  trustee?: string;
  limit?: number | string;
  subjectAvatar?: string;
  objectAvatar?: string;
}

interface TokenBalanceRow {
  isGroup?: boolean;
  tokenAddress?: string;
  crc?: number;
}

// Re-export getSigner for use in other modules
export { getSigner } from './config.js';

let sdkInstance: Sdk | null = null;

export interface Group {
  address: string;
  name: string;
  description?: string;
}

export interface TrustConnection {
  from: string;
  to: string;
  limit: string;
}

export const getSDK = async (): Promise<Sdk> => {
  if (!sdkInstance) {
    const provider = getProvider();
    const wallet = getSigner();
    const network = getNetwork();

    if (network.chainId !== GNOSIS_CHAIN_ID) {
      throw new Error(`Only Gnosis Chain mainnet (chainId ${GNOSIS_CHAIN_ID}) is supported`);
    }

    const contractRunner = new PrivateKeyContractRunner(provider, wallet.privateKey);
    await contractRunner.init();

    // Force mainnet
    sdkInstance = new Sdk(contractRunner, circlesConfig[GNOSIS_CHAIN_ID]);
  }

  return sdkInstance;
};

export const cleanupSDK = async (): Promise<void> => {
  if (sdkInstance) {
    try {
      // Close any open connections
      if (sdkInstance.data && typeof sdkInstance.data.close === 'function') {
        await sdkInstance.data.close();
      }

      // Reset the instance
      sdkInstance = null;
    } catch {
      // Ignore cleanup errors
      console.warn('Warning: Failed to cleanup SDK connections');
    }
  }
};

export const deployGroupContract = async (
  name: string,
  description: string,
  initialMembers: string[] = []
): Promise<Group> => {
  const sdk = await getSDK();
  const network = getNetwork();

  try {
    const cfg = circlesConfig[network.chainId] || circlesConfig[GNOSIS_CHAIN_ID];
    const mintPolicy = cfg.baseGroupMintPolicy;
    if (!mintPolicy) {
      throw new Error('No baseGroupMintPolicy configured for this network');
    }

    const symbol =
      name
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, DEFAULT_SYMBOL_LENGTH) || 'GROUP';

    interface GroupProfile {
      name: string;
      symbol: string;
      description: string;
    }

    const profile: GroupProfile = { name, symbol, description: description || '' };

    const sdkWithRunner = sdk as SdkWithContractRunner;
    const registerFn = sdkWithRunner.registerGroupV2 ?? sdkWithRunner.registerGroup;
    if (typeof registerFn !== 'function') {
      throw new Error('Circles SDK does not expose group registration on this version');
    }

    console.log(`📝 Registering group "${name}" with symbol "${symbol}"...`);
    await registerFn.call(sdk, mintPolicy, profile);
    console.log(`✅ Group registration transaction completed`);

    const ownerAddress = sdkWithRunner.contractRunner?.address as string;
    if (!ownerAddress) {
      throw new Error('Contract runner address is not available');
    }

    // Wait for indexing, then try to locate the group
    console.log(`⏳ Waiting ${INDEXING_WAIT_TIME / 1000} seconds for indexing...`);
    await new Promise(resolve => setTimeout(resolve, INDEXING_WAIT_TIME));

    console.log(`🔍 Locating newly created group...`);

    // Try to find the group using the existing getGroupDetails logic
    let groupAddress: string | null = null;

    try {
      // Use the same logic as getGroupDetails to find the group
      const queries = [
        // Strategy 1: Find by owner and name
        () =>
          sdk.data.findGroups(1, {
            ownerEquals: ownerAddress,
            nameStartsWith: name,
            sortBy: 'age_desc',
          }),
        // Strategy 2: Find by owner only
        () =>
          sdk.data.findGroups(10, {
            ownerEquals: ownerAddress,
            sortBy: 'age_desc',
          }),
        // Strategy 3: Find recent groups by owner
        () =>
          sdk.data.findGroups(DEFAULT_PAGE_SIZE, {
            ownerEquals: ownerAddress,
            sortBy: 'age_desc',
          }),
      ];

      for (const queryFn of queries) {
        try {
          const q = queryFn();
          let rows = [];

          if (q.getRows) {
            rows = await q.getRows();
          } else if (q.getAllRows) {
            rows = await q.getAllRows();
          }

          // Look for a group that matches our criteria
          for (const row of rows as GroupQueryRow[]) {
            if (row.group && row.name === name) {
              groupAddress = row.group;
              console.log(`✅ Found group "${name}" at address ${groupAddress}`);
              break;
            }
          }

          if (groupAddress) break;
        } catch {
          continue;
        }
      }

      // If still not found, try getting the most recent group by this owner
      if (!groupAddress) {
        try {
          const q = sdk.data.findGroups(1, {
            ownerEquals: ownerAddress,
            sortBy: 'age_desc',
          });

          let row = null;
          if (q.getSingleRow) {
            row = await q.getSingleRow();
          } else if (q.getRow) {
            row = await q.getRow();
          }

          if (row?.group) {
            groupAddress = row.group;
            console.log(`⚠️  Found group but name may not match exactly: ${row.name || 'Unknown'} at ${groupAddress}`);
          }
        } catch {
          // Ignore fallback errors
        }
      }
    } catch {
      console.log('Failed to locate group due to indexing delays');
    }

    if (!groupAddress) {
      console.log(`⚠️  Could not locate the newly created group in the database.`);
      console.log(`   This is likely due to indexing delays. The group was successfully created on-chain.`);
      console.log(`   You can try checking for the group again in a few minutes using:`);
      console.log(`   cg list-groups`);
      console.log(`   or`);
      console.log(`   cg group-info --group <address> (if you have the address)`);

      // Return a placeholder group object to indicate success
      return {
        address: 'UNKNOWN - Check list-groups later',
        name,
        description,
      };
    }

    if (initialMembers.length > 0) {
      const groupAvatar = await sdk.getAvatar(groupAddress);
      await groupAvatar.trust(initialMembers);
    }

    return {
      address: groupAddress,
      name,
      description,
    };
  } catch (error) {
    throw new Error(`Failed to deploy group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getGroup = async (address: string): Promise<Group> => {
  const sdk = await getSDK();

  try {
    const q = sdk.data.findGroups(1, { groupAddressIn: [address] });
    const row = await q.getSingleRow();
    return {
      address,
      name: row?.name || 'Unknown Group',
      description: '',
    };
  } catch (error) {
    throw new Error(`Failed to get group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const getGroupInfoFromQuery = async (sdk: any, normalizedAddress: string): Promise<Partial<GroupDetails>> => {
  try {
    const q = sdk.data.findGroups(1, { groupAddressIn: [normalizedAddress] });
    const row = (await q.getSingleRow) ? await q.getSingleRow() : (await q.getRow) ? await q.getRow() : null;

    if (row) {
      const groupRow = row as GroupQueryRow;
      return {
        name: groupRow.name || 'Unknown Group',
        symbol: groupRow.symbol || '',
        description: groupRow.description || '',
        owner: groupRow.owner || 'Unknown',
        service: groupRow.service || 'Unknown',
        feeCollection: groupRow.feeCollection || 'Unknown',
      };
    }
  } catch {
    // Ignore error and return empty
  }
  return {};
};

const getGroupInfoFromAllGroups = async (sdk: any, normalizedAddress: string): Promise<Partial<GroupDetails>> => {
  try {
    const q = sdk.data.findGroups(MAX_GROUP_QUERY_SIZE, {});
    const rows = (await q.getRows) ? await q.getRows() : (await q.getAllRows) ? await q.getAllRows() : [];
    const groupRow = (rows as GroupQueryRow[]).find(row => row.group && row.group.toLowerCase() === normalizedAddress);

    if (groupRow) {
      return {
        name: groupRow.name || 'Unknown Group',
        symbol: groupRow.symbol || '',
        description: groupRow.description || '',
        owner: groupRow.owner || 'Unknown',
        service: groupRow.service || 'Unknown',
        feeCollection: groupRow.feeCollection || 'Unknown',
      };
    }
  } catch {
    // Ignore error and return empty
  }
  return {};
};

const getGroupInfoFromMemberships = async (sdk: any, normalizedAddress: string): Promise<Partial<GroupDetails>> => {
  try {
    const q = sdk.data.getGroupMemberships(normalizedAddress, 10);
    const rows = (await q.getRows) ? await q.getRows() : (await q.getAllRows) ? await q.getAllRows() : [];
    if (rows.length > 0) {
      const firstRow = rows[0] as GroupQueryRow;
      if (firstRow.group) {
        return {
          name: firstRow.groupName || 'Unknown Group',
          symbol: firstRow.groupSymbol || '',
          description: firstRow.groupDescription || '',
        };
      }
    }
  } catch {
    // Ignore error and return empty
  }
  return {};
};

const getTokenDetails = async (sdk: any, normalizedAddress: string): Promise<Partial<GroupDetails>> => {
  try {
    const token = await sdk.getToken(normalizedAddress);
    const tokenDetails: Partial<GroupDetails> = {};

    try {
      tokenDetails.tokenSymbol = await token.getSymbol();
    } catch {
      tokenDetails.tokenSymbol = 'Unknown';
    }

    try {
      tokenDetails.tokenName = await token.getName();
    } catch {
      tokenDetails.tokenName = 'Unknown';
    }

    try {
      tokenDetails.totalSupply = await token.getTotalSupply();
    } catch {
      tokenDetails.totalSupply = '0';
    }

    return tokenDetails;
  } catch {
    return {
      tokenSymbol: 'Unknown',
      tokenName: 'Unknown',
      totalSupply: '0',
    };
  }
};

export const getGroupDetails = async (address: string): Promise<GroupDetails> => {
  const sdk = await getSDK();

  try {
    if (!address || address.length < AVATAR_QUERY_SIZE) {
      throw new Error('Invalid group address format');
    }

    const normalizedAddress = address.toLowerCase();
    let details: Partial<GroupDetails> = {};

    // Try multiple approaches to get group information
    details = await getGroupInfoFromQuery(sdk, normalizedAddress);

    if (!details.name || details.name === 'Unknown Group') {
      details = { ...details, ...(await getGroupInfoFromAllGroups(sdk, normalizedAddress)) };
    }

    if (!details.name || details.name === 'Unknown Group') {
      details = { ...details, ...(await getGroupInfoFromMemberships(sdk, normalizedAddress)) };
    }

    // Set fallback values
    details = {
      name: details.name || 'Unknown Group',
      symbol: details.symbol || 'Unknown',
      description: details.description || '',
      owner: details.owner || 'Unknown',
      service: details.service || 'Unknown',
      feeCollection: details.feeCollection || 'Unknown',
      ...details,
    };

    // Get short name
    try {
      const avatar = await sdk.getAvatar(normalizedAddress);
      details.shortName = await avatar.getShortName();
    } catch {
      details.shortName = null;
    }

    // Get token details
    const tokenDetails = await getTokenDetails(sdk, normalizedAddress);
    details = { ...details, ...tokenDetails };

    return {
      name: details.name!,
      symbol: details.symbol!,
      description: details.description!,
      owner: details.owner!,
      service: details.service!,
      feeCollection: details.feeCollection!,
      shortName: details.shortName!,
      tokenSymbol: details.tokenSymbol!,
      tokenName: details.tokenName!,
      totalSupply: details.totalSupply!,
    };
  } catch (error) {
    throw new Error(`Failed to get group details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const addMemberToGroup = async (groupAddress: string, memberAddress: string): Promise<void> => {
  const sdk = await getSDK();

  try {
    // In Circles, adding a member means establishing trust relationships
    // The group (avatar) trusts the new member
    const avatar = await sdk.getAvatar(groupAddress);
    await avatar.trust(memberAddress);
  } catch (error) {
    throw new Error(`Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const removeMemberFromGroup = async (groupAddress: string, memberAddress: string): Promise<void> => {
  const sdk = await getSDK();

  try {
    const avatar = await sdk.getAvatar(groupAddress);
    await avatar.untrust(memberAddress);
  } catch (error) {
    throw new Error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const getMembersFromTrustRelations = async (
  sdk: any,
  normalizedAddress: string,
  members: Set<string>
): Promise<void> => {
  try {
    if (sdk.data.getAggregatedTrustRelations) {
      const trustRelations = await sdk.data.getAggregatedTrustRelations(normalizedAddress);
      for (const relation of trustRelations) {
        if (relation.subjectAvatar) members.add(relation.subjectAvatar.toLowerCase());
        if (relation.objectAvatar) members.add(relation.objectAvatar.toLowerCase());
      }
    }
  } catch {
    const q = sdk.data.getTrustRelations(normalizedAddress, STANDARD_QUERY_SIZE);
    while (await q.queryNextPage()) {
      const rows = q.currentPage?.results ?? [];
      for (const row of rows as TrustRelationRow[]) {
        if (row.truster) members.add(row.truster.toLowerCase());
        if (row.trustee) members.add(row.trustee.toLowerCase());
      }
    }
  }
};

const getMembersFromGroupMemberships = async (
  sdk: any,
  normalizedAddress: string,
  members: Set<string>
): Promise<void> => {
  try {
    const q = sdk.data.getGroupMemberships(normalizedAddress, STANDARD_QUERY_SIZE);
    while (await q.queryNextPage()) {
      const rows = q.currentPage?.results ?? [];
      for (const row of rows as GroupQueryRow[]) {
        if (row.member) members.add(row.member.toLowerCase());
      }
    }
  } catch {
    // Ignore errors for this approach
  }
};

export const getGroupMembers = async (groupAddress: string): Promise<string[]> => {
  const sdk = await getSDK();

  try {
    const members = new Set<string>();
    const normalizedAddress = groupAddress.toLowerCase();

    await getMembersFromTrustRelations(sdk, normalizedAddress, members);
    await getMembersFromGroupMemberships(sdk, normalizedAddress, members);

    return Array.from(members);
  } catch (error) {
    throw new Error(`Failed to get group members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getTrustConnections = async (groupAddress: string): Promise<TrustConnection[]> => {
  const sdk = await getSDK();

  try {
    const connections: TrustConnection[] = [];
    const normalizedAddress = groupAddress.toLowerCase();

    try {
      // Approach 1: Use getAggregatedTrustRelations if available
      if (sdk.data.getAggregatedTrustRelations) {
        const trustRelations = await sdk.data.getAggregatedTrustRelations(normalizedAddress);
        for (const relation of trustRelations) {
          connections.push({
            from: relation.subjectAvatar || '',
            to: relation.objectAvatar || '',
            limit: String(relation.limit ?? 0),
          });
        }
      }
    } catch {
      // Fallback to getTrustRelations
      const q = sdk.data.getTrustRelations(normalizedAddress, TRUST_RELATIONS_PAGE_SIZE);
      while (await q.queryNextPage()) {
        const rows = q.currentPage?.results ?? [];
        for (const row of rows as TrustRelationRow[]) {
          // Include all trust relationships in the group
          connections.push({
            from: row.truster || '',
            to: row.trustee || '',
            limit: String(row.limit ?? 0),
          });
        }
      }
    }

    return connections;
  } catch (error) {
    throw new Error(`Failed to get trust connections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getBalance = async (groupAddress: string, userAddress: string): Promise<string> => {
  const sdk = await getSDK();

  try {
    const normalizedGroupAddress = groupAddress.toLowerCase();
    const normalizedUserAddress = userAddress.toLowerCase();

    // Try to get balance directly from the token
    try {
      const token = await sdk.getToken(normalizedGroupAddress);
      const balance = await token.getBalance(normalizedUserAddress);
      return String(balance || 0);
    } catch {
      // Fallback to data layer approach
      const balances = await sdk.data.getTokenBalances(userAddress, true);
      const total = (balances || [])
        .filter(
          (b: TokenBalanceRow) => b.isGroup && (b.tokenAddress as string)?.toLowerCase() === normalizedGroupAddress
        )
        .reduce((sum: number, b: TokenBalanceRow) => sum + (typeof b.crc === 'number' ? b.crc : 0), 0);
      return String(total);
    }
  } catch (error) {
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const transfer = async (groupAddress: string, toAddress: string, amount: string): Promise<void> => {
  const sdk = await getSDK();

  try {
    const sdkWithRunner = sdk as SdkWithContractRunner;
    const sender = sdkWithRunner.contractRunner?.address as string;
    if (!sender) {
      throw new Error('Sender address not available');
    }
    const avatar = await sdk.getAvatar(sender);
    const numericAmount = parseFloat(amount);
    await avatar.transfer(toAddress, numericAmount, groupAddress);
  } catch (error) {
    throw new Error(`Failed to transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserGroups = async (userAddress: string): Promise<Group[]> => {
  const sdk = await getSDK();

  try {
    const q = sdk.data.getGroupMemberships(userAddress, LARGE_PAGE_SIZE);
    const groups = new Set<string>();
    while (await q.queryNextPage()) {
      const rows = q.currentPage?.results ?? [];
      for (const row of rows as GroupQueryRow[]) {
        if (row.group) groups.add(row.group);
      }
    }
    return Array.from(groups).map(addr => ({ address: addr, name: '', description: '' }));
  } catch (error) {
    throw new Error(`Failed to get user groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export { addGroup } from './config.js';

export const validateAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

export const validateAmount = (amount: string): boolean => {
  try {
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed >= 0;
  } catch {
    return false;
  }
};
