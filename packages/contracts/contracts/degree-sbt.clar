;; Degree Soulbound Token (SBT) Contract
;; Non-transferable NFT representing degree completion

;; Define the SBT (non-transferable NFT)
(define-non-fungible-token degree-sbt uint)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u101))
(define-constant err-already-minted (err u102))
(define-constant err-insufficient-modules (err u103))
(define-constant err-transfer-not-allowed (err u104))

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var required-modules uint u3) ;; Minimum modules required for degree
(define-data-var module-nft-contract principal .module-nft)

;; Data maps
(define-map degree-metadata uint {
  recipient: principal,
  completion-date: uint,
  modules-completed: uint,
  degree-type: (string-ascii 64)
})

(define-map user-degree principal uint) ;; Track if user already has a degree

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

;; Public functions

;; Transfer function that always fails (SBT cannot be transferred)
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  err-transfer-not-allowed
)

;; Mint degree if user has completed required modules
(define-public (mint-degree (recipient principal))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
      (modules-count (get-user-module-count recipient))
    )
    (asserts! (>= modules-count (var-get required-modules)) err-insufficient-modules)
    (asserts! (not (has-degree recipient)) err-already-minted)
    
    (try! (nft-mint? degree-sbt token-id recipient))
    (map-set degree-metadata token-id {
      recipient: recipient,
      completion-date: block-height,
      modules-completed: modules-count,
      degree-type: "Blockchain Development Certificate"
    })
    (map-set user-degree recipient token-id)
    (var-set last-token-id token-id)
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

;; Private functions

;; Helper function to count user's module NFTs
;; Note: In a real implementation, this would query the module-nft contract
;; For now, this is a placeholder that returns a mock count
(define-private (get-user-module-count (user principal))
  u3 ;; Mock implementation - would need to query module-nft contract
)
