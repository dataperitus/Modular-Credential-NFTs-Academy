;; Module NFT Contract
;; SIP-009 compliant NFT for course modules in the Modular Credential Academy

;; Import the NFT trait
(use-trait nft-trait .nft-trait.nft-trait)

;; Define the NFT
(define-non-fungible-token module-nft uint)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-not-found (err u102))

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 256) "https://api.modular-nft-academy.com/metadata/")

;; Data maps
(define-map token-metadata uint {
  module-id: (string-ascii 64),
  module-name: (string-ascii 128),
  completion-date: uint
})

;; Read-only functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get base-uri)))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? module-nft token-id))
)

(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata token-id)
)

;; Public functions

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (nft-transfer? module-nft token-id sender recipient)
  )
)

(define-public (mint (recipient principal) (module-id (string-ascii 64)) (module-name (string-ascii 128)))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (nft-mint? module-nft token-id recipient))
    (map-set token-metadata token-id {
      module-id: module-id,
      module-name: module-name,
      completion-date: block-height
    })
    (var-set last-token-id token-id)
    (ok token-id)
  )
)


