;; Validation Contract
;; Handles module validation by stakers and consensus mechanisms

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-not-authorized (err u301))
(define-constant err-invalid-module (err u302))
(define-constant err-already-validated (err u303))
(define-constant err-validation-not-found (err u304))
(define-constant err-consensus-reached (err u305))
(define-constant err-invalid-score (err u306))
(define-constant err-not-validator (err u307))
(define-constant err-dispute-window-closed (err u308))

;; Validation constants
(define-constant minimum-validators u3)
(define-constant consensus-threshold u66) ;; 66% agreement
(define-constant max-score u100)
(define-constant dispute-window u144) ;; ~24 hours assuming 10min blocks
(define-constant validation-reward u100000000) ;; 100 tokens reward

;; Data variables
(define-data-var next-validation-id uint u1)
(define-data-var staking-contract principal .staking)
(define-data-var module-nft-contract principal .module-nft)

;; Data maps
(define-map module-validations uint {
  module-id: uint,
  validators: (list 10 principal),
  scores: (list 10 uint),
  feedbacks: (list 10 (string-ascii 512)),
  consensus-reached: bool,
  final-score: uint,
  creation-block: uint,
  finalization-block: (optional uint),
  status: (string-ascii 32) ;; "pending", "approved", "rejected", "disputed"
})

(define-map validator-validations principal (list 100 uint))
(define-map module-validation-id uint uint) ;; module-id -> validation-id
(define-map validation-disputes uint {
  disputer: principal,
  reason: (string-ascii 256),
  dispute-block: uint,
  resolved: bool
})

;; Read-only functions
(define-read-only (get-validation (validation-id uint))
  (map-get? module-validations validation-id)
)

(define-read-only (get-module-validation (module-id uint))
  (match (map-get? module-validation-id module-id)
    validation-id (map-get? module-validations validation-id)
    none
  )
)

(define-read-only (get-validator-validations (validator principal))
  (default-to (list) (map-get? validator-validations validator))
)

(define-read-only (get-validation-dispute (validation-id uint))
  (map-get? validation-disputes validation-id)
)

(define-read-only (calculate-consensus (scores (list 10 uint)))
  (let ((total-scores (len scores))
        (passing-scores (len (filter is-passing-score scores))))
    (if (> total-scores u0)
      (>= (* passing-scores u100) (* total-scores consensus-threshold))
      false
    )
  )
)

(define-read-only (calculate-average-score (scores (list 10 uint)))
  (if (> (len scores) u0)
    (/ (fold + scores u0) (len scores))
    u0
  )
)

;; Public functions
(define-public (submit-module-for-validation (module-id uint))
  (let ((validation-id (var-get next-validation-id)))
    ;; Check if module exists (by calling module NFT contract)
    ;; This would need to be implemented based on the module NFT contract interface
    
    ;; Check if module is not already under validation
    (asserts! (is-none (map-get? module-validation-id module-id)) err-already-validated)
    
    ;; Create validation record
    (map-set module-validations validation-id {
      module-id: module-id,
      validators: (list),
      scores: (list),
      feedbacks: (list),
      consensus-reached: false,
      final-score: u0,
      creation-block: block-height,
      finalization-block: none,
      status: "pending"
    })
    
    ;; Map module to validation
    (map-set module-validation-id module-id validation-id)
    
    ;; Increment validation ID
    (var-set next-validation-id (+ validation-id u1))
    
    (print {action: "submit-validation", module-id: module-id, validation-id: validation-id})
    (ok validation-id)
  )
)

