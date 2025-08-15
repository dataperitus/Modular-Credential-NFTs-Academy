;; Staking Contract
;; Enables token staking for validator eligibility and rewards

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-authorized (err u201))
(define-constant err-insufficient-balance (err u202))
(define-constant err-invalid-amount (err u203))
(define-constant err-stake-not-found (err u204))
(define-constant err-stake-locked (err u205))
(define-constant err-already-validator (err u206))
(define-constant err-minimum-stake-not-met (err u207))
(define-constant err-invalid-lock-period (err u208))

;; Staking constants
(define-constant minimum-stake u1000000000) ;; 1000 tokens with 6 decimals
(define-constant minimum-validator-stake u1000000000) ;; 1000 tokens for validator
(define-constant reward-rate u5) ;; 5% annual reward rate
(define-constant blocks-per-year u52560) ;; Assuming 10 minute blocks
(define-constant max-lock-period u52560) ;; 1 year maximum lock

;; Data variables
(define-data-var next-stake-id uint u1)
(define-data-var total-staked uint u0)
(define-data-var governance-token-contract principal .governance-token)

;; Data maps
(define-map stakes uint {
  staker: principal,
  amount: uint,
  lock-period: uint,
  start-block: uint,
  end-block: uint,
  claimed-rewards: uint,
  active: bool
})

(define-map user-stakes principal (list 10 uint))
(define-map validator-info principal {
  stake-id: uint,
  metadata: (string-ascii 256),
  registration-block: uint,
  total-validations: uint,
  successful-validations: uint,
  active: bool
})

(define-map validator-list (list 100 principal))
(define-data-var active-validators (list 100 principal) (list))

;; Read-only functions
(define-read-only (get-stake (stake-id uint))
  (map-get? stakes stake-id)
)

(define-read-only (get-user-stakes (user principal))
  (default-to (list) (map-get? user-stakes user))
)

(define-read-only (get-validator-info (validator principal))
  (map-get? validator-info validator)
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (get-active-validators)
  (var-get active-validators)
)

(define-read-only (calculate-rewards (stake-id uint))
  (match (map-get? stakes stake-id)
    stake (let ((blocks-staked (- block-height (get start-block stake)))
                (annual-reward (/ (* (get amount stake) reward-rate) u100))
                (reward-per-block (/ annual-reward blocks-per-year)))
            (ok (* reward-per-block blocks-staked)))
    (err err-stake-not-found)
  )
)

(define-read-only (is-validator (user principal))
  (match (map-get? validator-info user)
    validator (get active validator)
    false
  )
)

;; Public functions
(define-public (stake (amount uint) (lock-period uint))
  (let ((stake-id (var-get next-stake-id))
        (end-block (+ block-height lock-period)))
    (asserts! (>= amount minimum-stake) err-minimum-stake-not-met)
    (asserts! (<= lock-period max-lock-period) err-invalid-lock-period)
    
    ;; Transfer tokens from user to contract
    (try! (contract-call? .governance-token transfer amount tx-sender (as-contract tx-sender) none))
    
    ;; Create stake record
    (map-set stakes stake-id {
      staker: tx-sender,
      amount: amount,
      lock-period: lock-period,
      start-block: block-height,
      end-block: end-block,
      claimed-rewards: u0,
      active: true
    })
    
    ;; Update user stakes list
    (let ((current-stakes (default-to (list) (map-get? user-stakes tx-sender))))
      (map-set user-stakes tx-sender (unwrap! (as-max-len? (append current-stakes stake-id) u10) (err u999)))
    )
    
    ;; Update totals
    (var-set next-stake-id (+ stake-id u1))
    (var-set total-staked (+ (var-get total-staked) amount))
    
    (print {action: "stake", stake-id: stake-id, staker: tx-sender, amount: amount, lock-period: lock-period})
    (ok stake-id)
  )
)

