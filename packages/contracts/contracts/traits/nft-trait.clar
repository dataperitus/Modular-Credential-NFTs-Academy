;; NFT Trait for SIP-009 compliance
;; This trait defines the standard interface for NFTs in the Modular Credential Academy

(define-trait nft-trait
  (
    ;; Last token ID, limited to uint range
    (get-last-token-id () (response uint uint))
    
    ;; URI for token metadata
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))
    
    ;; Owner of a given token ID
    (get-owner (uint) (response (optional principal) uint))
    
    ;; Transfer function
    (transfer (uint principal principal) (response bool uint))
  )
)
