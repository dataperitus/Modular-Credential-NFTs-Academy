;; Governance Contract
;; Handles proposal creation, voting, and execution

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u500))
(define-constant err-not-authorized (err u501))
(define-constant err-proposal-not-found (err u502))
(define-constant err-voting-closed (err u503))
(define-constant err-voting-not-ended (err u504))
(define-constant err-already-voted (err u505))
(define-constant err-insufficient-tokens (err u506))
(define-constant err-proposal-already-executed (err u507))
(define-constant err-quorum-not-met (err u508))

;; Governance constants
(define-constant minimum-proposal-tokens u100000000) ;; 100 tokens to create proposal
(define-constant voting-period u1008) ;; ~1 week in blocks
(define-constant execution-delay u144) ;; ~24 hours delay before execution
(define-constant quorum-threshold u20) ;; 20% of total supply needed for quorum

;; Data variables
(define-data-var next-proposal-id uint u1)
(define-data-var governance-token-contract principal .governance-token)
(define-data-var reputation-contract principal .reputation)

;; Data maps
(define-map proposals uint {
  proposer: principal,
  title: (string-ascii 128),
  description: (string-ascii 512),
  proposal-type: (string-ascii 32), ;; "parameter", "upgrade", "funding", "general"
  voting-start: uint,
  voting-end: uint,
  execution-delay-end: uint,
  votes-for: uint,
  votes-against: uint,
  quorum: uint,
  executed: bool,
  cancelled: bool,
  metadata-uri: (optional (string-ascii 256))
})

(define-map proposal-votes {proposal-id: uint, voter: principal} {
  support: bool,
  voting-power: uint,
  timestamp: uint
})

(define-map user-voting-history principal (list 50 uint))

;; Read-only functions
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-proposal-vote (proposal-id uint) (voter principal))
  (map-get? proposal-votes {proposal-id: proposal-id, voter: voter})
)

(define-read-only (get-user-voting-history (user principal))
  (default-to (list) (map-get? user-voting-history user))
)

(define-read-only (calculate-voting-power (voter principal))
  (let ((token-balance (unwrap-panic (contract-call? .governance-token get-balance voter)))
        (delegated-power (unwrap-panic (contract-call? .governance-token get-voting-power voter)))
        (reputation-multiplier (contract-call? .reputation get-voting-multiplier voter)))
    (/ (* (+ token-balance delegated-power) reputation-multiplier) u100)
  )
)

(define-read-only (get-proposal-status (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (cond
               ((get cancelled proposal) "cancelled")
               ((get executed proposal) "executed")
               ((< block-height (get voting-start proposal)) "pending")
               ((<= (get voting-start proposal) block-height (get voting-end proposal)) "active")
               ((< block-height (get execution-delay-end proposal)) "succeeded")
               ((>= (+ (get votes-for proposal) (get votes-against proposal)) 
                   (/ (* (unwrap-panic (contract-call? .governance-token get-total-supply)) quorum-threshold) u100))
                (if (> (get votes-for proposal) (get votes-against proposal)) 
                  "executable" 
                  "defeated"))
               ("defeated"))
    "not-found"
  )
)

(define-read-only (check-quorum-met (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (let ((total-votes (+ (get votes-for proposal) (get votes-against proposal)))
                   (total-supply (unwrap-panic (contract-call? .governance-token get-total-supply)))
                   (required-quorum (/ (* total-supply quorum-threshold) u100)))
               (>= total-votes required-quorum))
    false
  )
)

;; Public functions
(define-public (create-proposal (title (string-ascii 128)) 
                               (description (string-ascii 512))
                               (proposal-type (string-ascii 32))
                               (metadata-uri (optional (string-ascii 256))))
  (let ((proposal-id (var-get next-proposal-id))
        (proposer-balance (unwrap-panic (contract-call? .governance-token get-balance tx-sender))))
    
    ;; Check minimum token requirement
    (asserts! (>= proposer-balance minimum-proposal-tokens) err-insufficient-tokens)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      proposer: tx-sender,
      title: title,
      description: description,
      proposal-type: proposal-type,
      voting-start: (+ block-height u144), ;; Start voting in ~24 hours
      voting-end: (+ block-height (+ u144 voting-period)),
      execution-delay-end: (+ block-height (+ u144 voting-period execution-delay)),
      votes-for: u0,
      votes-against: u0,
      quorum: u0,
      executed: false,
      cancelled: false,
      metadata-uri: metadata-uri
    })
    
    ;; Increment proposal ID
    (var-set next-proposal-id (+ proposal-id u1))
    
    (print {action: "create-proposal", proposal-id: proposal-id, proposer: tx-sender, title: title})
    (ok proposal-id)
  )
)

