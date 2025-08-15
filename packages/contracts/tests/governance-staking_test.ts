import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Governance token initialization and basic operations",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Initialize the governance token
        let block = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), true);

        // Check initial supply goes to deployer
        let getBalanceBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-balance', [types.principal(deployer.address)], deployer.address)
        ]);
        
        assertEquals(getBalanceBlock.receipts[0].result.expectOk(), types.uint(100000000000000));

        // Transfer tokens
        let transferBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(wallet1.address), types.none()], 
                deployer.address)
        ]);
        
        assertEquals(transferBlock.receipts[0].result.expectOk(), true);

        // Check balances after transfer
        let wallet1Balance = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-balance', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        assertEquals(wallet1Balance.receipts[0].result.expectOk(), types.uint(1000000000));
    },
});

Clarinet.test({
    name: "Governance token delegation functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;

        // Initialize and transfer tokens first
        let setupBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(wallet1.address), types.none()], 
                deployer.address)
        ]);

        // Delegate voting power
        let delegateBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'delegate', [types.principal(wallet2.address)], wallet1.address)
        ]);
        
        assertEquals(delegateBlock.receipts[0].result.expectOk(), true);

        // Check delegation
        let getDelegationBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-delegation', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        assertEquals(getDelegationBlock.receipts[0].result.expectSome(), types.principal(wallet2.address));

        // Check voting power
        let getVotingPowerBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'get-voting-power', [types.principal(wallet2.address)], wallet2.address)
        ]);
        
        assertEquals(getVotingPowerBlock.receipts[0].result.expectOk(), types.uint(1000000000));
    },
});

Clarinet.test({
    name: "Staking contract basic functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Initialize governance token and transfer to wallet1
        let setupBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(2000000000), types.principal(deployer.address), types.principal(wallet1.address), types.none()], 
                deployer.address)
        ]);

        // Stake tokens
        let stakeBlock = chain.mineBlock([
            Tx.contractCall('staking', 'stake', [types.uint(1000000000), types.uint(52560)], wallet1.address)
        ]);
        
        assertEquals(stakeBlock.receipts[0].result.expectOk(), types.uint(1));

        // Check total staked
        let getTotalStakedBlock = chain.mineBlock([
            Tx.contractCall('staking', 'get-total-staked', [], wallet1.address)
        ]);
        
        assertEquals(getTotalStakedBlock.receipts[0].result, types.uint(1000000000));

        // Check stake details
        let getStakeBlock = chain.mineBlock([
            Tx.contractCall('staking', 'get-stake', [types.uint(1)], wallet1.address)
        ]);
        
        const stakeDetails = getStakeBlock.receipts[0].result.expectSome().expectTuple();
        assertEquals(stakeDetails['staker'], types.principal(wallet1.address));
        assertEquals(stakeDetails['amount'], types.uint(1000000000));
        assertEquals(stakeDetails['active'], types.bool(true));
    },
});

