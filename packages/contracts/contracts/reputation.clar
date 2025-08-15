;; Reputation Contract
;; Tracks validator performance and reputation scores

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u400))
(define-constant err-not-authorized (err u401))
(define-constant err-validator-not-found (err u402))
(define-constant err-invalid-score (err u403))

;; Reputation constants
(define-constant base-reputation u100)
(define-constant max-reputation u1000)
(define-constant min-reputation u0)
(define-constant reputation-decay-rate u5) ;; 5% per period
(define-constant reputation-boost-rate u10) ;; 10% for good performance
(define-constant decay-period u1008) ;; ~1 week in blocks

;; Data variables
(define-data-var validation-contract principal .validation)
(define-data-var staking-contract principal .staking)

;; Data maps
(define-map validator-reputation principal {
  score: uint,
  validations-count: uint,
  successful-validations: uint,
  accuracy-rate: uint,
  last-update: uint,
  last-decay: uint
})

(define-map reputation-history principal (list 50 {
  score: uint,
  block-height: uint,
  reason: (string-ascii 64)
}))

(define-map validation-accuracy uint {
  validation-id: uint,
  validator: principal,
  correct-assessment: bool,
  impact-score: uint
})

;; Read-only functions
(define-read-only (get-reputation (validator principal))
  (match (map-get? validator-reputation validator)
    reputation (some (apply-time-decay validator reputation))
    none
  )
)

(define-read-only (get-reputation-raw (validator principal))
  (map-get? validator-reputation validator)
)

(define-read-only (get-reputation-history (validator principal))
  (default-to (list) (map-get? reputation-history validator))
)

(define-read-only (get-voting-multiplier (validator principal))
  (match (get-reputation validator)
    reputation (let ((score (get score reputation)))
                 (cond
                   ((>= score u800) u150) ;; 1.5x multiplier for excellent reputation
                   ((>= score u600) u125) ;; 1.25x multiplier for good reputation
                   ((>= score u400) u100) ;; 1x multiplier for average reputation
                   ((>= score u200) u75)  ;; 0.75x multiplier for poor reputation
                   (u50) ;; 0.5x multiplier for very poor reputation
                 ))
    u100 ;; Default 1x multiplier for new validators
  )
)

(define-read-only (get-accuracy-rate (validator principal))
  (match (map-get? validator-reputation validator)
    reputation (get accuracy-rate reputation)
    u0
  )
)

(define-read-only (calculate-reputation-rank (validator principal))
  (match (get-reputation validator)
    reputation (let ((score (get score reputation)))
                 (cond
                   ((>= score u900) "Legendary")
                   ((>= score u800) "Expert")
                   ((>= score u700) "Advanced")
                   ((>= score u600) "Proficient")
                   ((>= score u500) "Competent")
                   ((>= score u400) "Developing")
                   ((>= score u300) "Novice")
                   ("Unranked")
                 ))
    "Unranked"
  )
)

;; Public functions
(define-public (initialize-validator-reputation (validator principal))
  (begin
    ;; Check if validator is registered in staking contract
    (asserts! (contract-call? .staking is-validator validator) err-not-authorized)
    
    ;; Initialize reputation if not exists
    (if (is-none (map-get? validator-reputation validator))
      (begin
        (map-set validator-reputation validator {
          score: base-reputation,
          validations-count: u0,
          successful-validations: u0,
          accuracy-rate: u100,
          last-update: block-height,
          last-decay: block-height
        })
        (add-reputation-history validator base-reputation "initialized")
        (print {action: "initialize-reputation", validator: validator, score: base-reputation})
        (ok true)
      )
      (ok true) ;; Already initialized
    )
  )
)

(define-public (update-reputation-for-validation (validator principal) (validation-id uint) (score-delta int) (was-accurate bool))
  (begin
    ;; Only validation contract can call this
    (asserts! (is-eq tx-sender (var-get validation-contract)) err-not-authorized)
    
    (let ((current-reputation (unwrap! (get-reputation validator) err-validator-not-found))
          (validation-count (+ (get validations-count current-reputation) u1))
          (successful-count (if was-accurate 
                              (+ (get successful-validations current-reputation) u1)
                              (get successful-validations current-reputation)))
          (new-accuracy (if (> validation-count u0) 
                          (/ (* successful-count u100) validation-count) 
                          u100)))
      
      ;; Calculate new reputation score
      (let ((current-score (get score current-reputation))
            (new-score (if (> score-delta 0)
                         (min max-reputation (+ current-score (to-uint score-delta)))
                         (max min-reputation (- current-score (to-uint (* score-delta -1)))))))
        
        ;; Update reputation
        (map-set validator-reputation validator {
          score: new-score,
          validations-count: validation-count,
          successful-validations: successful-count,
          accuracy-rate: new-accuracy,
          last-update: block-height,
          last-decay: (get last-decay current-reputation)
        })
        
        ;; Record accuracy for this validation
        (map-set validation-accuracy validation-id {
          validation-id: validation-id,
          validator: validator,
          correct-assessment: was-accurate,
          impact-score: (to-uint (if (> score-delta 0) score-delta (* score-delta -1)))
        })
        
        ;; Add to history
        (add-reputation-history validator new-score 
          (if was-accurate "accurate-validation" "inaccurate-validation"))
        
        (print {action: "update-reputation", validator: validator, validation-id: validation-id, 
                new-score: new-score, was-accurate: was-accurate, accuracy-rate: new-accuracy})
        (ok new-score)
      )
    )
  )
)