(define-public (vote (proposal-id uint) (support bool))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found))
        (voter-power (calculate-voting-power tx-sender)))
    
    ;; Check voting period
    (asserts! (<= (get voting-start proposal) block-height (get voting-end proposal)) err-voting-closed)
    
    ;; Check if already voted
    (asserts! (is-none (map-get? proposal-votes {proposal-id: proposal-id, voter: tx-sender})) err-already-voted)
    
    ;; Check if voter has tokens
    (asserts! (> voter-power u0) err-insufficient-tokens)
    
    ;; Record vote
    (map-set proposal-votes {proposal-id: proposal-id, voter: tx-sender} {
      support: support,
      voting-power: voter-power,
      timestamp: block-height
    })
    
    ;; Update proposal vote counts
    (let ((new-votes-for (if support (+ (get votes-for proposal) voter-power) (get votes-for proposal)))
          (new-votes-against (if support (get votes-against proposal) (+ (get votes-against proposal) voter-power))))
      
      (map-set proposals proposal-id (merge proposal {
        votes-for: new-votes-for,
        votes-against: new-votes-against,
        quorum: (+ new-votes-for new-votes-against)
      }))
    )
    
    ;; Add to user voting history
    (let ((user-history (default-to (list) (map-get? user-voting-history tx-sender))))
      (map-set user-voting-history tx-sender 
        (unwrap! (as-max-len? (append user-history proposal-id) u50) (err u999)))
    )
    
    (print {action: "vote", proposal-id: proposal-id, voter: tx-sender, support: support, voting-power: voter-power})
    (ok true)
  )
)

(define-public (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found)))
    
    ;; Check if voting has ended
    (asserts! (> block-height (get voting-end proposal)) err-voting-not-ended)
    
    ;; Check if execution delay has passed
    (asserts! (>= block-height (get execution-delay-end proposal)) err-voting-not-ended)
    
    ;; Check if not already executed
    (asserts! (not (get executed proposal)) err-proposal-already-executed)
    
    ;; Check if not cancelled
    (asserts! (not (get cancelled proposal)) err-proposal-not-found)
    
    ;; Check quorum
    (asserts! (check-quorum-met proposal-id) err-quorum-not-met)
    
    ;; Check if proposal passed
    (asserts! (> (get votes-for proposal) (get votes-against proposal)) (err u509))
    
    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal {executed: true}))
    
    ;; Execute proposal logic based on type
    (try! (execute-proposal-action proposal-id (get proposal-type proposal)))
    
    (print {action: "execute-proposal", proposal-id: proposal-id, executor: tx-sender})
    (ok true)
  )
)

(define-public (cancel-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found)))
    
    ;; Only proposer or contract owner can cancel
    (asserts! (or (is-eq tx-sender (get proposer proposal)) 
                  (is-eq tx-sender contract-owner)) err-not-authorized)
    
    ;; Can only cancel before execution
    (asserts! (not (get executed proposal)) err-proposal-already-executed)
    
    ;; Mark as cancelled
    (map-set proposals proposal-id (merge proposal {cancelled: true}))
    
    (print {action: "cancel-proposal", proposal-id: proposal-id, canceller: tx-sender})
    (ok true)
  )
)

(define-public (delegate-vote (proposal-id uint) (delegate principal) (support bool))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-proposal-not-found))
        (delegator-balance (unwrap-panic (contract-call? .governance-token get-balance tx-sender))))
    
    ;; Check voting period
    (asserts! (<= (get voting-start proposal) block-height (get voting-end proposal)) err-voting-closed)
    
    ;; Check if delegator hasn't already voted
    (asserts! (is-none (map-get? proposal-votes {proposal-id: proposal-id, voter: tx-sender})) err-already-voted)
    
    ;; Check if delegate hasn't already voted for this delegator
    (asserts! (is-none (map-get? proposal-votes {proposal-id: proposal-id, voter: delegate})) err-already-voted)
    
    ;; Record delegated vote
    (map-set proposal-votes {proposal-id: proposal-id, voter: delegate} {
      support: support,
      voting-power: delegator-balance,
      timestamp: block-height
    })
    
    ;; Update proposal vote counts
    (let ((new-votes-for (if support (+ (get votes-for proposal) delegator-balance) (get votes-for proposal)))
          (new-votes-against (if support (get votes-against proposal) (+ (get votes-against proposal) delegator-balance))))
      
      (map-set proposals proposal-id (merge proposal {
        votes-for: new-votes-for,
        votes-against: new-votes-against,
        quorum: (+ new-votes-for new-votes-against)
      }))
    )
    
    (print {action: "delegate-vote", proposal-id: proposal-id, delegator: tx-sender, 
            delegate: delegate, support: support, voting-power: delegator-balance})
    (ok true)
  )
)

;; Private functions
(define-private (execute-proposal-action (proposal-id uint) (proposal-type (string-ascii 32)))
  (cond
    ((is-eq proposal-type "parameter") (execute-parameter-change proposal-id))
    ((is-eq proposal-type "upgrade") (execute-contract-upgrade proposal-id))
    ((is-eq proposal-type "funding") (execute-funding-proposal proposal-id))
    ((is-eq proposal-type "general") (ok true)) ;; General proposals just need to pass
    (err u510) ;; Unknown proposal type
  )
)

(define-private (execute-parameter-change (proposal-id uint))
  ;; Implementation would depend on specific parameter changes
  ;; For now, just return success
  (ok true)
)

(define-private (execute-contract-upgrade (proposal-id uint))
  ;; Implementation would depend on upgrade mechanism
  ;; For now, just return success
  (ok true)
)

(define-private (execute-funding-proposal (proposal-id uint))
  ;; Implementation would involve treasury management
  ;; For now, just return success
  (ok true)
)

;; Admin functions
(define-public (set-governance-token-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set governance-token-contract new-contract)
    (ok true)
  )
)

(define-public (set-reputation-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set reputation-contract new-contract)
    (ok true)
  )
)
