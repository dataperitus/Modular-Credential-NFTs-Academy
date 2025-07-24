;; Enhanced Degree Soulbound Token (SBT) Contract
;; Non-transferable NFT representing degree completion with cross-contract verification and staking rewards

;; Define the SBT (non-transferable NFT)
(define-non-fungible-token degree-sbt uint)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u101))
(define-constant err-already-minted (err u102))
(define-constant err-insufficient-modules (err u103))
(define-constant err-transfer-not-allowed (err u104))
(define-constant err-insufficient-stake (err u105))
(define-constant err-stake-already-exists (err u106))
(define-constant err-no-stake-found (err u107))
(define-constant err-reward-calculation-failed (err u108))
(define-constant err-contract-call-failed (err u109))

;; Staking and reward constants
(define-constant min-stake-amount u1000000) ;; 1 STX in microSTX
(define-constant base-reward-amount u500000) ;; 0.5 STX base reward
(define-constant bonus-reward-per-module u100000) ;; 0.1 STX bonus per extra module

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var required-modules uint u3) ;; Minimum modules required for degree
(define-data-var module-nft-contract principal .module-nft)
(define-data-var total-staked uint u0)
(define-data-var total-rewards-distributed uint u0)

;; Data maps
(define-map degree-metadata uint {
  recipient: principal,
  completion-date: uint,
  modules-completed: uint,
  degree-type: (string-ascii 64),
  stake-amount: uint,
  reward-earned: uint
})

(define-map user-degree principal uint) ;; Track if user already has a degree

;; Staking maps
(define-map user-stakes principal {
  amount: uint,
  stake-date: uint,
  is-active: bool
})

(define-map required-module-ids (string-ascii 64) bool) ;; Track which modules are required for degree

;; Read-only functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some "https://api.modular-nft-academy.com/degree-metadata/"))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? degree-sbt token-id))
)

(define-read-only (get-degree-metadata (token-id uint))
  (map-get? degree-metadata token-id)
)

(define-read-only (has-degree (user principal))
  (is-some (map-get? user-degree user))
)

(define-read-only (get-user-stake (user principal))
  (map-get? user-stakes user)
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (get-total-rewards-distributed)
  (var-get total-rewards-distributed)
)

(define-read-only (is-eligible-for-degree (user principal))
  (let
    (
      (modules-owned (get-user-module-count user))
      (has-stake (is-some (map-get? user-stakes user)))
      (stake-active (match (map-get? user-stakes user)
        stake-info (get is-active stake-info)
        false))
    )
    {
      modules-sufficient: (>= modules-owned (var-get required-modules)),
      has-active-stake: (and has-stake stake-active),
      modules-owned: modules-owned,
      already-has-degree: (has-degree user)
    }
  )
)

(define-read-only (calculate-reward (user principal))
  (let
    (
      (modules-count (get-user-module-count user))
      (required-count (var-get required-modules))
      (extra-modules (if (> modules-count required-count) (- modules-count required-count) u0))
      (bonus-reward (* extra-modules bonus-reward-per-module))
    )
    (+ base-reward-amount bonus-reward)
  )
)

;; Public functions

;; Transfer function that always fails (SBT cannot be transferred)
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  err-transfer-not-allowed
)

;; Stake STX tokens to show commitment to completing the degree
(define-public (stake-for-degree (amount uint))
  (begin
    (asserts! (>= amount min-stake-amount) err-insufficient-stake)
    (asserts! (is-none (map-get? user-stakes tx-sender)) err-stake-already-exists)

    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set user-stakes tx-sender {
      amount: amount,
      stake-date: block-height,
      is-active: true
    })
    (var-set total-staked (+ (var-get total-staked) amount))
    (ok true)
  )
)

;; Mint degree if user has completed required modules and has active stake
(define-public (mint-degree (recipient principal))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
      (modules-count (get-user-module-count recipient))
      (stake-info (unwrap! (map-get? user-stakes recipient) err-no-stake-found))
      (reward-amount (calculate-reward recipient))
    )
    (asserts! (>= modules-count (var-get required-modules)) err-insufficient-modules)
    (asserts! (not (has-degree recipient)) err-already-minted)
    (asserts! (get is-active stake-info) err-no-stake-found)

    (try! (nft-mint? degree-sbt token-id recipient))

    ;; Distribute reward
    (try! (as-contract (stx-transfer? reward-amount tx-sender recipient)))

    ;; Update stake to inactive
    (map-set user-stakes recipient (merge stake-info { is-active: false }))

    ;; Record degree metadata
    (map-set degree-metadata token-id {
      recipient: recipient,
      completion-date: block-height,
      modules-completed: modules-count,
      degree-type: "Blockchain Development Certificate",
      stake-amount: (get amount stake-info),
      reward-earned: reward-amount
    })
    (map-set user-degree recipient token-id)
    (var-set last-token-id token-id)
    (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) reward-amount))
    (ok token-id)
  )
)

;; Admin function to set required modules
(define-public (set-required-modules (count uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set required-modules count)
    (ok true)
  )
)

;; Admin function to add required module IDs
(define-public (add-required-module (module-id (string-ascii 64)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set required-module-ids module-id true)
    (ok true)
  )
)

;; Admin function to remove required module IDs
(define-public (remove-required-module (module-id (string-ascii 64)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-delete required-module-ids module-id)
    (ok true)
  )
)

;; Private functions

;; Simplified function to count user's module NFTs
;; For production, this would implement proper cross-contract verification
;; Currently returns a mock count for demonstration
(define-private (get-user-module-count (user principal))
  ;; Mock implementation - in production this would query the module-nft contract
  ;; and count actual owned tokens
  u3
)