(define-public (unstake (stake-id uint))
  (let ((stake (unwrap! (map-get? stakes stake-id) err-stake-not-found)))
    (asserts! (is-eq (get staker stake) tx-sender) err-not-authorized)
    (asserts! (get active stake) err-stake-not-found)
    (asserts! (>= block-height (get end-block stake)) err-stake-locked)
    
    ;; Calculate and add unclaimed rewards
    (let ((rewards (unwrap-panic (calculate-rewards stake-id)))
          (total-amount (+ (get amount stake) rewards)))
      
      ;; Mark stake as inactive
      (map-set stakes stake-id (merge stake {active: false}))
      
      ;; Transfer tokens back to user
      (try! (as-contract (contract-call? .governance-token transfer total-amount tx-sender (get staker stake) none)))
      
      ;; Update total staked
      (var-set total-staked (- (var-get total-staked) (get amount stake)))
      
      ;; If user is validator, deactivate
      (match (map-get? validator-info tx-sender)
        validator-data (if (is-eq (get stake-id validator-data) stake-id)
                        (begin
                          (map-set validator-info tx-sender (merge validator-data {active: false}))
                          (remove-validator tx-sender))
                        true)
        true)
      
      (print {action: "unstake", stake-id: stake-id, staker: tx-sender, amount: (get amount stake), rewards: rewards})
      (ok total-amount)
    )
  )
)

(define-public (claim-rewards (stake-id uint))
  (let ((stake (unwrap! (map-get? stakes stake-id) err-stake-not-found)))
    (asserts! (is-eq (get staker stake) tx-sender) err-not-authorized)
    (asserts! (get active stake) err-stake-not-found)
    
    (let ((rewards (unwrap-panic (calculate-rewards stake-id)))
          (new-claimed (+ (get claimed-rewards stake) rewards)))
      
      ;; Update claimed rewards
      (map-set stakes stake-id (merge stake {
        claimed-rewards: new-claimed,
        start-block: block-height ;; Reset reward calculation
      }))
      
      ;; Mint reward tokens
      (try! (contract-call? .governance-token mint tx-sender rewards))
      
      (print {action: "claim-rewards", stake-id: stake-id, staker: tx-sender, rewards: rewards})
      (ok rewards)
    )
  )
)

(define-public (register-validator (metadata (string-ascii 256)))
  (let ((user-stake-list (default-to (list) (map-get? user-stakes tx-sender))))
    ;; Check if user already is a validator
    (asserts! (is-none (map-get? validator-info tx-sender)) err-already-validator)
    
    ;; Find a stake that meets validator requirements
    (let ((qualifying-stake (find-qualifying-stake user-stake-list)))
      (asserts! (is-some qualifying-stake) err-minimum-stake-not-met)
      
      (let ((stake-id (unwrap-panic qualifying-stake)))
        ;; Register as validator
        (map-set validator-info tx-sender {
          stake-id: stake-id,
          metadata: metadata,
          registration-block: block-height,
          total-validations: u0,
          successful-validations: u0,
          active: true
        })
        
        ;; Add to active validators list
        (add-validator tx-sender)
        
        (print {action: "register-validator", validator: tx-sender, stake-id: stake-id, metadata: metadata})
        (ok true)
      )
    )
  )
)

(define-public (deregister-validator)
  (let ((validator-data (unwrap! (map-get? validator-info tx-sender) err-not-authorized)))
    (asserts! (get active validator-data) err-not-authorized)
    
    ;; Deactivate validator
    (map-set validator-info tx-sender (merge validator-data {active: false}))
    
    ;; Remove from active validators list
    (remove-validator tx-sender)
    
    (print {action: "deregister-validator", validator: tx-sender})
    (ok true)
  )
)

;; Private functions
(define-private (find-qualifying-stake (stake-list (list 10 uint)))
  (fold find-qualifying-stake-iter stake-list none)
)

(define-private (find-qualifying-stake-iter (stake-id uint) (result (optional uint)))
  (if (is-some result)
    result
    (match (map-get? stakes stake-id)
      stake (if (and (get active stake) (>= (get amount stake) minimum-validator-stake))
              (some stake-id)
              none)
      none
    )
  )
)

(define-private (add-validator (validator principal))
  (let ((current-validators (var-get active-validators)))
    (var-set active-validators 
      (unwrap! (as-max-len? (append current-validators validator) u100) false))
    true
  )
)

(define-private (remove-validator (validator principal))
  (let ((current-validators (var-get active-validators)))
    (var-set active-validators 
      (filter is-not-target-validator current-validators))
    true
  )
)

(define-private (is-not-target-validator (validator principal))
  (not (is-eq validator tx-sender))
)

;; Admin functions
(define-public (set-governance-token-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set governance-token-contract new-contract)
    (ok true)
  )
)