(define-public (apply-reputation-decay (validator principal))
  (match (map-get? validator-reputation validator)
    reputation (let ((blocks-since-decay (- block-height (get last-decay reputation)))
                     (decay-periods (/ blocks-since-decay decay-period)))
                 (if (> decay-periods u0)
                   (let ((decay-amount (* decay-periods reputation-decay-rate))
                         (current-score (get score reputation))
                         (new-score (max min-reputation (- current-score decay-amount))))
                     
                     ;; Update reputation with decay
                     (map-set validator-reputation validator (merge reputation {
                       score: new-score,
                       last-decay: block-height
                     }))
                     
                     ;; Add to history
                     (add-reputation-history validator new-score "time-decay")
                     
                     (print {action: "reputation-decay", validator: validator, 
                             decay-amount: decay-amount, new-score: new-score})
                     (ok new-score)
                   )
                   (ok (get score reputation)) ;; No decay needed
                 ))
    (err err-validator-not-found)
  )
)

(define-public (boost-reputation-for-excellence (validator principal) (boost-amount uint) (reason (string-ascii 64)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    (match (map-get? validator-reputation validator)
      reputation (let ((current-score (get score reputation))
                       (new-score (min max-reputation (+ current-score boost-amount))))
                   
                   ;; Update reputation
                   (map-set validator-reputation validator (merge reputation {
                     score: new-score,
                     last-update: block-height
                   }))
                   
                   ;; Add to history
                   (add-reputation-history validator new-score reason)
                   
                   (print {action: "reputation-boost", validator: validator, 
                           boost-amount: boost-amount, new-score: new-score, reason: reason})
                   (ok new-score)
                 )
      (err err-validator-not-found)
    )
  )
)

(define-public (penalize-validator (validator principal) (penalty-amount uint) (reason (string-ascii 64)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    
    (match (map-get? validator-reputation validator)
      reputation (let ((current-score (get score reputation))
                       (new-score (max min-reputation (- current-score penalty-amount))))
                   
                   ;; Update reputation
                   (map-set validator-reputation validator (merge reputation {
                     score: new-score,
                     last-update: block-height
                   }))
                   
                   ;; Add to history
                   (add-reputation-history validator new-score reason)
                   
                   (print {action: "reputation-penalty", validator: validator, 
                           penalty-amount: penalty-amount, new-score: new-score, reason: reason})
                   (ok new-score)
                 )
      (err err-validator-not-found)
    )
  )
)

;; Private functions
(define-private (apply-time-decay (validator principal) (reputation {score: uint, validations-count: uint, successful-validations: uint, accuracy-rate: uint, last-update: uint, last-decay: uint}))
  (let ((blocks-since-decay (- block-height (get last-decay reputation)))
        (decay-periods (/ blocks-since-decay decay-period)))
    (if (> decay-periods u0)
      (let ((decay-amount (* decay-periods reputation-decay-rate))
            (current-score (get score reputation))
            (new-score (max min-reputation (- current-score decay-amount))))
        (merge reputation {score: new-score})
      )
      reputation
    )
  )
)

(define-private (add-reputation-history (validator principal) (score uint) (reason (string-ascii 64)))
  (let ((current-history (default-to (list) (map-get? reputation-history validator)))
        (new-entry {score: score, block-height: block-height, reason: reason}))
    ;; Add new entry and keep only last 50 entries
    (map-set reputation-history validator 
      (unwrap! (as-max-len? (append current-history new-entry) u50) false))
    true
  )
)

;; Admin functions
(define-public (set-validation-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set validation-contract new-contract)
    (ok true)
  )
)

(define-public (set-staking-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set staking-contract new-contract)
    (ok true)
  )
)
