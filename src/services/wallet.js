import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";

const peraWallet = new PeraWalletConnect();

export const connectWallet = async () => {
    try {
        const newAccounts = await peraWallet.connect();
        
        // Listen to disconnect
        peraWallet.connector?.on("disconnect", () => {
            console.log("Disconnected");
        });
        
        return newAccounts[0]; // Return first address
    } catch (e) {
        if (e?.data?.type !== "CONNECT_MODAL_CLOSED") {
            console.log("Error connecting wallet", e);
        }
        return null;
    }
};

export const reconnectWallet = async () => {
    try {
        const accounts = await peraWallet.reconnectSession();
        return accounts ? accounts[0] : null;
    } catch (e) {
        console.log("Reconnect error", e);
        return null;
    }
};

export const disconnectWallet = async () => {
    await peraWallet.disconnect();
    return null;
};

export const signAuthNonce = async (address, nonce) => {
    // In Algorand, we sign a message/data
    const encoder = new TextEncoder();
    const data = encoder.encode(nonce);
    
    try {
        // Sign with Pera Wallet
        // signData uses a specific format for signing
        const result = await peraWallet.signData([{ data, message: "Sign this nonce to authenticate with Kyte" }], address);
        return result[0]; // This is the signature
    } catch (e) {
        console.log("Signing error", e);
        return null;
    }
};
