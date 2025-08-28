import { cidV0ToUint8Array } from '@circles-sdk/utils';
import { ethers } from 'ethers';
import { getSDK } from './circles.js';

// Constants for validation limits
const MIN_SYMBOL_LENGTH = 3;
const MAX_SYMBOL_LENGTH = 8;
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const LOG_POSITION_FALLBACK = 9;
const INDEXING_WAIT_TIME = 3000;

// Transaction response interface
interface TransactionResponse {
  wait(): Promise<TransactionReceipt>;
  hash: string;
}

interface TransactionReceipt {
  hash: string;
}

// Interface for BaseGroupAvatar with required methods
interface BaseGroupAvatar {
  setMembershipCondition(_condition: string, _enabled: boolean): Promise<TransactionResponse>;
  trustBatchWithConditions(_addresses: string[], _expiry?: number): Promise<TransactionResponse>;
  registerShortNameWithNonce(_nonce: number): Promise<TransactionResponse>;
  getMembershipConditions(): Promise<MembershipCondition[]>;
  setOwner(_newOwner: string): Promise<TransactionResponse>;
  setService(_serviceAddress: string): Promise<TransactionResponse>;
  setFeeCollection(_feeCollectionAddress: string): Promise<TransactionResponse>;
}

export interface BaseGroupProfile {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  previewImageUrl?: string;
}

export interface BaseGroupSetup {
  serviceAddress: string;
  feeCollection: string;
  initialConditions: string[];
}

export interface BaseGroupResult {
  groupAddress: string;
  profileCID: string;
  transactionHash: string;
  profile: BaseGroupProfile;
}

export const validateBaseGroupProfile = (profile: BaseGroupProfile): boolean => {
  if (!profile.name || profile.name.trim().length === 0) return false;
  if (!profile.symbol || profile.symbol.trim().length === 0) return false;
  if (profile.symbol.length < MIN_SYMBOL_LENGTH || profile.symbol.length > MAX_SYMBOL_LENGTH) return false;
  if (!/^[A-Z0-9]+$/.test(profile.symbol)) return false;
  if (!profile.description || profile.description.trim().length === 0) return false;
  if (profile.name.length > MAX_NAME_LENGTH) return false;
  if (profile.description.length > MAX_DESCRIPTION_LENGTH) return false;
  return true;
};

export const validateBaseGroupSetup = (setup: BaseGroupSetup): boolean => {
  if (!setup.serviceAddress || !ethers.isAddress(setup.serviceAddress)) return false;
  if (!setup.feeCollection || !ethers.isAddress(setup.feeCollection)) return false;
  if (!Array.isArray(setup.initialConditions)) return false;

  for (const address of setup.initialConditions) {
    if (!ethers.isAddress(address)) return false;
  }

  return true;
};

const createGroupProfile = async (sdk: any, profile: BaseGroupProfile): Promise<string> => {
  console.log('📝 Creating group profile...');

  const groupProfile = {
    name: profile.name,
    symbol: profile.symbol,
    description: profile.description,
    imageUrl: profile.imageUrl || '',
    previewImageUrl: profile.previewImageUrl || '',
  };

  const profileCID = await sdk.profiles.create(groupProfile);
  if (!profileCID) {
    throw new Error('Failed to create profile CID');
  }

  console.log(`✅ Profile created with CID: ${profileCID}`);
  return profileCID;
};

const deployBaseGroupContract = async (
  sdk: any,
  profile: BaseGroupProfile,
  setup: BaseGroupSetup,
  senderAddress: string,
  profileCID: string
) => {
  console.log('🚀 Deploying base group contract...');

  const tx = await sdk.baseGroupFactory.createBaseGroup(
    senderAddress,
    setup.serviceAddress,
    setup.feeCollection,
    setup.initialConditions,
    profile.name,
    profile.symbol,
    cidV0ToUint8Array(profileCID)
  );

  console.log('⏳ Waiting for transaction confirmation...');
  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error('Transaction receipt is null');
  }

  console.log(`✅ Transaction confirmed: ${receipt.hash}`);
  return receipt;
};

const extractGroupAddressFromLogs = (receipt: any, senderAddress: string): string => {
  console.log('🔍 Extracting group address from logs...');

  // Try to find the group address from events
  for (const log of receipt.logs) {
    try {
      if (log.topics && log.topics.length > 1) {
        const potentialAddress = ethers.stripZerosLeft(log.topics[1]);
        if (ethers.isAddress(potentialAddress)) {
          return potentialAddress.toLowerCase();
        }
      }
    } catch {
      continue;
    }
  }

  // Fallback: try position as mentioned in the reference
  if (receipt.logs.length > LOG_POSITION_FALLBACK) {
    try {
      const potentialAddress = ethers.stripZerosLeft(receipt.logs[LOG_POSITION_FALLBACK].topics[1]);
      if (ethers.isAddress(potentialAddress)) {
        return potentialAddress.toLowerCase();
      }
    } catch {
      // Ignore fallback error
    }
  }

  // Another fallback: try to find any address-like topic in the logs
  for (const log of receipt.logs) {
    for (const topic of log.topics) {
      try {
        const potentialAddress = ethers.stripZerosLeft(topic);
        if (ethers.isAddress(potentialAddress) && potentialAddress !== senderAddress) {
          return potentialAddress.toLowerCase();
        }
      } catch {
        continue;
      }
    }
  }

  throw new Error('Could not extract group address from transaction logs');
};

