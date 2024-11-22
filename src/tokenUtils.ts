import { ethers } from 'ethers';

import { getMint, Mint } from '@solana/spl-token';
import { Connection, clusterApiUrl, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js';

// Define types for token data and providers
type ProviderKey = 'eth' | 'avax' | 'ftm' | 'matic' | 'oasis' | 'bsc' | 'aurora' | 'celo' | 'moonbeam' | 'base';
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
    moonbeam: new ethers.providers.JsonRpcProvider('https://rpc.api.moonbeam.network'),
    base: new ethers.providers.JsonRpcProvider('https://base.drpc.org'),
};

// bridge contract 
const bridge_address: Record<string, string> = {
    eth: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    avax: '0x0e082f06ff657d94310cb8ce8b0d9a04541d8052',
    ftm: '0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2',
    matic: '0x5a58505a96d1dbf8df91cb21b54419fc36e93fde',
    oasis: '0x5848C791e09901b40A9Ef749f2a6735b418d7564',
    bsc: '0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7',
    aurora: '',
    celo: '',
    moonbeam: '0xB1731c586ca89a23809861c6103F0b96B3F57D92',
    sol:'GugU1tP7doLeTw9hQP51xRJyS8Da1fWxuiy2rVrnMD2m'
};

const outputDecimals: OutputDecimalsMap = {};

async function getTokenBalance(chain: string, sourceAddrRaw: string, account: string): Promise<number> {
    
    try {
        switch (chain) {
            case 'sol':
                var bal = await splBalance(sourceAddrRaw, account) || 0;
                return typeof bal === 'string'? parseFloat(bal) : bal
                break;
            default:
                const provider = providers[chain as ProviderKey];
                const contract = new ethers.Contract(sourceAddrRaw, erc20Abi, provider);

                const symbol = await contract.symbol();
                const decimals = await contract.decimals();
                const balance = await contract.balanceOf(account);
                const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));

                console.log(origin, symbol, decimals, formattedBalance, 'balance');
                outputDecimals[`${origin}_${sourceAddrRaw}`] = decimals;
                return formattedBalance;
        }
    } catch (error) {
        console.error(`Failed to fetch balance for ${origin} at ${sourceAddrRaw}:`, error);
    }
    return 0;
}

async function evmDecimals(origin: ProviderKey, sourceAddrRaw: string): Promise<number | undefined> {
    try {
        const provider = providers[origin];
        const contract = new ethers.Contract(sourceAddrRaw, erc20Abi, provider);

        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const totalSupply = await contract.totalSupply();
        const formattedSupply = parseFloat(ethers.utils.formatUnits(totalSupply, decimals));

        outputDecimals[`${origin}_${sourceAddrRaw}`] = decimals;
        return formattedSupply;
    } catch (error) {
        console.error(`Failed to fetch decimals for ${origin} at ${sourceAddrRaw}:`, error);
    }
}

async function solDecimals(sourceAddr: string) {
    const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=bf459c4b-ed80-4bda-9c9f-39dff054126b'//'https://rpc.ankr.com/solana';
    const connection = new Connection(RPC_URL, 'confirmed');

    const mintPublicKey = new PublicKey(sourceAddr);
    const supplyInfo = await connection.getTokenSupply(mintPublicKey);
    return supplyInfo.value.uiAmount
}

async function splBalance(sourceAddr: string, account: string) {
    const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=bf459c4b-ed80-4bda-9c9f-39dff054126b'//'https://rpc.ankr.com/solana';
    const connection = new Connection(RPC_URL, 'confirmed');

    // Parse wallet and token mint addresses
    const walletPublicKey = new PublicKey(account);
    const tokenMintPublicKey = new PublicKey(sourceAddr);
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    
    const filters:GetProgramAccountsFilter[] = [
        {
          dataSize: 165,    //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32,     //location of our query in the account (bytes)
            bytes: walletPublicKey.toBase58(),  //our search criteria, a base58 encoded string
          }            
        }
     ];

     const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,   //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {filters: filters}
    );
    console.log(`Found ${accounts.length} token account(s) for wallet ${walletPublicKey}.`)

    let splBalance : number = 0;
    accounts.forEach((account, i) => {
        //Parse the account data
        const parsedAccountInfo:any = account.account.data;
        const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        //Log results
        if(mintAddress === tokenMintPublicKey.toBase58()){
            console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
            console.log(`--Token Mint: ${mintAddress}`);
            console.log(`--Token Balance: ${tokenBalance}`);
            splBalance = tokenBalance
        }
    });
    return splBalance
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
            var bal = await solDecimals(rawAddr) || 0;
            result = typeof bal === 'string'? parseFloat(bal) : bal
            break;
        case 'terra':
        case 'aptos':
            terraDecimals(rawAddr);
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

export async function fetchTokenSymbolsfromCSV(url: string, source_chain: string): Promise<string[]> {
    const symbol_list: string[] = [];
    const rows = await fetchCSV(url);
    for (const row of rows) {
        let source_symbol = row[0];
        if(source_symbol === source_chain){
            symbol_list.push(row[1])
        }
    }
    return symbol_list
}

export async function fetchTokenDatafromCSV(url: string, symbol: string): Promise<[Record<string, number>, string []]> {
    const rows = await fetchCSV(url);
    const headers = rows[0];
    const addressIndices = getAddressIndices(rows[0]);

    const tokenData_map: Record<string, number> = {};
    const sourceChain_set = new Set<string>;
    for (const row of rows) {
        let symbol_data = row[1];
        let source_symbol = row[0];
        if(source_symbol.length !== 0)
            sourceChain_set.add(source_symbol)
        if (symbol_data === symbol) {
            for (const i of addressIndices) {
                if (row[i]) { // Check if the cell is not empty
                    symbol = headers[i].slice(0, -7); // Remove 'Address' suffix
                    if(symbol === 'source') {
                        const token_balance = await getTokenBalance(source_symbol as ProviderKey, row[i], bridge_address[source_symbol]);
                        tokenData_map[source_symbol] = token_balance;
                    } else{
                        const totalSupply = await getTokenData(symbol, row[i]);
                        console.log(symbol, row[i], totalSupply);
                        tokenData_map[symbol] = totalSupply;
                    }
                }
            }
            console.log(""); // Line break for readability
        }
    }
    //console.log(sourceChain_set);
    const sourceChain_list = Array.from(sourceChain_set);
    return [tokenData_map, sourceChain_list];
}