Clarinet.test({
    name: "Validator registration and staking integration",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        // Setup: Initialize token, transfer, and stake
        let setupBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(2000000000), types.principal(deployer.address), types.principal(wallet1.address), types.none()], 
                deployer.address),
            Tx.contractCall('staking', 'stake', [types.uint(1000000000), types.uint(52560)], wallet1.address)
        ]);

        // Register as validator
        let registerValidatorBlock = chain.mineBlock([
            Tx.contractCall('staking', 'register-validator', [types.ascii("Experienced blockchain developer")], wallet1.address)
        ]);
        
        assertEquals(registerValidatorBlock.receipts[0].result.expectOk(), true);

        // Check validator info
        let getValidatorInfoBlock = chain.mineBlock([
            Tx.contractCall('staking', 'get-validator-info', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        const validatorInfo = getValidatorInfoBlock.receipts[0].result.expectSome().expectTuple();
        assertEquals(validatorInfo['active'], types.bool(true));
        assertEquals(validatorInfo['metadata'], types.ascii("Experienced blockchain developer"));

        // Check if is validator
        let isValidatorBlock = chain.mineBlock([
            Tx.contractCall('staking', 'is-validator', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        assertEquals(isValidatorBlock.receipts[0].result, types.bool(true));
    },
});

Clarinet.test({
    name: "Validation workflow and consensus",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const validator1 = accounts.get('wallet_1')!;
        const validator2 = accounts.get('wallet_2')!;
        const validator3 = accounts.get('wallet_3')!;

        // Setup validators
        let setupBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address),
            // Transfer tokens to validators
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(validator1.address), types.none()], 
                deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(validator2.address), types.none()], 
                deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(validator3.address), types.none()], 
                deployer.address),
            // Stake tokens
            Tx.contractCall('staking', 'stake', [types.uint(1000000000), types.uint(52560)], validator1.address),
            Tx.contractCall('staking', 'stake', [types.uint(1000000000), types.uint(52560)], validator2.address),
            Tx.contractCall('staking', 'stake', [types.uint(1000000000), types.uint(52560)], validator3.address),
            // Register as validators
            Tx.contractCall('staking', 'register-validator', [types.ascii("Validator 1")], validator1.address),
            Tx.contractCall('staking', 'register-validator', [types.ascii("Validator 2")], validator2.address),
            Tx.contractCall('staking', 'register-validator', [types.ascii("Validator 3")], validator3.address)
        ]);

        // Submit module for validation
        let submitModuleBlock = chain.mineBlock([
            Tx.contractCall('validation', 'submit-module-for-validation', [types.uint(101)], deployer.address)
        ]);
        
        assertEquals(submitModuleBlock.receipts[0].result.expectOk(), types.uint(1));

        // Validators submit their validations
        let validationBlock = chain.mineBlock([
            Tx.contractCall('validation', 'validate-module', 
                [types.uint(1), types.uint(85), types.ascii("Good quality content")], validator1.address),
            Tx.contractCall('validation', 'validate-module', 
                [types.uint(1), types.uint(80), types.ascii("Well structured")], validator2.address),
            Tx.contractCall('validation', 'validate-module', 
                [types.uint(1), types.uint(90), types.ascii("Excellent examples")], validator3.address)
        ]);

        // Check validation status
        let getValidationBlock = chain.mineBlock([
            Tx.contractCall('validation', 'get-validation', [types.uint(1)], deployer.address)
        ]);
        
        const validation = getValidationBlock.receipts[0].result.expectSome().expectTuple();
        assertEquals(validation['consensus-reached'], types.bool(true));
        assertEquals(validation['status'], types.ascii("approved"));
    },
});

Clarinet.test({
    name: "Governance proposal creation and voting",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const voter1 = accounts.get('wallet_1')!;
        const voter2 = accounts.get('wallet_2')!;

        // Setup: Initialize token and distribute
        let setupBlock = chain.mineBlock([
            Tx.contractCall('governance-token', 'initialize', [], deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(1000000000), types.principal(deployer.address), types.principal(voter1.address), types.none()], 
                deployer.address),
            Tx.contractCall('governance-token', 'transfer', 
                [types.uint(500000000), types.principal(deployer.address), types.principal(voter2.address), types.none()], 
                deployer.address)
        ]);

        // Create proposal
        let createProposalBlock = chain.mineBlock([
            Tx.contractCall('governance', 'create-proposal', 
                [
                    types.ascii("Increase minimum stake"),
                    types.ascii("Proposal to increase minimum stake from 1000 to 2000 tokens"),
                    types.ascii("parameter"),
                    types.none()
                ], 
                voter1.address)
        ]);
        
        assertEquals(createProposalBlock.receipts[0].result.expectOk(), types.uint(1));

        // Mine blocks to start voting period
        chain.mineEmptyBlockUntil(150);

        // Vote on proposal
        let voteBlock = chain.mineBlock([
            Tx.contractCall('governance', 'vote', [types.uint(1), types.bool(true)], voter1.address),
            Tx.contractCall('governance', 'vote', [types.uint(1), types.bool(false)], voter2.address)
        ]);

        assertEquals(voteBlock.receipts[0].result.expectOk(), true);
        assertEquals(voteBlock.receipts[1].result.expectOk(), true);

        // Check proposal status
        let getProposalBlock = chain.mineBlock([
            Tx.contractCall('governance', 'get-proposal', [types.uint(1)], deployer.address)
        ]);
        
        const proposal = getProposalBlock.receipts[0].result.expectSome().expectTuple();
        // voter1 has more voting power, so votes-for should be higher
        assertEquals(proposal['votes-for'] > proposal['votes-against'], true);
    },
});
