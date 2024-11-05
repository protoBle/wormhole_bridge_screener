import { ethers } from 'ethers';

import { getMint } from '@solana/spl-token';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Define types for token data and providers
type ProviderKey = 'eth' | 'avax' | 'ftm' | 'matic' | 'oasis' | 'bsc' | 'aurora' | 'celo' | 'moonbeam';
type OutputDecimalsMap = { [key: string]: number };

// ERC20 ABI for reading ERC20 contracts
const erc20Abi: string[] = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// EVM RPC Providers
const providers: Record<ProviderKey, ethers.providers.JsonRpcProvider> = {
    eth: new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth'),
    avax: new ethers.providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc'),
    ftm: new ethers.providers.JsonRpcProvider('https://rpc.ftm.tools'),
    matic: new ethers.providers.JsonRpcProvider('https://polygon-rpc.com'),
    oasis: new ethers.providers.JsonRpcProvider('https://emerald.oasis.dev'),
    bsc: new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org'),
    aurora: new ethers.providers.JsonRpcProvider('https://mainnet.aurora.dev'),
    celo: new ethers.providers.JsonRpcProvider('https://forno.celo.org'),
    moonbeam: new ethers.providers.JsonRpcProvider('https://rpc.api.moonbeam.network')
};

const outputDecimals: OutputDecimalsMap = {};

async function etherBalance(origin: ProviderKey, sourceAddrRaw: string, account: string): Promise<string | number> {
    try {
        const provider = providers[origin];
        const contract = new ethers.Contract(sourceAddrRaw, erc20Abi, provider);

        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const balance = await contract.balanceOf(account);
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);

        console.log(origin, symbol, decimals, formattedBalance, 'balance');
        outputDecimals[`${origin}_${sourceAddrRaw}`] = decimals;
        return formattedBalance;
    } catch (error) {
        console.error(`Failed to fetch balance for ${origin} at ${sourceAddrRaw}:`, error);
    }
    return 0;
}

async function evmDecimals(origin: ProviderKey, sourceAddrRaw: string): Promise<string | undefined> {
    try {
        const provider = providers[origin];
        const contract = new ethers.Contract(sourceAddrRaw, erc20Abi, provider);

        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const totalSupply = await contract.totalSupply();
        const formattedSupply = ethers.utils.formatUnits(totalSupply, decimals);

        outputDecimals[`${origin}_${sourceAddrRaw}`] = decimals;
        return formattedSupply;
    } catch (error) {
        console.error(`Failed to fetch decimals for ${origin} at ${sourceAddrRaw}:`, error);
    }
}

async function solDecimals(sourceAddr: string) {
    const RPC_URL = 'https://rpc.ankr.com/solana';
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const address = new PublicKey(sourceAddr);
    const mintInfo: object = await getMint(connection, address);
    /* 
    console.log("Token Supply: ", mintInfo.supply.toString());
    console.log("Decimals: ", mintInfo.decimals);
    console.log("Mint Authority: ", mintInfo.mintAuthority?.toString());
    console.log("Freeze Authority: ", mintInfo.freezeAuthority?.toString()); */
    /* const RPC_URL = 'https://api.devnet.solana.com';
    const connection = new Connection(RPC_URL, 'confirmed');
    const mintAddress = new PublicKey(sourceAddr);

    try {
        const mintInfo = await connection.getAccountInfo(mintAddress);
        if (mintInfo) {
            console.log("Decimals:", mintInfo.data[0]); // Adjust based on actual structure
            console.log("Supply:", mintInfo.lamports);
        }
    } catch (error) {
        console.error('Error fetching token supply:', error);
    } */
}

function terraDecimals(sourceAddr: string) {
    const outputKey = `terra_${sourceAddr}`;
    if (outputDecimals[outputKey]) return;

    if (sourceAddr === 'uusd' || sourceAddr === 'uluna') {
        console.log('terra', sourceAddr, 6);
        outputDecimals[outputKey] = 6;
    }
    // Terra client setup and contract details retrieval logic would go here.
}

function doNothing(sourceAddr: string) {
    console.log('not ready', sourceAddr);
}

export async function getTokenData(chain: string, rawAddr: string): Promise<number> {
    let result: number = 0;
    switch (chain) {
        case 'sol':
            await solDecimals(rawAddr);
            break;
        case 'terra':
        case 'aptos':
            terraDecimals(rawAddr);
            break;
        case 'eth':
            var bal = await etherBalance(chain as ProviderKey, rawAddr, '0x3ee18B2214AFF97000D974cf647E7C347E8fa585');
            result = typeof bal === 'string'? parseFloat(bal) : bal
            break;
        default:
            var bal = await evmDecimals(chain as ProviderKey, rawAddr) || 0;
            result = typeof bal === 'string'? parseFloat(bal) : bal
    }
    return result;
}

function containsAddress(text: string): boolean {
    return text.toLowerCase().includes("address");
}

function getAddressIndices(row: string[]): number[] {
    return row.reduce((indices, col, index) => {
        if (containsAddress(col)) indices.push(index);
        return indices;
    }, [] as number[]);
}

// Function to fetch and read CSV data
export async function fetchCSV(url: string): Promise<string[][]> {
    try {
        const response = await fetch(url);
        const data = await response.text();
        return data.split('\n').map(row => row.split(','));
    } catch (error) {
        console.error("Error fetching CSV:", error);
    }
    return [];
}

export async function fetchTokenSymbolsfromCSV(url: string): Promise<string[]> {
    const symbol_list: string[] = [];
    const rows = await fetchCSV(url);
    for (const row of rows) {
        symbol_list.push(row[1])
    }
    return symbol_list
}

export async function fetchTokenDatafromCSV(url: string, symbol: string): Promise<Record<string, number>> {
    const rows = await fetchCSV(url);
    const headers = rows[0];
    const addressIndices = getAddressIndices(rows[0]);

    const tokenData_map: Record<string, number> = {};
    for (const row of rows) {
        let symbol_data = row[1];
        if (symbol_data === symbol) {
            for (const i of addressIndices) {
                if (row[i]) { // Check if the cell is not empty
                    symbol = headers[i].slice(0, -7); // Remove 'Address' suffix
                    symbol = (symbol === 'source') ? row[0] : symbol;
                    const totalSupply = await getTokenData(symbol, row[i]);
                    console.log(symbol, row[i], totalSupply);
                    tokenData_map[symbol] = totalSupply;
                }
            }
            console.log(""); // Line break for readability
        }
    }
    //console.log(tokenData_map);
    return tokenData_map;
}
