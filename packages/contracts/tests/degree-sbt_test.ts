import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure that staking works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000) // 1 STX in microSTX
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Check stake was recorded
    let stakeQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'get-user-stake',
      [types.principal(wallet1.address)],
      deployer.address
    );
    
    const stakeData = stakeQuery.result.expectSome().expectTuple();
    assertEquals(stakeData['amount'], types.uint(1000000));
    assertEquals(stakeData['is-active'], types.bool(true));
  },
});

Clarinet.test({
  name: "Ensure that insufficient stake amount fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(500000) // 0.5 STX - below minimum
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(105); // err-insufficient-stake
  },
});

Clarinet.test({
  name: "Ensure that duplicate staking fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // First stake
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Second stake should fail
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000)
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(106); // err-stake-already-exists
  },
});

Clarinet.test({
  name: "Ensure that eligibility check works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // First stake
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Check eligibility
    let eligibilityQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'is-eligible-for-degree',
      [types.principal(wallet1.address)],
      deployer.address
    );
    
    const eligibility = eligibilityQuery.result.expectTuple();
    assertEquals(eligibility['has-active-stake'], types.bool(true));
    assertEquals(eligibility['already-has-degree'], types.bool(false));
  },
});

Clarinet.test({
  name: "Ensure that degree minting requires stake",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Try to mint degree without stake
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(107); // err-no-stake-found
  },
});

Clarinet.test({
  name: "Ensure that reward calculation works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let rewardQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'calculate-reward',
      [types.principal(wallet1.address)],
      deployer.address
    );
    
    // Base reward (500000) + bonus for extra modules
    const expectedReward = rewardQuery.result.expectUint();
    // Should be at least the base reward amount
    assertEquals(expectedReward >= 500000, true);
  },
});

Clarinet.test({
  name: "Ensure that admin functions work correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Test setting required modules
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'set-required-modules', [
        types.uint(5)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Test non-admin cannot set required modules
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'set-required-modules', [
        types.uint(5)
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(100); // err-owner-only
  },
});

Clarinet.test({
  name: "Ensure that required module management works",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Add required module
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'add-required-module', [
        types.ascii("module-blockchain-basics")
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Remove required module
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'remove-required-module', [
        types.ascii("module-blockchain-basics")
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "Ensure that SBT transfer always fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'transfer', [
        types.uint(1),
        types.principal(wallet1.address),
        types.principal(wallet2.address)
      ], wallet1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(104); // err-transfer-not-allowed
  },
});
