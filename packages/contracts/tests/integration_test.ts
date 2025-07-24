import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Integration test: Complete degree flow with module NFTs and staking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const student = accounts.get('wallet_1')!;
    
    // Step 1: Student stakes STX for degree commitment
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000) // 1 STX
      ], student.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Step 2: Mint required module NFTs for the student
    block = chain.mineBlock([
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-001"),
        types.ascii("Blockchain Fundamentals")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-002"),
        types.ascii("Smart Contract Development")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-003"),
        types.ascii("DeFi Protocols")
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 3);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectOk().expectUint(2);
    block.receipts[2].result.expectOk().expectUint(3);
    
    // Step 3: Check eligibility for degree
    let eligibilityQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'is-eligible-for-degree',
      [types.principal(student.address)],
      deployer.address
    );
    
    const eligibility = eligibilityQuery.result.expectTuple();
    assertEquals(eligibility['modules-sufficient'], types.bool(true));
    assertEquals(eligibility['has-active-stake'], types.bool(true));
    assertEquals(eligibility['already-has-degree'], types.bool(false));
    
    // Step 4: Mint degree SBT
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(student.address)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Step 5: Verify degree was minted and metadata is correct
    let degreeQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'get-degree-metadata',
      [types.uint(1)],
      deployer.address
    );
    
    const degreeData = degreeQuery.result.expectSome().expectTuple();
    assertEquals(degreeData['recipient'], types.principal(student.address));
    assertEquals(degreeData['modules-completed'], types.uint(3));
    assertEquals(degreeData['stake-amount'], types.uint(1000000));
    
    // Step 6: Verify student now has degree
    let hasDegreeQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'has-degree',
      [types.principal(student.address)],
      deployer.address
    );
    
    assertEquals(hasDegreeQuery.result, types.bool(true));
    
    // Step 7: Verify stake is now inactive
    let stakeQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'get-user-stake',
      [types.principal(student.address)],
      deployer.address
    );
    
    const stakeData = stakeQuery.result.expectSome().expectTuple();
    assertEquals(stakeData['is-active'], types.bool(false));
  },
});

Clarinet.test({
  name: "Integration test: Insufficient modules prevents degree minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const student = accounts.get('wallet_2')!;
    
    // Step 1: Student stakes STX
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000)
      ], student.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Step 2: Mint only 2 modules (insufficient for degree)
    block = chain.mineBlock([
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-001"),
        types.ascii("Blockchain Fundamentals")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-002"),
        types.ascii("Smart Contract Development")
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectOk().expectUint(2);
    
    // Step 3: Try to mint degree (should fail)
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(student.address)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(103); // err-insufficient-modules
  },
});

Clarinet.test({
  name: "Integration test: Bonus rewards for extra modules",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const student = accounts.get('wallet_3')!;
    
    // Step 1: Student stakes STX
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(2000000) // 2 STX
      ], student.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Step 2: Mint 5 modules (2 extra beyond required 3)
    block = chain.mineBlock([
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-001"),
        types.ascii("Blockchain Fundamentals")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-002"),
        types.ascii("Smart Contract Development")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-003"),
        types.ascii("DeFi Protocols")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-004"),
        types.ascii("Advanced Clarity")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-005"),
        types.ascii("Stacks Ecosystem")
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 5);
    
    // Step 3: Check reward calculation
    let rewardQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'calculate-reward',
      [types.principal(student.address)],
      deployer.address
    );
    
    // Base reward (500000) + 2 extra modules * 100000 = 700000
    const expectedReward = rewardQuery.result.expectUint();
    assertEquals(expectedReward, 700000);
    
    // Step 4: Mint degree and verify reward was distributed
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(student.address)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Step 5: Verify degree metadata includes correct reward
    let degreeQuery = chain.callReadOnlyFn(
      'degree-sbt',
      'get-degree-metadata',
      [types.uint(1)],
      deployer.address
    );
    
    const degreeData = degreeQuery.result.expectSome().expectTuple();
    assertEquals(degreeData['modules-completed'], types.uint(5));
    assertEquals(degreeData['reward-earned'], types.uint(700000));
  },
});

Clarinet.test({
  name: "Integration test: Prevent duplicate degree minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const student = accounts.get('wallet_4')!;
    
    // Complete the full degree flow first
    let block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'stake-for-degree', [
        types.uint(1000000)
      ], student.address)
    ]);
    
    // Mint required modules
    block = chain.mineBlock([
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-001"),
        types.ascii("Blockchain Fundamentals")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-002"),
        types.ascii("Smart Contract Development")
      ], deployer.address),
      Tx.contractCall('module-nft', 'mint', [
        types.principal(student.address),
        types.ascii("module-003"),
        types.ascii("DeFi Protocols")
      ], deployer.address)
    ]);
    
    // Mint first degree
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(student.address)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(1);
    
    // Try to mint second degree (should fail)
    block = chain.mineBlock([
      Tx.contractCall('degree-sbt', 'mint-degree', [
        types.principal(student.address)
      ], deployer.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    block.receipts[0].result.expectErr().expectUint(102); // err-already-minted
  },
});
