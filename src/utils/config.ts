import Conf from 'conf';
import { ethers } from 'ethers';

export interface Config {
  wallet: {
    privateKey?: string;
    address?: string;
  };
  network: {
    rpcUrl: string;
    chainId: number;
  };
  groups: {
    [address: string]: {
      name: string;
      description?: string;
      deployedAt: string;
    };
  };
}

const config = new Conf<Config>({
  projectName: 'circles-groups-cli',
  defaults: {
    wallet: {},
    network: {
      rpcUrl: 'https://rpc.gnosischain.com',
      chainId: 100,
    },
    groups: {},
  },
  schema: {
    wallet: {
      type: 'object',
      properties: {
        privateKey: { type: 'string' },
        address: { type: 'string' },
      },
    },
    network: {
      type: 'object',
      properties: {
        rpcUrl: { type: 'string' },
        chainId: { type: 'number' },
      },
    },
    groups: {
      type: 'object',
    },
  },
});

export const getConfig = () => config;
export const getWallet = () => config.get('wallet');
export const getNetwork = () => config.get('network');
export const getGroups = () => config.get('groups');

export const setWallet = (privateKey: string, address: string) => {
  config.set('wallet', { privateKey, address });
};

export const setNetwork = (rpcUrl: string, chainId: number) => {
  config.set('network', { rpcUrl, chainId });
};

export const addGroup = (address: string, name: string, description?: string) => {
  const groups = config.get('groups');
  groups[address] = {
    name,
    description,
    deployedAt: new Date().toISOString(),
  };
  config.set('groups', groups);
};

export const getProvider = () => {
  const network = getNetwork();
  return new ethers.JsonRpcProvider(network.rpcUrl);
};

export const getSigner = () => {
  const wallet = getWallet();
  if (!wallet.privateKey) {
    throw new Error('Wallet not configured. Run "circles-groups setup" first.');
  }
  const provider = getProvider();
  return new ethers.Wallet(wallet.privateKey, provider);
};
