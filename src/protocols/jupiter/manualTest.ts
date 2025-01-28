import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { EdwinSolanaWallet } from '../../edwin-core/providers/solana_wallet';
import { JupiterProtocol } from '.';
import { StakeParams } from '../../types';
// import { SolanaAgentKit } from '../../../../solana-agent-kit/src';
// import { stakeWithJup } from '../../../../solana-agent-kit/src/tools';

async function testJupiterStake(walletProvider: EdwinSolanaWallet) {
    const jupiterProtocol = new JupiterProtocol();

    const params: StakeParams = {
        asset: 'sol',
        protocol: 'jupiter',
        chain: "solana",
        amount: "0.001",
    };

    try {
        const signature = await jupiterProtocol.stake(params, walletProvider);
        console.log(`Transaction successful with signature: ${signature}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Transaction failed: ${error.message}`);
        }
        console.error(`Transaction failed with unknown error: ${error}`);
    }
}

// async function testStakeWithJup(walletProvider: EdwinSolanaWallet) {
//     const agent = new SolanaAgentKit(process.env.SOLANA_PRIVATE_KEY || "",  "https://api.mainnet-beta.solana.com", null);

//     try {
//         const signature = await stakeWithJup(agent, 0.001);
//         console.log(`Transaction successful with signature: ${signature}`);
//     } catch (error) {
//         if (error instanceof Error) {
//             console.error(`Transaction failed: ${error.message}`);
//         }
//         console.error(`Transaction failed with unknown error: ${error}`);
//     }
// }

async function main() {
    const privateKey = process.env.SOLANA_PRIVATE_KEY || "";
    const walletProvider = new EdwinSolanaWallet(privateKey);
    
    // await testStakeWithJup(walletProvider);
    await testJupiterStake(walletProvider);
}

main();