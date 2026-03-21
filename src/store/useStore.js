import { create } from "zustand";

const useStore = create((set) => ({
    walletAddress: null,
    jwtToken: null,
    setWalletAddress: (address) => set({ walletAddress: address }),
    setJwtToken: (token) => set({ jwtToken: token }),
    logout: () => set({ walletAddress: null, jwtToken: null }),
}));

export default useStore;
