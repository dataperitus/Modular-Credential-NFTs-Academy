;; Governance Token Contract
;; SIP-010 compliant fungible token for governance participation

;; Define the fungible token
(define-fungible-token governance-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))
(define-constant err-unauthorized (err u104))

;; Token constants
(define-constant token-name "Academy Governance Token")
(define-constant token-symbol "AGT")
(define-constant token-decimals u6)
(define-constant total-supply u100000000000000) ;; 100M tokens with 6 decimals

;; Data variables
(define-data-var token-initialized bool false)

;; Data maps
(define-map token-balances principal uint)
(define-map token-allowances {spender: principal, owner: principal} uint)
(define-map token-delegations principal principal)
(define-map voting-power principal uint)

;; Initialize the token (can only be called once)
(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (not (var-get token-initialized)) (err u105))
    (try! (ft-mint? governance-token total-supply contract-owner))
    (map-set token-balances contract-owner total-supply)
    (var-set token-initialized true)
    (ok true)
  )
)

;; SIP-010 Read-only functions
(define-read-only (get-name)
  (ok token-name)
)

(define-read-only (get-symbol)
  (ok token-symbol)
)

(define-read-only (get-decimals)
  (ok token-decimals)
)

(define-read-only (get-balance (who principal))
  (ok (default-to u0 (map-get? token-balances who)))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply governance-token))
)

(define-read-only (get-token-uri)
  (ok (some "https://api.modular-nft-academy.com/governance-token-metadata"))
)

;; Governance-specific read-only functions
(define-read-only (get-delegation (delegator principal))
  (map-get? token-delegations delegator)
)

(define-read-only (get-voting-power (user principal))
  (let ((balance (unwrap-panic (get-balance user)))
        (delegated-power (default-to u0 (map-get? voting-power user))))
    (ok (+ balance delegated-power))
  )
)

;; SIP-010 Public functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (or (is-eq tx-sender sender) (is-eq contract-owner tx-sender)) err-not-token-owner)
    (asserts! (> amount u0) err-invalid-amount)
    (let ((sender-balance (unwrap-panic (get-balance sender))))
      (asserts! (>= sender-balance amount) err-insufficient-balance)
      (try! (ft-transfer? governance-token amount sender recipient))
      (map-set token-balances sender (- sender-balance amount))
      (map-set token-balances recipient (+ (unwrap-panic (get-balance recipient)) amount))
      ;; Update voting power if delegation exists
      (update-voting-power-on-transfer sender recipient amount)
      (print {action: "transfer", sender: sender, recipient: recipient, amount: amount, memo: memo})
      (ok true)
    )
  )
)

;; Governance functions
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (> amount u0) err-invalid-amount)
    (try! (ft-mint? governance-token amount recipient))
    (map-set token-balances recipient (+ (unwrap-panic (get-balance recipient)) amount))
    (print {action: "mint", recipient: recipient, amount: amount})
    (ok true)
  )
)

(define-public (delegate (to principal))
  (let ((delegator-balance (unwrap-panic (get-balance tx-sender)))
        (current-delegate (map-get? token-delegations tx-sender)))
    ;; Remove previous delegation if exists
    (match current-delegate
      prev-delegate (map-set voting-power prev-delegate 
                      (- (default-to u0 (map-get? voting-power prev-delegate)) delegator-balance))
      true)
    ;; Add new delegation
    (map-set token-delegations tx-sender to)
    (map-set voting-power to (+ (default-to u0 (map-get? voting-power to)) delegator-balance))
    (print {action: "delegate", delegator: tx-sender, delegate: to, amount: delegator-balance})
    (ok true)
  )
)

(define-public (undelegate)
  (let ((delegator-balance (unwrap-panic (get-balance tx-sender)))
        (current-delegate (map-get? token-delegations tx-sender)))
    (match current-delegate
      delegate (begin
        (map-delete token-delegations tx-sender)
        (map-set voting-power delegate 
          (- (default-to u0 (map-get? voting-power delegate)) delegator-balance))
        (print {action: "undelegate", delegator: tx-sender, delegate: delegate, amount: delegator-balance})
        (ok true)
      )
      (err u106) ;; No delegation found
    )
  )
)

;; Private functions
(define-private (update-voting-power-on-transfer (sender principal) (recipient principal) (amount uint))
  (let ((sender-delegate (map-get? token-delegations sender))
        (recipient-delegate (map-get? token-delegations recipient)))
    ;; Update sender's delegate voting power
    (match sender-delegate
      delegate (map-set voting-power delegate 
                (- (default-to u0 (map-get? voting-power delegate)) amount))
      true)
    ;; Update recipient's delegate voting power
    (match recipient-delegate
      delegate (map-set voting-power delegate 
                (+ (default-to u0 (map-get? voting-power delegate)) amount))
      true)
    true
  )
)
