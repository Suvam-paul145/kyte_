/**
 * wallet.js — Pera Wallet connection helpers.
 *
 * Exports:
 *   getPeraWallet()    - returns the singleton PeraWalletConnect instance
 *   connectWallet()    - open Pera Wallet modal and return first address
 *   reconnectWallet()  - silently reconnect an existing session
 *   disconnectWallet() - disconnect and clear session
 *   signAuthNonce()    - sign a nonce string for backend authentication
 */

import { PeraWalletConnect } from "@perawallet/connect";

// Singleton Pera Wallet instance — shared across the app (including algorandDeploy.js)
let _peraWallet = null;

function _getInstance() {
  if (!_peraWallet) {
    _peraWallet = new PeraWalletConnect({
      // Force TestNet mode
      chainId: 416002, // Algorand TestNet chain ID
    });
  }
  return _peraWallet;
}

/**
 * Get the PeraWalletConnect singleton.
 * Used by algorandDeploy.js to sign ApplicationCreateTxn.
 */
export function getPeraWallet() {
  return _getInstance();
}

/**
 * Open Pera Wallet connection modal and return the first connected address.
 * @returns {Promise<string|null>} Algorand address or null if user cancelled
 */
export async function connectWallet() {
  const peraWallet = _getInstance();
  try {
    const accounts = await peraWallet.connect();

    // Listen to disconnect events
    peraWallet.connector?.on("disconnect", () => {
      console.log("[Pera] Disconnected");
    });

    return accounts[0]; // Return first address
  } catch (e) {
    if (e?.data?.type !== "CONNECT_MODAL_CLOSED") {
      console.error("[Pera] Error connecting wallet:", e);
    }
    return null;
  }
}

/**
 * Silently reconnect an existing Pera Wallet session (on page load).
 * @returns {Promise<string|null>} Algorand address or null if no session
 */
export async function reconnectWallet() {
  const peraWallet = _getInstance();
  try {
    const accounts = await peraWallet.reconnectSession();
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (e) {
    // Session expired or no previous session — not an error
    return null;
  }
}

/**
 * Disconnect Pera Wallet and clear the session.
 */
export async function disconnectWallet() {
  const peraWallet = _getInstance();
  try {
    await peraWallet.disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
  return null;
}

/**
 * Sign an authentication nonce with Pera Wallet.
 * The backend verifies this signature to authenticate the wallet owner.
 *
 * @param {string} address - Algorand wallet address
 * @param {string} nonce   - Random nonce from backend /auth/nonce
 * @returns {Promise<Uint8Array|null>} Signature bytes or null on failure
 */
export async function signAuthNonce(address, nonce) {
  const peraWallet = _getInstance();
  const encoder = new TextEncoder();
  const data = encoder.encode(nonce);

  try {
    const result = await peraWallet.signData(
      [{ data, message: "Sign this nonce to authenticate with KYTE" }],
      address
    );
    return result[0]; // Uint8Array signature
  } catch (e) {
    console.error("[Pera] Signing error:", e);
    return null;
  }
}
