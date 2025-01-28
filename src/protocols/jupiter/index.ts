import type { IStakingProtocol, StakeParams, SupportedChain } from "../../types";
import type { Transaction } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";
import { ComputeBudgetProgram, VersionedTransaction, TransactionMessage, AddressLookupTableAccount } from "@solana/web3.js";

export class JupiterProtocol implements IStakingProtocol {
    supportedChains: SupportedChain[] = ["solana"];

    private async fetchStakeTransactionData(walletProvider: EdwinSolanaWallet, amount: number) {
        console.log(`Fetching transaction data for amount: ${amount}`);
        const res = await fetch(
            `https://worker.jup.ag/blinks/swap/So11111111111111111111111111111111111111112/jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v/${amount}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account: walletProvider.getPublicKey().toBase58(),
                }),
            },
        );

        if (!res.ok) {
            throw new Error(`Failed to fetch transaction data: ${res.statusText}`);
        }

        const data = await res.json();
        console.log(`Fetched transaction data: ${JSON.stringify(data)}`);
        return data;
    }

    async stake(params: StakeParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { chain, amount } = params;

        if (chain !== "solana") {
            throw new Error("Unsupported chain");
        }

        console.log(`Staking ${amount} SOL on ${chain} chain`);

        try {
            const data = await this.fetchStakeTransactionData(walletProvider, Number(amount));
            
            const txn = VersionedTransaction.deserialize(
                Buffer.from(data.transaction, "base64"),
            );

            console.log('before sol parser');

            const LUTs = (await Promise.all(txn.message.addressTableLookups
                .map((acc) => walletProvider.getConnection().getAddressLookupTable(acc.accountKey))))
                .map((lut) => lut.value).filter((val) => val !== null) as AddressLookupTableAccount[];
            
            console.log('after accountKeysFromLookups');
            const txnMessage = TransactionMessage.decompile(txn.message, { addressLookupTableAccounts: LUTs }); // TODO fix 
            console.log('Deserialized transaction message');
            const txnInstructions = txnMessage.instructions;
            
            // Set priority fee
            const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 9000
            });
            console.log(`txnInstructions length: ${txnInstructions.length}`);
            console.log(`addPriorityFee data: ${addPriorityFee.data}`);
            console.log(`txnInstructions[1] data: ${txnInstructions[1].data}`);

            console.log(`addPriorityFee keys: ${addPriorityFee.keys}`);
            console.log(`txnInstructions[1] keys: ${txnInstructions[1].keys}`);

            console.log(`addPriorityFee programId: ${addPriorityFee.programId}`);
            console.log(`txnInstructions[1] programId: ${txnInstructions[1].programId}`);

            txnInstructions[1] = addPriorityFee;

            // Set compute unit limit
            const addComputeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
                units: 200000
            })

            txnInstructions[0] = addComputeUnitLimit;

            const { blockhash } = await walletProvider.getConnection().getLatestBlockhash();
            console.log('Make new Message');

            const newMsg = new TransactionMessage({
                ...txnMessage,
                recentBlockhash: blockhash,
                instructions: txnInstructions,
            }).compileToV0Message(LUTs);

            console.log('Make new Transaction');
            const newTxn = new VersionedTransaction(newMsg);
    
            console.log('sign transaction');

            // Sign and send transaction
            walletProvider.signTransaction(newTxn);
            
            console.log('send transaction');

            const signature = await walletProvider.getConnection().sendTransaction(newTxn, {
                preflightCommitment: "confirmed",
                maxRetries: 3,
            });

            console.log(`Transaction sent with signature: ${signature}`);

            const latestBlockhash = await walletProvider.getConnection().getLatestBlockhash();
            await walletProvider.getConnection().confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });

            console.log(`Transaction confirmed with signature: ${signature}`);
            return signature;

        } catch (error: any) {
            console.error(`jupSOL staking failed: ${error.message}`);
            throw new Error(`jupSOL staking failed: ${error.message}`);
        }
    }

    async unstake(params: StakeParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        const { chain, amount } = params;

        throw new Error("Not implemented");
    }

    async claimRewards(params: StakeParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        const { chain } = params;

        throw new Error("Not implemented");
    }
}