(define-public (validate-module (validation-id uint) (score uint) (feedback (string-ascii 512)))
  (let ((validation (unwrap! (map-get? module-validations validation-id) err-validation-not-found)))
    ;; Check if sender is a validator
    (asserts! (contract-call? .staking is-validator tx-sender) err-not-validator)
    
    ;; Check if consensus not already reached
    (asserts! (not (get consensus-reached validation)) err-consensus-reached)
    
    ;; Check if validator hasn't already validated this module
    (asserts! (is-none (index-of (get validators validation) tx-sender)) err-already-validated)
    
    ;; Validate score range
    (asserts! (<= score max-score) err-invalid-score)
    
    ;; Add validator and their assessment
    (let ((new-validators (unwrap! (as-max-len? (append (get validators validation) tx-sender) u10) (err u999)))
          (new-scores (unwrap! (as-max-len? (append (get scores validation) score) u10) (err u999)))
          (new-feedbacks (unwrap! (as-max-len? (append (get feedbacks validation) feedback) u10) (err u999))))
      
      ;; Update validation record
      (map-set module-validations validation-id (merge validation {
        validators: new-validators,
        scores: new-scores,
        feedbacks: new-feedbacks
      }))
      
      ;; Add to validator's validation list
      (let ((validator-list (default-to (list) (map-get? validator-validations tx-sender))))
        (map-set validator-validations tx-sender 
          (unwrap! (as-max-len? (append validator-list validation-id) u100) (err u999)))
      )
      
      ;; Check if we have enough validators for consensus
      (if (>= (len new-validators) minimum-validators)
        (try! (check-and-finalize-consensus validation-id))
        (ok true)
      )
      
      ;; Reward validator for participation
      (try! (contract-call? .governance-token mint tx-sender validation-reward))
      
      (print {action: "validate-module", validation-id: validation-id, validator: tx-sender, score: score})
      (ok true)
    )
  )
)

(define-public (finalize-validation (validation-id uint))
  (let ((validation (unwrap! (map-get? module-validations validation-id) err-validation-not-found)))
    (asserts! (>= (len (get validators validation)) minimum-validators) (err u309))
    (asserts! (not (get consensus-reached validation)) err-consensus-reached)
    
    (try! (check-and-finalize-consensus validation-id))
    (ok true)
  )
)

(define-public (dispute-validation (validation-id uint) (reason (string-ascii 256)))
  (let ((validation (unwrap! (map-get? module-validations validation-id) err-validation-not-found)))
    ;; Check if dispute window is still open
    (match (get finalization-block validation)
      finalization-block (asserts! 
        (< (- block-height finalization-block) dispute-window) 
        err-dispute-window-closed)
      (err u310) ;; Not finalized yet
    )
    
    ;; Check if sender is a validator
    (asserts! (contract-call? .staking is-validator tx-sender) err-not-validator)
    
    ;; Create dispute record
    (map-set validation-disputes validation-id {
      disputer: tx-sender,
      reason: reason,
      dispute-block: block-height,
      resolved: false
    })
    
    ;; Update validation status
    (map-set module-validations validation-id (merge validation {
      status: "disputed"
    }))
    
    (print {action: "dispute-validation", validation-id: validation-id, disputer: tx-sender, reason: reason})
    (ok true)
  )
)

(define-public (resolve-dispute (validation-id uint) (resolution (string-ascii 32)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    (let ((dispute (unwrap! (map-get? validation-disputes validation-id) err-validation-not-found))
          (validation (unwrap! (map-get? module-validations validation-id) err-validation-not-found)))
      
      ;; Mark dispute as resolved
      (map-set validation-disputes validation-id (merge dispute {resolved: true}))
      
      ;; Update validation status
      (map-set module-validations validation-id (merge validation {
        status: resolution
      }))
      
      (print {action: "resolve-dispute", validation-id: validation-id, resolution: resolution})
      (ok true)
    )
  )
)

;; Private functions
(define-private (check-and-finalize-consensus (validation-id uint))
  (let ((validation (unwrap! (map-get? module-validations validation-id) err-validation-not-found))
        (scores (get scores validation)))
    
    (if (calculate-consensus scores)
      (let ((final-score (calculate-average-score scores))
            (status (if (>= final-score u60) "approved" "rejected")))
        
        ;; Update validation with consensus
        (map-set module-validations validation-id (merge validation {
          consensus-reached: true,
          final-score: final-score,
          finalization-block: (some block-height),
          status: status
        }))
        
        ;; If approved, trigger module NFT minting logic would go here
        ;; This would integrate with the existing module-nft contract
        
        (print {action: "consensus-reached", validation-id: validation-id, final-score: final-score, status: status})
        (ok true)
      )
      (ok false) ;; Consensus not yet reached
    )
  )
)

(define-private (is-passing-score (score uint))
  (>= score u60)
)

;; Admin functions
(define-public (set-staking-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set staking-contract new-contract)
    (ok true)
  )
)

(define-public (set-module-nft-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set module-nft-contract new-contract)
    (ok true)
  )
)