const verifyAndSetupGroup = async (sdk: any, groupAddress: string, setup: BaseGroupSetup): Promise<void> => {
  console.log(`✅ Base group created at address: ${groupAddress}`);
  console.log('⏳ Waiting for contract indexing...');
  await new Promise(resolve => setTimeout(resolve, INDEXING_WAIT_TIME));

  try {
    await sdk.getAvatar(groupAddress);
    console.log('✅ Base group avatar verified');

    if (setup.initialConditions.length > 0) {
      console.log(`🔧 Setting up ${setup.initialConditions.length} initial conditions...`);
      console.log('✅ Initial conditions configured during deployment');
    }
  } catch {
    console.warn('⚠️  Could not verify avatar immediately (this is normal)');
  }
};

export const createBaseGroup = async (
  profile: BaseGroupProfile,
  setup: BaseGroupSetup,
  senderAddress: string
): Promise<BaseGroupResult> => {
  const sdk = await getSDK();

  try {
    const profileCID = await createGroupProfile(sdk, profile);
    const receipt = await deployBaseGroupContract(sdk, profile, setup, senderAddress, profileCID);
    const groupAddress = extractGroupAddressFromLogs(receipt, senderAddress);
    await verifyAndSetupGroup(sdk, groupAddress, setup);

    return {
      groupAddress,
      profileCID,
      transactionHash: receipt.hash,
      profile,
    };
  } catch (error) {
    throw new Error(`Failed to create base group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getBaseGroupAvatar = async (groupAddress: string) => {
  const sdk = await getSDK();

  try {
    const avatar = await sdk.getAvatar(groupAddress.toLowerCase());
    return avatar;
  } catch (error) {
    throw new Error(`Failed to get base group avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const setMembershipCondition = async (
  groupAddress: string,
  condition: string,
  enabled: boolean
): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.setMembershipCondition !== 'function') {
      throw new Error('This avatar does not support membership conditions (not a base group)');
    }

    const tx = await baseGroupAvatar.setMembershipCondition(condition, enabled);
    await tx.wait();

    console.log(`✅ Membership condition ${enabled ? 'enabled' : 'disabled'} for ${condition}`);
  } catch (error) {
    throw new Error(`Failed to set membership condition: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const trustBatchWithConditions = async (
  groupAddress: string,
  members: TrustBatchMember[],
  expiry?: number
): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.trustBatchWithConditions !== 'function') {
      throw new Error('This avatar does not support batch trust with conditions (not a base group)');
    }

    // Extract addresses from the members array
    const addresses = members.map(member => member.address);
    const tx = await baseGroupAvatar.trustBatchWithConditions(addresses, expiry);
    await tx.wait();

    console.log(`✅ Batch trust established for ${members.length} members`);
  } catch (error) {
    throw new Error(
      `Failed to trust batch with conditions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const registerShortNameWithNonce = async (groupAddress: string, nonce: number): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.registerShortNameWithNonce !== 'function') {
      throw new Error('This avatar does not support short name registration (not a base group)');
    }

    const tx = await baseGroupAvatar.registerShortNameWithNonce(nonce);
    await tx.wait();

    console.log(`✅ Short name registered with nonce: ${nonce}`);
  } catch (error) {
    throw new Error(`Failed to register short name: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export interface TrustBatchMember {
  address: string;
  expiry?: number;
}

export interface MembershipCondition {
  condition: string;
  enabled: boolean;
}

export const getMembershipConditions = async (groupAddress: string): Promise<MembershipCondition[]> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.getMembershipConditions !== 'function') {
      throw new Error('This avatar does not support membership conditions (not a base group)');
    }

    const conditions = await baseGroupAvatar.getMembershipConditions();
    return conditions || [];
  } catch (error) {
    throw new Error(`Failed to get membership conditions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const setGroupOwner = async (groupAddress: string, newOwner: string): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.setOwner !== 'function') {
      throw new Error('This avatar does not support owner changes (not a base group)');
    }

    const tx = await baseGroupAvatar.setOwner(newOwner);

    if (tx && typeof tx.wait === 'function') {
      await tx.wait();
    } else if (tx && tx.hash) {
      console.log(`Transaction hash: ${tx.hash}`);
    }

    console.log(`✅ Group owner changed to: ${newOwner}`);
  } catch (error) {
    throw new Error(`Failed to set group owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const setGroupService = async (groupAddress: string, serviceAddress: string): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.setService !== 'function') {
      throw new Error('This avatar does not support service changes (not a base group)');
    }

    const tx = await baseGroupAvatar.setService(serviceAddress);
    await tx.wait();

    console.log(`✅ Group service changed to: ${serviceAddress}`);
  } catch (error) {
    throw new Error(`Failed to set group service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const setGroupFeeCollection = async (groupAddress: string, feeCollectionAddress: string): Promise<void> => {
  const avatar = await getBaseGroupAvatar(groupAddress);

  try {
    // Cast to BaseGroupAvatar interface to access methods
    const baseGroupAvatar = avatar as unknown as BaseGroupAvatar;

    if (typeof baseGroupAvatar.setFeeCollection !== 'function') {
      throw new Error('This avatar does not support fee collection changes (not a base group)');
    }

    const tx = await baseGroupAvatar.setFeeCollection(feeCollectionAddress);
    await tx.wait();

    console.log(`✅ Group fee collection changed to: ${feeCollectionAddress}`);
  } catch (error) {
    throw new Error(`Failed to set group fee collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
