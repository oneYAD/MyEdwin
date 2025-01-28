import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, it, beforeEach, expect } from 'vitest';
import { Edwin, EdwinConfig } from '../src';
import { JupiterProtocol } from '../src/protocols/jupiter';
import { StakeParams } from '../src/types';
import { jest } from '@jest/globals';

describe("JupiterProtocol", () => {
    let edwin: Edwin;
    let jupiterProtocol: JupiterProtocol;

    beforeEach(() => {
        const edwinConfig: EdwinConfig = {
            solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
            actions: ['stake']
        };
        edwin = new Edwin(edwinConfig);
        jupiterProtocol = new JupiterProtocol();
    });

    it("should stake SOL with Jupiter", async () => {
        const params: StakeParams = {
            asset: 'jup',
            protocol: 'jupiter',
            chain: "solana",
            amount: "0.001",
        };

        const mockFetchResponse = {
            transaction: "mock-transaction-base64",
        };


        const walletProvider = edwin.wallets.solana as EdwinSolanaWallet;

        const result = await jupiterProtocol.stake(params, walletProvider);

        expect(result.chain).toBe("solana");
        expect(result.signature).toBe("mock-signature");
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("https://worker.jup.ag/blinks/swap"),
            expect.any(Object)
        );
        expect(walletProvider.signTransaction).toHaveBeenCalled();
        expect(walletProvider.getConnection().sendTransaction).toHaveBeenCalled();
        expect(walletProvider.getConnection().confirmTransaction).toHaveBeenCalled();
    });
});
