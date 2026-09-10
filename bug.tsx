*/tsx{path=src/components/SecretsDialog.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { AlertTriangle, X, Eye, EyeOff } from "lucide-react";

interface SecretsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SecretsDialog({ open, onClose }: SecretsDialogProps) {
  const { wallets, currentWalletId } = useWalletStore();
  const [showKeys, setShowKeys] = useState(false);

  if (!open) return null;

  const wallet = wallets.find((w) => w.address === currentWalletId);
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">Sensitive key material</p>
            <h3 className="text-lg font-bold text-slate-100">Wallet secrets</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Never share these values. Anyone with the private key or mnemonic controls the wallet and its funds.</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Private key</Label>
            <div className="relative">
              <Input
                type={showKeys ? "text" : "password"}
                readOnly
                value={wallet.rawPrivateKey}
                className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
              />
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {wallet.mnemonic && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Mnemonic phrase</Label>
              <div className="relative">
                <Input
                  type={showKeys ? "text" : "password"}
                  readOnly
                  value={wallet.mnemonic}
                  className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
                />
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
```

```tsx{path=src/components/Toaster.tsx}
import { useToast } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-xs font-medium shadow-lg backdrop-blur-sm ${
            toast.type === "ok"
              ? "border-emerald-500/30 bg-slate-900/95 text-emerald-400"
              : toast.type === "bad"
                ? "border-red-500/30 bg-slate-900/95 text-red-400"
                : "border-slate-700 bg-slate-900/95 text-slate-300"
          }`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : toast.type === "bad" ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
```

Now let me also fix the store to remove the dead code and ensure it works properly:

```tsx{path=src/lib/store.ts}
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Network, Token, Wallet, BalanceResult, Transaction, LogEntry } from "@/lib/types";
import { NETWORK_PRESETS, TOKEN_PRESETS } from "@/lib/presets";
import { ethers } from "ethers";
import { evmToTronAddress, formatUnits } from "@/lib/utils";

interface WalletState {
  wallets: Wallet[];
  currentWalletId: string | null;
  networks: Network[];
  tokens: Token[];
  history: Record<string, Transaction[]>;
  allHistory: Record<string, Transaction[]>;
  logs: LogEntry[];
  allBalanceResults: Record<string, BalanceResult[]>;
  balanceUpdated: number | null;
  balanceLoading: boolean;
  activityGate: boolean;
  nextWalletNum: number;
  alchemyKey: string;
  tronGridKey: string;
  setCurrentWallet: (address: string) => void;
  addWallets: (wallets: Wallet[]) => void;
  removeWallet: (address: string) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (id: string) => void;
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  refreshBalances: () => Promise<void>;
  addTransaction: (address: string, tx: Transaction) => void;
  updateTransactionStatus: (address: string, hash: string, status: string) => void;
  clearHistory: () => void;
  clearLog: () => void;
  log: (message: string) => void;
  setActivityGate: (value: boolean) => void;
  setAlchemyKey: (key: string) => void;
  setTronGridKey: (key: string) => void;
  resetNetworks: () => void;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      currentWalletId: null,
      networks: NETWORK_PRESETS,
      tokens: TOKEN_PRESETS,
      history: {},
      allHistory: {},
      logs: [],
      allBalanceResults: {},
      balanceUpdated: null,
      balanceLoading: false,
      activityGate: true,
      nextWalletNum: 1,
      alchemyKey: "",
      tronGridKey: "",

      setCurrentWallet: (address) => set({ currentWalletId: address }),

      addWallets: (newWallets) => {
        const { wallets, nextWalletNum } = get();
        const existing = new Set(wallets.map((w) => w.address));
        const unique = newWallets.filter((w) => !existing.has(w.address));
        if (unique.length === 0) return;
        set({
          wallets: [...wallets, ...unique],
          nextWalletNum: nextWalletNum + unique.length,
          currentWalletId: get().currentWalletId || unique[0].address,
        });
        get().log(`Imported ${unique.length} wallet(s)`);
      },

      removeWallet: (address) => {
        const { wallets, currentWalletId } = get();
        const filtered = wallets.filter((w) => w.address !== address);
        set({
          wallets: filtered,
          currentWalletId: currentWalletId === address ? (filtered[0]?.address || null) : currentWalletId,
        });
        get().log(`Removed wallet ${address.slice(0, 6)}…`);
      },

      addNetwork: (network) => {
        const { networks } = get();
        if (networks.some((n) => n.id === network.id)) return;
        set({ networks: [...networks, network] });
        get().log(`Added network ${network.name}`);
      },

      removeNetwork: (id) => {
        set({ networks: get().networks.filter((n) => n.id !== id) });
        get().log(`Removed network ${id}`);
      },

      addToken: (token) => {
        const { tokens } = get();
        if (tokens.some((t) => t.id === token.id)) return;
        set({ tokens: [...tokens, token] });
        get().log(`Added token ${token.name}`);
      },

      removeToken: (id) => {
        set({ tokens: get().tokens.filter((t) => t.id !== id) });
        get().log(`Removed token ${id}`);
      },

      refreshBalances: async () => {
        const { wallets, networks, tokens, activityGate, alchemyKey, tronGridKey } = get();
        if (wallets.length === 0) return;
        set({ balanceLoading: true });

        const results: Record<string, BalanceResult[]> = {};
        await Promise.all(
          wallets.map(async (wallet) => {
            const walletResults = await Promise.all(
              networks.map(async (network) => {
                try {
                  if (network.chainType === "tron") {
                    return await queryTronNetwork(network, wallet, tronGridKey, tokens);
                  }
                  return await queryEvmNetwork(network, wallet, tokens, activityGate, alchemyKey);
                } catch (error: any) {
                  return {
                    network,
                    nativeRaw: "0",
                    nativeBalance: "0",
                    tokens: [],
                    error: error?.message || "Endpoint unavailable",
                  };
                }
              })
            );
            results[wallet.address] = walletResults;
          })
        );

        set({
          allBalanceResults: results,
          balanceUpdated: Date.now(),
          balanceLoading: false,
        });
      },

      addTransaction: (address, tx) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: [tx, ...(history[address] || [])].slice(0, 200),
          },
        });
        get().log(`Tx Pending · ${tx.type} → ${tx.to} · ${tx.hash}`);
      },

      updateTransactionStatus: (address, hash, status) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: (history[address] || []).map((t) =>
              t.hash === hash ? { ...t, status } : t
            ),
          },
        });
        get().log(`Tx ${status} · ${hash}`);
      },

      clearHistory: () => {
        set({ history: {}, allHistory: {} });
        get().log("Cleared transaction history");
      },

      clearLog: () => set({ logs: [] }),

      log: (message) => {
        const { logs } = get();
        set({
          logs: [...logs, { at: new Date().toISOString(), message }].slice(-500),
        });
      },

      setActivityGate: (value) => set({ activityGate: value }),
      setAlchemyKey: (key) => set({ alchemyKey: key }),
      setTronGridKey: (key) => set({ tronGridKey: key }),
      resetNetworks: () => set({ networks: NETWORK_PRESETS }),
    }),
    {
      name: "evm-cockpit-v3",
      partialize: (state) => ({
        wallets: state.wallets,
        currentWalletId: state.currentWalletId,
        networks: state.networks,
        tokens: state.tokens,
        history: state.history,
        allHistory: state.allHistory,
        logs: state.logs,
        allBalanceResults: state.allBalanceResults,
        balanceUpdated: state.balanceUpdated,
        activityGate: state.activityGate,
        nextWalletNum: state.nextWalletNum,
        alchemyKey: state.alchemyKey,
        tronGridKey: state.tronGridKey,
      }),
    }
  )
);

async function queryEvmNetwork(
  network: Network,
  wallet: Wallet,
  tokens: Token[],
  activityGate: boolean,
  alchemyKey: string
): Promise<BalanceResult> {
  const url = network.alchemySlug && alchemyKey
    ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
    : network.rpc;

  const provider = new ethers.JsonRpcProvider(url, network.chainId ? { chainId: network.chainId, name: network.id } : undefined);

  const [native, txCount] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getTransactionCount(wallet.address),
  ]);

  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 18),
  };

  const hasActivity = !activityGate || Number(txCount) > 0 || native > 0n;
  if (!hasActivity) {
    return { ...base, inactive: true, tokens: [] };
  }

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "evm");
  const tokenBalances = await Promise.all(
    networkTokens.map(async (token) => {
      try {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const raw = await contract.balanceOf(wallet.address);
        return {
          name: token.name,
          raw: raw.toString(),
          balance: formatUnits(raw, token.decimals),
        };
      } catch (error: any) {
        return {
          name: token.name,
          raw: "0",
          balance: "—",
          error: error?.message || "Read failed",
        };
      }
    })
  );

  return { ...base, tokens: tokenBalances };
}

async function queryTronNetwork(
  network: Network,
  wallet: Wallet,
  tronGridKey: string,
  tokens: Token[]
): Promise<BalanceResult> {
  const address = wallet.tronAddress || evmToTronAddress(wallet.address);
  const headers: Record<string, string> = {};
  if (tronGridKey) headers["TRON-PRO-API-KEY"] = tronGridKey;

  const res = await fetch(`${network.rpc.replace(/\/$/, "")}/v1/accounts/${address}`, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  const account = (data.data || [])[0] || null;

  const native = BigInt(account?.balance ?? 0);
  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 6),
  };

  if (!account) return { ...base, inactive: true, tokens: [] };

  const held = new Map<string, string>();
  (account.trc20 || []).forEach((entry: Record<string, string>) => {
    Object.entries(entry).forEach(([addr, amt]) => held.set(addr, amt));
  });

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "tron");
  const tokenBalances = networkTokens.map((token) => {
    const raw = BigInt(held.get(token.address) || 0);
    return {
      name: token.name,
      raw: raw.toString(),
      balance: formatUnits(raw, token.decimals),
    };
  });

  return { ...base, tokens: tokenBalances };
}
```

Now let me also fix the `lib/utils.ts` to ensure it's complete:

```tsx{path=src/lib/utils.ts}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function short(value: string, l = 6, r = 4) {
  const s = String(value || "");
  return s.length > l + r + 3 ? `${s.slice(0, l)}…${s.slice(-r)}` : s;
}

export function formatUnits(raw: bigint | string, decimals: number) {
  const text = ethers.formatUnits(raw, decimals);
  const [whole, fraction = ""] = text.split(".");
  return `${whole}.${fraction.padEnd(6, "0").slice(0, 6)}`;
}

export function parseDecimalUnits(value: string, decimals: number) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text) || !/[1-9]/.test(text)) {
    throw new Error("Enter a positive amount");
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0")
  );
}

export function evmToTronAddress(address: string) {
  const raw = address.replace(/^0x/i, "").toLowerCase();
  const payload = ethers.getBytes(`0x41${raw}`);
  const second = ethers.sha256(ethers.getBytes(ethers.sha256(payload)));
  return base58Encode(ethers.getBytes(`0x41${raw}${second.slice(2, 10)}`));
}

function base58Encode(bytes: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = BigInt(`0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`);
  let result = "";
  while (n > 0n) {
    result = alphabet[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = `1${result}`;
  return result;
}

export const isTronAddress = (a: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(String(a || ""));
export const isValidAddress = (a: string, chainType: string) =>
  chainType === "tron" ? isTronAddress(a) : ethers.isAddress(a);

export function walletFromSecret(input: string, accountIndex = 0, nextNum: number) {
  const clean = input.trim();
  if (!clean) throw new Error("Enter a private key or mnemonic");
  const isPhrase = clean.split(/\s+/).length > 1;
  const wallet = isPhrase
    ? ethers.HDNodeWallet.fromPhrase(clean, undefined, `m/44'/60'/0'/0/${accountIndex}`)
    : new ethers.Wallet(clean.startsWith("0x") ? clean : `0x${clean}`);
  return {
    name: `Wallet_${nextNum}`,
    accountIndex: isPhrase ? accountIndex : 0,
    address: wallet.address,
    tronAddress: evmToTronAddress(wallet.address),
    rawPrivateKey: wallet.privateKey,
    mnemonic: isPhrase ? clean : null,
  };
}
```

And the toast store:

```tsx{path=src/lib/toast.ts}
import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  type: "info" | "ok" | "bad";
}

interface ToastState {
  toasts: Toast[];
  toast: (message: string, type?: "info" | "ok" | "bad") => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = "info") => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4600);
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
```

And the types file:

```tsx{path=src/lib/types.ts}
export type ChainType = "evm" | "tron";

export interface Network {
  id: string;
  name: string;
  chainType: ChainType;
  rpc: string;
  alchemySlug?: string;
  nativeSymbol: string;
  chainId?: number;
  explorerUrl?: string;
}

export interface Token {
  id: string;
  networkId: string;
  name: string;
  address: string;
  decimals: number;
  chainType: ChainType;
}

export interface Wallet {
  name: string;
  address: string;
  tronAddress: string;
  rawPrivateKey: string;
  mnemonic: string | null;
  accountIndex: number;
}

export interface BalanceResult {
  network: Network;
  nativeRaw: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  error?: string;
  inactive?: boolean;
}

export interface TokenBalance {
  name: string;
  raw: string;
  balance: string;
  error?: string;
}

export interface Transaction {
  hash: string;
  type: string;
  token?: string | null;
  network: string;
  to: string;
  amount: string;
  status: string;
  timestamp: number;
  walletAddress?: string;
}

export interface LogEntry {
  at: string;
  message: string;
}
```

Now the app should work. The key fixes were:
1. Added the missing `SecretsDialog` component
2. Added the missing `Toaster` component
3. Fixed the store to properly pass `tokens` to the Tron query function
4. Ensured all imports resolve correctly

The application is a complete EVM/Tron wallet manager with:
- Dashboard view showing wallet overview
- Balances view for all networks
- Send view for native and token transfers
- Approvals view for ERC-20 token approvals
- Networks view for managing RPC endpoints and tokens
- History view for transaction history
- Activity log view
- Import dialog for adding wallets
- Network/Token dialogs for configuration
- Secrets dialog for viewing private keys3:Taa7,import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SubNav } from "@/components/SubNav";
import { Dashboard } from "@/components/Dashboard";
import { Balances } from "@/components/Balances";
import { Send } from "@/components/Send";
import { Approvals } from "@/components/Approvals";
import { Networks } from "@/components/Networks";
import { History } from "@/components/History";
import { Activity } from "@/components/Activity";
import { ImportDialog } from "@/components/ImportDialog";
import { NetworkDialog } from "@/components/NetworkDialog";
import { TokenDialog } from "@/components/TokenDialog";
import { SecretsDialog } from "@/components/SecretsDialog";
import { Toaster } from "@/components/Toaster";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [dialog, setDialog] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const { wallets, currentWalletId, setCurrentWallet, refreshBalances, balanceLoading, balanceUpdated } = useWalletStore();
  const { toast } = useToast();

  useEffect(() => {
    if (wallets.length > 0 && !currentWalletId) {
      setCurrentWallet(wallets[0].address);
    }
  }, [wallets, currentWalletId, setCurrentWallet]);

  const handleRefresh = async () => {
    await refreshBalances();
    toast("Balances refreshed", "ok");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        wallets={wallets}
        selectedWallet={selectedWallet}
        onSelectWallet={setSelectedWallet}
        onRefresh={handleRefresh}
        onImport={() => setDialog("import")}
        balanceLoading={balanceLoading}
        balanceUpdated={balanceUpdated}
      />
      <SubNav view={view} onViewChange={setView} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {view === "dashboard" && <Dashboard onImport={() => setDialog("import")} />}
        {view === "balances" && <Balances />}
        {view === "send" && <Send />}
        {view === "approvals" && <Approvals />}
        {view === "networks" && <Networks />}
        {view === "history" && <History />}
        {view === "activity" && <Activity />}
      </main>
      <ImportDialog open={dialog === "import"} onClose={() => setDialog(null)} />
      <NetworkDialog open={dialog === "network"} onClose={() => setDialog(null)} />
      <TokenDialog open={dialog === "token"} onClose={() => setDialog(null)} />
      <SecretsDialog open={dialog === "secrets"} onClose={() => setDialog(null)} />
      <Toaster />
    </div>
  );
}4:Tac4,```tsx{path=src/App.tsx}
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SubNav } from "@/components/SubNav";
import { Dashboard } from "@/components/Dashboard";
import { Balances } from "@/components/Balances";
import { Send } from "@/components/Send";
import { Approvals } from "@/components/Approvals";
import { Networks } from "@/components/Networks";
import { History } from "@/components/History";
import { Activity } from "@/components/Activity";
import { ImportDialog } from "@/components/ImportDialog";
import { NetworkDialog } from "@/components/NetworkDialog";
import { TokenDialog } from "@/components/TokenDialog";
import { SecretsDialog } from "@/components/SecretsDialog";
import { Toaster } from "@/components/Toaster";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [dialog, setDialog] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const { wallets, currentWalletId, setCurrentWallet, refreshBalances, balanceLoading, balanceUpdated } = useWalletStore();
  const { toast } = useToast();

  useEffect(() => {
    if (wallets.length > 0 && !currentWalletId) {
      setCurrentWallet(wallets[0].address);
    }
  }, [wallets, currentWalletId, setCurrentWallet]);

  const handleRefresh = async () => {
    await refreshBalances();
    toast("Balances refreshed", "ok");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        wallets={wallets}
        selectedWallet={selectedWallet}
        onSelectWallet={setSelectedWallet}
        onRefresh={handleRefresh}
        onImport={() => setDialog("import")}
        balanceLoading={balanceLoading}
        balanceUpdated={balanceUpdated}
      />
      <SubNav view={view} onViewChange={setView} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {view === "dashboard" && <Dashboard onImport={() => setDialog("import")} />}
        {view === "balances" && <Balances />}
        {view === "send" && <Send />}
        {view === "approvals" && <Approvals />}
        {view === "networks" && <Networks />}
        {view === "history" && <History />}
        {view === "activity" && <Activity />}
      </main>
      <ImportDialog open={dialog === "import"} onClose={() => setDialog(null)} />
      <NetworkDialog open={dialog === "network"} onClose={() => setDialog(null)} />
      <TokenDialog open={dialog === "token"} onClose={() => setDialog(null)} />
      <SecretsDialog open={dialog === "secrets"} onClose={() => setDialog(null)} />
      <Toaster />
    </div>
  );
}
```5:T435,export type ChainType = "evm" | "tron";

export interface Network {
  id: string;
  name: string;
  chainType: ChainType;
  rpc: string;
  alchemySlug?: string;
  nativeSymbol: string;
  chainId?: number;
  explorerUrl?: string;
}

export interface Token {
  id: string;
  networkId: string;
  name: string;
  address: string;
  decimals: number;
  chainType: ChainType;
}

export interface Wallet {
  name: string;
  address: string;
  tronAddress: string;
  rawPrivateKey: string;
  mnemonic: string | null;
  accountIndex: number;
}

export interface BalanceResult {
  network: Network;
  nativeRaw: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  error?: string;
  inactive?: boolean;
}

export interface TokenBalance {
  name: string;
  raw: string;
  balance: string;
  error?: string;
}

export interface Transaction {
  hash: string;
  type: string;
  token?: string | null;
  network: string;
  to: string;
  amount: string;
  status: string;
  timestamp: number;
  walletAddress?: string;
}

export interface LogEntry {
  at: string;
  message: string;
}6:T457,```tsx{path=src/lib/types.ts}
export type ChainType = "evm" | "tron";

export interface Network {
  id: string;
  name: string;
  chainType: ChainType;
  rpc: string;
  alchemySlug?: string;
  nativeSymbol: string;
  chainId?: number;
  explorerUrl?: string;
}

export interface Token {
  id: string;
  networkId: string;
  name: string;
  address: string;
  decimals: number;
  chainType: ChainType;
}

export interface Wallet {
  name: string;
  address: string;
  tronAddress: string;
  rawPrivateKey: string;
  mnemonic: string | null;
  accountIndex: number;
}

export interface BalanceResult {
  network: Network;
  nativeRaw: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  error?: string;
  inactive?: boolean;
}

export interface TokenBalance {
  name: string;
  raw: string;
  balance: string;
  error?: string;
}

export interface Transaction {
  hash: string;
  type: string;
  token?: string | null;
  network: string;
  to: string;
  amount: string;
  status: string;
  timestamp: number;
  walletAddress?: string;
}

export interface LogEntry {
  at: string;
  message: string;
}
```7:T27ca,import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Network, Token, Wallet, BalanceResult, Transaction, LogEntry } from "@/lib/types";
import { NETWORK_PRESETS, TOKEN_PRESETS } from "@/lib/presets";
import { ethers } from "ethers";
import { evmToTronAddress, formatUnits } from "@/lib/utils";

interface WalletState {
  wallets: Wallet[];
  currentWalletId: string | null;
  networks: Network[];
  tokens: Token[];
  history: Record<string, Transaction[]>;
  allHistory: Record<string, Transaction[]>;
  logs: LogEntry[];
  allBalanceResults: Record<string, BalanceResult[]>;
  balanceUpdated: number | null;
  balanceLoading: boolean;
  activityGate: boolean;
  nextWalletNum: number;
  alchemyKey: string;
  tronGridKey: string;
  setCurrentWallet: (address: string) => void;
  addWallets: (wallets: Wallet[]) => void;
  removeWallet: (address: string) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (id: string) => void;
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  refreshBalances: () => Promise<void>;
  addTransaction: (address: string, tx: Transaction) => void;
  updateTransactionStatus: (address: string, hash: string, status: string) => void;
  clearHistory: () => void;
  clearLog: () => void;
  log: (message: string) => void;
  setActivityGate: (value: boolean) => void;
  setAlchemyKey: (key: string) => void;
  setTronGridKey: (key: string) => void;
  resetNetworks: () => void;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      currentWalletId: null,
      networks: NETWORK_PRESETS,
      tokens: TOKEN_PRESETS,
      history: {},
      allHistory: {},
      logs: [],
      allBalanceResults: {},
      balanceUpdated: null,
      balanceLoading: false,
      activityGate: true,
      nextWalletNum: 1,
      alchemyKey: "",
      tronGridKey: "",

      setCurrentWallet: (address) => set({ currentWalletId: address }),

      addWallets: (newWallets) => {
        const { wallets, nextWalletNum } = get();
        const existing = new Set(wallets.map((w) => w.address));
        const unique = newWallets.filter((w) => !existing.has(w.address));
        if (unique.length === 0) return;
        set({
          wallets: [...wallets, ...unique],
          nextWalletNum: nextWalletNum + unique.length,
          currentWalletId: get().currentWalletId || unique[0].address,
        });
        get().log(`Imported ${unique.length} wallet(s)`);
      },

      removeWallet: (address) => {
        const { wallets, currentWalletId } = get();
        const filtered = wallets.filter((w) => w.address !== address);
        set({
          wallets: filtered,
          currentWalletId: currentWalletId === address ? (filtered[0]?.address || null) : currentWalletId,
        });
        get().log(`Removed wallet ${address.slice(0, 6)}…`);
      },

      addNetwork: (network) => {
        const { networks } = get();
        if (networks.some((n) => n.id === network.id)) return;
        set({ networks: [...networks, network] });
        get().log(`Added network ${network.name}`);
      },

      removeNetwork: (id) => {
        set({ networks: get().networks.filter((n) => n.id !== id) });
        get().log(`Removed network ${id}`);
      },

      addToken: (token) => {
        const { tokens } = get();
        if (tokens.some((t) => t.id === token.id)) return;
        set({ tokens: [...tokens, token] });
        get().log(`Added token ${token.name}`);
      },

      removeToken: (id) => {
        set({ tokens: get().tokens.filter((t) => t.id !== id) });
        get().log(`Removed token ${id}`);
      },

      refreshBalances: async () => {
        const { wallets, networks, tokens, activityGate, alchemyKey, tronGridKey } = get();
        if (wallets.length === 0) return;
        set({ balanceLoading: true });

        const results: Record<string, BalanceResult[]> = {};
        await Promise.all(
          wallets.map(async (wallet) => {
            const walletResults = await Promise.all(
              networks.map(async (network) => {
                try {
                  if (network.chainType === "tron") {
                    return await queryTronNetwork(network, wallet, tronGridKey, tokens);
                  }
                  return await queryEvmNetwork(network, wallet, tokens, activityGate, alchemyKey);
                } catch (error: any) {
                  return {
                    network,
                    nativeRaw: "0",
                    nativeBalance: "0",
                    tokens: [],
                    error: error?.message || "Endpoint unavailable",
                  };
                }
              })
            );
            results[wallet.address] = walletResults;
          })
        );

        set({
          allBalanceResults: results,
          balanceUpdated: Date.now(),
          balanceLoading: false,
        });
      },

      addTransaction: (address, tx) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: [tx, ...(history[address] || [])].slice(0, 200),
          },
        });
        get().log(`Tx Pending · ${tx.type} → ${tx.to} · ${tx.hash}`);
      },

      updateTransactionStatus: (address, hash, status) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: (history[address] || []).map((t) =>
              t.hash === hash ? { ...t, status } : t
            ),
          },
        });
        get().log(`Tx ${status} · ${hash}`);
      },

      clearHistory: () => {
        set({ history: {}, allHistory: {} });
        get().log("Cleared transaction history");
      },

      clearLog: () => set({ logs: [] }),

      log: (message) => {
        const { logs } = get();
        set({
          logs: [...logs, { at: new Date().toISOString(), message }].slice(-500),
        });
      },

      setActivityGate: (value) => set({ activityGate: value }),
      setAlchemyKey: (key) => set({ alchemyKey: key }),
      setTronGridKey: (key) => set({ tronGridKey: key }),
      resetNetworks: () => set({ networks: NETWORK_PRESETS }),
    }),
    {
      name: "evm-cockpit-v3",
      partialize: (state) => ({
        wallets: state.wallets,
        currentWalletId: state.currentWalletId,
        networks: state.networks,
        tokens: state.tokens,
        history: state.history,
        allHistory: state.allHistory,
        logs: state.logs,
        allBalanceResults: state.allBalanceResults,
        balanceUpdated: state.balanceUpdated,
        activityGate: state.activityGate,
        nextWalletNum: state.nextWalletNum,
        alchemyKey: state.alchemyKey,
        tronGridKey: state.tronGridKey,
      }),
    }
  )
);

async function queryEvmNetwork(
  network: Network,
  wallet: Wallet,
  tokens: Token[],
  activityGate: boolean,
  alchemyKey: string
): Promise<BalanceResult> {
  const url = network.alchemySlug && alchemyKey
    ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
    : network.rpc;

  const provider = new ethers.JsonRpcProvider(url, network.chainId ? { chainId: network.chainId, name: network.id } : undefined);

  const [native, txCount] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getTransactionCount(wallet.address),
  ]);

  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 18),
  };

  const hasActivity = !activityGate || Number(txCount) > 0 || native > 0n;
  if (!hasActivity) {
    return { ...base, inactive: true, tokens: [] };
  }

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "evm");
  const tokenBalances = await Promise.all(
    networkTokens.map(async (token) => {
      try {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const raw = await contract.balanceOf(wallet.address);
        return {
          name: token.name,
          raw: raw.toString(),
          balance: formatUnits(raw, token.decimals),
        };
      } catch (error: any) {
        return {
          name: token.name,
          raw: "0",
          balance: "—",
          error: error?.message || "Read failed",
        };
      }
    })
  );

  return { ...base, tokens: tokenBalances };
}

async function queryTronNetwork(
  network: Network,
  wallet: Wallet,
  tronGridKey: string,
  tokens: Token[]
): Promise<BalanceResult> {
  const address = wallet.tronAddress || evmToTronAddress(wallet.address);
  const headers: Record<string, string> = {};
  if (tronGridKey) headers["TRON-PRO-API-KEY"] = tronGridKey;

  const res = await fetch(`${network.rpc.replace(/\/$/, "")}/v1/accounts/${address}`, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  const account = (data.data || [])[0] || null;

  const native = BigInt(account?.balance ?? 0);
  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 6),
  };

  if (!account) return { ...base, inactive: true, tokens: [] };

  const held = new Map<string, string>();
  (account.trc20 || []).forEach((entry: Record<string, string>) => {
    Object.entries(entry).forEach(([addr, amt]) => held.set(addr, amt));
  });

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "tron");
  const tokenBalances = networkTokens.map((token) => {
    const raw = BigInt(held.get(token.address) || 0);
    return {
      name: token.name,
      raw: raw.toString(),
      balance: formatUnits(raw, token.decimals),
    };
  });

  return { ...base, tokens: tokenBalances };
}8:T27ec,```tsx{path=src/lib/store.ts}
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Network, Token, Wallet, BalanceResult, Transaction, LogEntry } from "@/lib/types";
import { NETWORK_PRESETS, TOKEN_PRESETS } from "@/lib/presets";
import { ethers } from "ethers";
import { evmToTronAddress, formatUnits } from "@/lib/utils";

interface WalletState {
  wallets: Wallet[];
  currentWalletId: string | null;
  networks: Network[];
  tokens: Token[];
  history: Record<string, Transaction[]>;
  allHistory: Record<string, Transaction[]>;
  logs: LogEntry[];
  allBalanceResults: Record<string, BalanceResult[]>;
  balanceUpdated: number | null;
  balanceLoading: boolean;
  activityGate: boolean;
  nextWalletNum: number;
  alchemyKey: string;
  tronGridKey: string;
  setCurrentWallet: (address: string) => void;
  addWallets: (wallets: Wallet[]) => void;
  removeWallet: (address: string) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (id: string) => void;
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  refreshBalances: () => Promise<void>;
  addTransaction: (address: string, tx: Transaction) => void;
  updateTransactionStatus: (address: string, hash: string, status: string) => void;
  clearHistory: () => void;
  clearLog: () => void;
  log: (message: string) => void;
  setActivityGate: (value: boolean) => void;
  setAlchemyKey: (key: string) => void;
  setTronGridKey: (key: string) => void;
  resetNetworks: () => void;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      currentWalletId: null,
      networks: NETWORK_PRESETS,
      tokens: TOKEN_PRESETS,
      history: {},
      allHistory: {},
      logs: [],
      allBalanceResults: {},
      balanceUpdated: null,
      balanceLoading: false,
      activityGate: true,
      nextWalletNum: 1,
      alchemyKey: "",
      tronGridKey: "",

      setCurrentWallet: (address) => set({ currentWalletId: address }),

      addWallets: (newWallets) => {
        const { wallets, nextWalletNum } = get();
        const existing = new Set(wallets.map((w) => w.address));
        const unique = newWallets.filter((w) => !existing.has(w.address));
        if (unique.length === 0) return;
        set({
          wallets: [...wallets, ...unique],
          nextWalletNum: nextWalletNum + unique.length,
          currentWalletId: get().currentWalletId || unique[0].address,
        });
        get().log(`Imported ${unique.length} wallet(s)`);
      },

      removeWallet: (address) => {
        const { wallets, currentWalletId } = get();
        const filtered = wallets.filter((w) => w.address !== address);
        set({
          wallets: filtered,
          currentWalletId: currentWalletId === address ? (filtered[0]?.address || null) : currentWalletId,
        });
        get().log(`Removed wallet ${address.slice(0, 6)}…`);
      },

      addNetwork: (network) => {
        const { networks } = get();
        if (networks.some((n) => n.id === network.id)) return;
        set({ networks: [...networks, network] });
        get().log(`Added network ${network.name}`);
      },

      removeNetwork: (id) => {
        set({ networks: get().networks.filter((n) => n.id !== id) });
        get().log(`Removed network ${id}`);
      },

      addToken: (token) => {
        const { tokens } = get();
        if (tokens.some((t) => t.id === token.id)) return;
        set({ tokens: [...tokens, token] });
        get().log(`Added token ${token.name}`);
      },

      removeToken: (id) => {
        set({ tokens: get().tokens.filter((t) => t.id !== id) });
        get().log(`Removed token ${id}`);
      },

      refreshBalances: async () => {
        const { wallets, networks, tokens, activityGate, alchemyKey, tronGridKey } = get();
        if (wallets.length === 0) return;
        set({ balanceLoading: true });

        const results: Record<string, BalanceResult[]> = {};
        await Promise.all(
          wallets.map(async (wallet) => {
            const walletResults = await Promise.all(
              networks.map(async (network) => {
                try {
                  if (network.chainType === "tron") {
                    return await queryTronNetwork(network, wallet, tronGridKey, tokens);
                  }
                  return await queryEvmNetwork(network, wallet, tokens, activityGate, alchemyKey);
                } catch (error: any) {
                  return {
                    network,
                    nativeRaw: "0",
                    nativeBalance: "0",
                    tokens: [],
                    error: error?.message || "Endpoint unavailable",
                  };
                }
              })
            );
            results[wallet.address] = walletResults;
          })
        );

        set({
          allBalanceResults: results,
          balanceUpdated: Date.now(),
          balanceLoading: false,
        });
      },

      addTransaction: (address, tx) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: [tx, ...(history[address] || [])].slice(0, 200),
          },
        });
        get().log(`Tx Pending · ${tx.type} → ${tx.to} · ${tx.hash}`);
      },

      updateTransactionStatus: (address, hash, status) => {
        const { history } = get();
        set({
          history: {
            ...history,
            [address]: (history[address] || []).map((t) =>
              t.hash === hash ? { ...t, status } : t
            ),
          },
        });
        get().log(`Tx ${status} · ${hash}`);
      },

      clearHistory: () => {
        set({ history: {}, allHistory: {} });
        get().log("Cleared transaction history");
      },

      clearLog: () => set({ logs: [] }),

      log: (message) => {
        const { logs } = get();
        set({
          logs: [...logs, { at: new Date().toISOString(), message }].slice(-500),
        });
      },

      setActivityGate: (value) => set({ activityGate: value }),
      setAlchemyKey: (key) => set({ alchemyKey: key }),
      setTronGridKey: (key) => set({ tronGridKey: key }),
      resetNetworks: () => set({ networks: NETWORK_PRESETS }),
    }),
    {
      name: "evm-cockpit-v3",
      partialize: (state) => ({
        wallets: state.wallets,
        currentWalletId: state.currentWalletId,
        networks: state.networks,
        tokens: state.tokens,
        history: state.history,
        allHistory: state.allHistory,
        logs: state.logs,
        allBalanceResults: state.allBalanceResults,
        balanceUpdated: state.balanceUpdated,
        activityGate: state.activityGate,
        nextWalletNum: state.nextWalletNum,
        alchemyKey: state.alchemyKey,
        tronGridKey: state.tronGridKey,
      }),
    }
  )
);

async function queryEvmNetwork(
  network: Network,
  wallet: Wallet,
  tokens: Token[],
  activityGate: boolean,
  alchemyKey: string
): Promise<BalanceResult> {
  const url = network.alchemySlug && alchemyKey
    ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
    : network.rpc;

  const provider = new ethers.JsonRpcProvider(url, network.chainId ? { chainId: network.chainId, name: network.id } : undefined);

  const [native, txCount] = await Promise.all([
    provider.getBalance(wallet.address),
    provider.getTransactionCount(wallet.address),
  ]);

  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 18),
  };

  const hasActivity = !activityGate || Number(txCount) > 0 || native > 0n;
  if (!hasActivity) {
    return { ...base, inactive: true, tokens: [] };
  }

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "evm");
  const tokenBalances = await Promise.all(
    networkTokens.map(async (token) => {
      try {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const raw = await contract.balanceOf(wallet.address);
        return {
          name: token.name,
          raw: raw.toString(),
          balance: formatUnits(raw, token.decimals),
        };
      } catch (error: any) {
        return {
          name: token.name,
          raw: "0",
          balance: "—",
          error: error?.message || "Read failed",
        };
      }
    })
  );

  return { ...base, tokens: tokenBalances };
}

async function queryTronNetwork(
  network: Network,
  wallet: Wallet,
  tronGridKey: string,
  tokens: Token[]
): Promise<BalanceResult> {
  const address = wallet.tronAddress || evmToTronAddress(wallet.address);
  const headers: Record<string, string> = {};
  if (tronGridKey) headers["TRON-PRO-API-KEY"] = tronGridKey;

  const res = await fetch(`${network.rpc.replace(/\/$/, "")}/v1/accounts/${address}`, { headers });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  const account = (data.data || [])[0] || null;

  const native = BigInt(account?.balance ?? 0);
  const base = {
    network,
    nativeRaw: native.toString(),
    nativeBalance: formatUnits(native, 6),
  };

  if (!account) return { ...base, inactive: true, tokens: [] };

  const held = new Map<string, string>();
  (account.trc20 || []).forEach((entry: Record<string, string>) => {
    Object.entries(entry).forEach(([addr, amt]) => held.set(addr, amt));
  });

  const networkTokens = tokens.filter((t) => t.networkId === network.id && t.chainType === "tron");
  const tokenBalances = networkTokens.map((token) => {
    const raw = BigInt(held.get(token.address) || 0);
    return {
      name: token.name,
      raw: raw.toString(),
      balance: formatUnits(raw, token.decimals),
    };
  });

  return { ...base, tokens: tokenBalances };
}
```9:T2524,import { Network, Token } from "@/lib/types";

export const NETWORK_PRESETS: Network[] = [
  { id: "ethereum-mainnet", name: "Ethereum Mainnet", chainType: "evm", rpc: "https://ethereum-rpc.publicnode.com", alchemySlug: "eth-mainnet", nativeSymbol: "ETH", chainId: 1, explorerUrl: "https://etherscan.io/tx/" },
  { id: "bnb-mainnet", name: "BNB Smart Chain", chainType: "evm", rpc: "https://bsc-rpc.publicnode.com", alchemySlug: "bnb-mainnet", nativeSymbol: "BNB", chainId: 56, explorerUrl: "https://bscscan.com/tx/" },
  { id: "polygon-mainnet", name: "Polygon PoS", chainType: "evm", rpc: "https://polygon-bor-rpc.publicnode.com", alchemySlug: "polygon-mainnet", nativeSymbol: "POL", chainId: 137, explorerUrl: "https://polygonscan.com/tx/" },
  { id: "arbitrum-one", name: "Arbitrum One", chainType: "evm", rpc: "https://arbitrum-one-rpc.publicnode.com", alchemySlug: "arb-mainnet", nativeSymbol: "ETH", chainId: 42161, explorerUrl: "https://arbiscan.io/tx/" },
  { id: "optimism-mainnet", name: "Optimism", chainType: "evm", rpc: "https://optimism-rpc.publicnode.com", alchemySlug: "opt-mainnet", nativeSymbol: "ETH", chainId: 10, explorerUrl: "https://optimistic.etherscan.io/tx/" },
  { id: "base-mainnet", name: "Base", chainType: "evm", rpc: "https://base-rpc.publicnode.com", alchemySlug: "base-mainnet", nativeSymbol: "ETH", chainId: 8453, explorerUrl: "https://basescan.org/tx/" },
  { id: "avalanche-mainnet", name: "Avalanche C-Chain", chainType: "evm", rpc: "https://avalanche-c-chain-rpc.publicnode.com", alchemySlug: "avax-mainnet", nativeSymbol: "AVAX", chainId: 43114, explorerUrl: "https://snowtrace.io/tx/" },
  { id: "mantle-mainnet", name: "Mantle", chainType: "evm", rpc: "https://rpc.mantle.xyz", alchemySlug: "mantle-mainnet", nativeSymbol: "MNT", chainId: 5000, explorerUrl: "https://mantlescan.xyz/tx/" },
  { id: "zksync-mainnet", name: "zkSync Era", chainType: "evm", rpc: "https://mainnet.era.zksync.io", alchemySlug: "zksync-mainnet", nativeSymbol: "ETH", chainId: 324, explorerUrl: "https://explorer.zksync.io/tx/" },
  { id: "linea-mainnet", name: "Linea", chainType: "evm", rpc: "https://rpc.linea.build", alchemySlug: "linea-mainnet", nativeSymbol: "ETH", chainId: 59144, explorerUrl: "https://lineascan.build/tx/" },
  { id: "scroll-mainnet", name: "Scroll", chainType: "evm", rpc: "https://rpc.scroll.io", alchemySlug: "scroll-mainnet", nativeSymbol: "ETH", chainId: 534352, explorerUrl: "https://scrollscan.com/tx/" },
  { id: "blast-mainnet", name: "Blast", chainType: "evm", rpc: "https://rpc.blast.io", alchemySlug: "blast-mainnet", nativeSymbol: "ETH", chainId: 81457, explorerUrl: "https://blastscan.io/tx/" },
  { id: "rootstock-mainnet", name: "Rootstock", chainType: "evm", rpc: "https://public-node.rsk.co", alchemySlug: "rootstock-mainnet", nativeSymbol: "RBTC", chainId: 30, explorerUrl: "https://explorer.rootstock.io/tx/" },
  { id: "gnosis-mainnet", name: "Gnosis Chain", chainType: "evm", rpc: "https://gnosis-rpc.publicnode.com", alchemySlug: "gnosis-mainnet", nativeSymbol: "XDAI", chainId: 100, explorerUrl: "https://gnosisscan.io/tx/" },
  { id: "celo-mainnet", name: "Celo", chainType: "evm", rpc: "https://forno.celo.org", alchemySlug: "celo-mainnet", nativeSymbol: "CELO", chainId: 42220, explorerUrl: "https://celoscan.io/tx/" },
  { id: "fantom-mainnet", name: "Fantom Opera", chainType: "evm", rpc: "https://rpc.fantom.network", nativeSymbol: "FTM", chainId: 250, explorerUrl: "https://ftmscan.com/tx/" },
  { id: "cronos-mainnet", name: "Cronos", chainType: "evm", rpc: "https://evm.cronos.org", nativeSymbol: "CRO", chainId: 25, explorerUrl: "https://cronoscan.com/tx/" },
  { id: "moonbeam-mainnet", name: "Moonbeam", chainType: "evm", rpc: "https://moonbeam.unitedbloc.com", nativeSymbol: "GLMR", chainId: 1284, explorerUrl: "https://moonscan.io/tx/" },
  { id: "opbnb-mainnet", name: "opBNB", chainType: "evm", rpc: "https://opbnb-rpc.publicnode.com", alchemySlug: "opbnb-mainnet", nativeSymbol: "BNB", chainId: 204, explorerUrl: "https://opbnb.bscscan.com/tx/" },
  { id: "polygon-zkevm", name: "Polygon zkEVM", chainType: "evm", rpc: "https://zkevm-rpc.com", nativeSymbol: "ETH", chainId: 1101, explorerUrl: "https://zkevm.polygonscan.com/tx/" },
  { id: "arbitrum-nova", name: "Arbitrum Nova", chainType: "evm", rpc: "https://nova.arbitrum.io/rpc", nativeSymbol: "ETH", chainId: 42170, explorerUrl: "https://nova.arbiscan.io/tx/" },
  { id: "mode-mainnet", name: "Mode", chainType: "evm", rpc: "https://mainnet.mode.network", nativeSymbol: "ETH", chainId: 34443, explorerUrl: "https://explorer.mode.network/tx/" },
  { id: "fraxtal-mainnet", name: "Fraxtal", chainType: "evm", rpc: "https://rpc.frax.com", alchemySlug: "frax-mainnet", nativeSymbol: "frxETH", chainId: 252, explorerUrl: "https://fraxscan.com/tx/" },
  { id: "taiko-mainnet", name: "Taiko", chainType: "evm", rpc: "https://rpc.mainnet.taiko.xyz", nativeSymbol: "ETH", chainId: 167000, explorerUrl: "https://taikoscan.io/tx/" },
  { id: "zora-mainnet", name: "Zora", chainType: "evm", rpc: "https://rpc.zora.energy", alchemySlug: "zora-mainnet", nativeSymbol: "ETH", chainId: 7777777, explorerUrl: "https://explorer.zora.energy/tx/" },
  { id: "unichain-mainnet", name: "Unichain", chainType: "evm", rpc: "https://mainnet.unichain.org", alchemySlug: "unichain-mainnet", nativeSymbol: "ETH", chainId: 130, explorerUrl: "https://uniscan.xyz/tx/" },
  { id: "ink-mainnet", name: "Ink", chainType: "evm", rpc: "https://rpc-gel.inkonchain.com", alchemySlug: "ink-mainnet", nativeSymbol: "ETH", chainId: 57073, explorerUrl: "https://explorer.inkonchain.com/tx/" },
  { id: "sei-mainnet", name: "Sei EVM", chainType: "evm", rpc: "https://evm-rpc.sei-apis.com", nativeSymbol: "SEI", chainId: 1329, explorerUrl: "https://seitrace.com/tx/" },
  { id: "sonic-mainnet", name: "Sonic", chainType: "evm", rpc: "https://rpc.soniclabs.com", alchemySlug: "sonic-mainnet", nativeSymbol: "S", chainId: 146, explorerUrl: "https://sonicscan.org/tx/" },
  { id: "berachain-mainnet", name: "Berachain", chainType: "evm", rpc: "https://rpc.berachain.com", alchemySlug: "berachain-mainnet", nativeSymbol: "BERA", chainId: 80094, explorerUrl: "https://berascan.com/tx/" },
  { id: "worldchain-mainnet", name: "World Chain", chainType: "evm", rpc: "https://worldchain-mainnet.g.alchemy.com/public", alchemySlug: "worldchain-mainnet", nativeSymbol: "ETH", chainId: 480, explorerUrl: "https://worldscan.org/tx/" },
  { id: "tron-mainnet", name: "Tron Mainnet", chainType: "tron", rpc: "https://api.trongrid.io", nativeSymbol: "TRX", explorerUrl: "https://tronscan.org/#/transaction/" },
];

export const TOKEN_PRESETS: Token[] = [
  { id: "eth-usdt", networkId: "ethereum-mainnet", name: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, chainType: "evm" },
  { id: "eth-usdc", networkId: "ethereum-mainnet", name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, chainType: "evm" },
  { id: "eth-dai", networkId: "ethereum-mainnet", name: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, chainType: "evm" },
  { id: "eth-weth", networkId: "ethereum-mainnet", name: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, chainType: "evm" },
  { id: "bnb-usdt", networkId: "bnb-mainnet", name: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, chainType: "evm" },
  { id: "bnb-usdc", networkId: "bnb-mainnet", name: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, chainType: "evm" },
  { id: "bnb-wbnb", networkId: "bnb-mainnet", name: "WBNB", address: "0xbb4CdB9CBd36b01bD1cBaEBF2De08d9173bc095c", decimals: 18, chainType: "evm" },
  { id: "polygon-usdt", networkId: "polygon-mainnet", name: "USDT", address: "0xc2132D05D31c914a87C6611C10748AaCb58F3F54", decimals: 6, chainType: "evm" },
  { id: "polygon-usdc", networkId: "polygon-mainnet", name: "USDC.e", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, chainType: "evm" },
  { id: "polygon-weth", networkId: "polygon-mainnet", name: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, chainType: "evm" },
  { id: "arb-usdt", networkId: "arbitrum-one", name: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, chainType: "evm" },
  { id: "arb-usdc", networkId: "arbitrum-one", name: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, chainType: "evm" },
  { id: "arb-weth", networkId: "arbitrum-one", name: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, chainType: "evm" },
  { id: "op-usdt", networkId: "optimism-mainnet", name: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, chainType: "evm" },
  { id: "op-usdc", networkId: "optimism-mainnet", name: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, chainType: "evm" },
  { id: "base-usdc", networkId: "base-mainnet", name: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, chainType: "evm" },
  { id: "base-weth", networkId: "base-mainnet", name: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, chainType: "evm" },
  { id: "tron-usdt", networkId: "tron-mainnet", name: "USDT", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, chainType: "tron" },
  { id: "tron-usdc", networkId: "tron-mainnet", name: "USDC", address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", decimals: 6, chainType: "tron" },
];a:T2548,```tsx{path=src/lib/presets.ts}
import { Network, Token } from "@/lib/types";

export const NETWORK_PRESETS: Network[] = [
  { id: "ethereum-mainnet", name: "Ethereum Mainnet", chainType: "evm", rpc: "https://ethereum-rpc.publicnode.com", alchemySlug: "eth-mainnet", nativeSymbol: "ETH", chainId: 1, explorerUrl: "https://etherscan.io/tx/" },
  { id: "bnb-mainnet", name: "BNB Smart Chain", chainType: "evm", rpc: "https://bsc-rpc.publicnode.com", alchemySlug: "bnb-mainnet", nativeSymbol: "BNB", chainId: 56, explorerUrl: "https://bscscan.com/tx/" },
  { id: "polygon-mainnet", name: "Polygon PoS", chainType: "evm", rpc: "https://polygon-bor-rpc.publicnode.com", alchemySlug: "polygon-mainnet", nativeSymbol: "POL", chainId: 137, explorerUrl: "https://polygonscan.com/tx/" },
  { id: "arbitrum-one", name: "Arbitrum One", chainType: "evm", rpc: "https://arbitrum-one-rpc.publicnode.com", alchemySlug: "arb-mainnet", nativeSymbol: "ETH", chainId: 42161, explorerUrl: "https://arbiscan.io/tx/" },
  { id: "optimism-mainnet", name: "Optimism", chainType: "evm", rpc: "https://optimism-rpc.publicnode.com", alchemySlug: "opt-mainnet", nativeSymbol: "ETH", chainId: 10, explorerUrl: "https://optimistic.etherscan.io/tx/" },
  { id: "base-mainnet", name: "Base", chainType: "evm", rpc: "https://base-rpc.publicnode.com", alchemySlug: "base-mainnet", nativeSymbol: "ETH", chainId: 8453, explorerUrl: "https://basescan.org/tx/" },
  { id: "avalanche-mainnet", name: "Avalanche C-Chain", chainType: "evm", rpc: "https://avalanche-c-chain-rpc.publicnode.com", alchemySlug: "avax-mainnet", nativeSymbol: "AVAX", chainId: 43114, explorerUrl: "https://snowtrace.io/tx/" },
  { id: "mantle-mainnet", name: "Mantle", chainType: "evm", rpc: "https://rpc.mantle.xyz", alchemySlug: "mantle-mainnet", nativeSymbol: "MNT", chainId: 5000, explorerUrl: "https://mantlescan.xyz/tx/" },
  { id: "zksync-mainnet", name: "zkSync Era", chainType: "evm", rpc: "https://mainnet.era.zksync.io", alchemySlug: "zksync-mainnet", nativeSymbol: "ETH", chainId: 324, explorerUrl: "https://explorer.zksync.io/tx/" },
  { id: "linea-mainnet", name: "Linea", chainType: "evm", rpc: "https://rpc.linea.build", alchemySlug: "linea-mainnet", nativeSymbol: "ETH", chainId: 59144, explorerUrl: "https://lineascan.build/tx/" },
  { id: "scroll-mainnet", name: "Scroll", chainType: "evm", rpc: "https://rpc.scroll.io", alchemySlug: "scroll-mainnet", nativeSymbol: "ETH", chainId: 534352, explorerUrl: "https://scrollscan.com/tx/" },
  { id: "blast-mainnet", name: "Blast", chainType: "evm", rpc: "https://rpc.blast.io", alchemySlug: "blast-mainnet", nativeSymbol: "ETH", chainId: 81457, explorerUrl: "https://blastscan.io/tx/" },
  { id: "rootstock-mainnet", name: "Rootstock", chainType: "evm", rpc: "https://public-node.rsk.co", alchemySlug: "rootstock-mainnet", nativeSymbol: "RBTC", chainId: 30, explorerUrl: "https://explorer.rootstock.io/tx/" },
  { id: "gnosis-mainnet", name: "Gnosis Chain", chainType: "evm", rpc: "https://gnosis-rpc.publicnode.com", alchemySlug: "gnosis-mainnet", nativeSymbol: "XDAI", chainId: 100, explorerUrl: "https://gnosisscan.io/tx/" },
  { id: "celo-mainnet", name: "Celo", chainType: "evm", rpc: "https://forno.celo.org", alchemySlug: "celo-mainnet", nativeSymbol: "CELO", chainId: 42220, explorerUrl: "https://celoscan.io/tx/" },
  { id: "fantom-mainnet", name: "Fantom Opera", chainType: "evm", rpc: "https://rpc.fantom.network", nativeSymbol: "FTM", chainId: 250, explorerUrl: "https://ftmscan.com/tx/" },
  { id: "cronos-mainnet", name: "Cronos", chainType: "evm", rpc: "https://evm.cronos.org", nativeSymbol: "CRO", chainId: 25, explorerUrl: "https://cronoscan.com/tx/" },
  { id: "moonbeam-mainnet", name: "Moonbeam", chainType: "evm", rpc: "https://moonbeam.unitedbloc.com", nativeSymbol: "GLMR", chainId: 1284, explorerUrl: "https://moonscan.io/tx/" },
  { id: "opbnb-mainnet", name: "opBNB", chainType: "evm", rpc: "https://opbnb-rpc.publicnode.com", alchemySlug: "opbnb-mainnet", nativeSymbol: "BNB", chainId: 204, explorerUrl: "https://opbnb.bscscan.com/tx/" },
  { id: "polygon-zkevm", name: "Polygon zkEVM", chainType: "evm", rpc: "https://zkevm-rpc.com", nativeSymbol: "ETH", chainId: 1101, explorerUrl: "https://zkevm.polygonscan.com/tx/" },
  { id: "arbitrum-nova", name: "Arbitrum Nova", chainType: "evm", rpc: "https://nova.arbitrum.io/rpc", nativeSymbol: "ETH", chainId: 42170, explorerUrl: "https://nova.arbiscan.io/tx/" },
  { id: "mode-mainnet", name: "Mode", chainType: "evm", rpc: "https://mainnet.mode.network", nativeSymbol: "ETH", chainId: 34443, explorerUrl: "https://explorer.mode.network/tx/" },
  { id: "fraxtal-mainnet", name: "Fraxtal", chainType: "evm", rpc: "https://rpc.frax.com", alchemySlug: "frax-mainnet", nativeSymbol: "frxETH", chainId: 252, explorerUrl: "https://fraxscan.com/tx/" },
  { id: "taiko-mainnet", name: "Taiko", chainType: "evm", rpc: "https://rpc.mainnet.taiko.xyz", nativeSymbol: "ETH", chainId: 167000, explorerUrl: "https://taikoscan.io/tx/" },
  { id: "zora-mainnet", name: "Zora", chainType: "evm", rpc: "https://rpc.zora.energy", alchemySlug: "zora-mainnet", nativeSymbol: "ETH", chainId: 7777777, explorerUrl: "https://explorer.zora.energy/tx/" },
  { id: "unichain-mainnet", name: "Unichain", chainType: "evm", rpc: "https://mainnet.unichain.org", alchemySlug: "unichain-mainnet", nativeSymbol: "ETH", chainId: 130, explorerUrl: "https://uniscan.xyz/tx/" },
  { id: "ink-mainnet", name: "Ink", chainType: "evm", rpc: "https://rpc-gel.inkonchain.com", alchemySlug: "ink-mainnet", nativeSymbol: "ETH", chainId: 57073, explorerUrl: "https://explorer.inkonchain.com/tx/" },
  { id: "sei-mainnet", name: "Sei EVM", chainType: "evm", rpc: "https://evm-rpc.sei-apis.com", nativeSymbol: "SEI", chainId: 1329, explorerUrl: "https://seitrace.com/tx/" },
  { id: "sonic-mainnet", name: "Sonic", chainType: "evm", rpc: "https://rpc.soniclabs.com", alchemySlug: "sonic-mainnet", nativeSymbol: "S", chainId: 146, explorerUrl: "https://sonicscan.org/tx/" },
  { id: "berachain-mainnet", name: "Berachain", chainType: "evm", rpc: "https://rpc.berachain.com", alchemySlug: "berachain-mainnet", nativeSymbol: "BERA", chainId: 80094, explorerUrl: "https://berascan.com/tx/" },
  { id: "worldchain-mainnet", name: "World Chain", chainType: "evm", rpc: "https://worldchain-mainnet.g.alchemy.com/public", alchemySlug: "worldchain-mainnet", nativeSymbol: "ETH", chainId: 480, explorerUrl: "https://worldscan.org/tx/" },
  { id: "tron-mainnet", name: "Tron Mainnet", chainType: "tron", rpc: "https://api.trongrid.io", nativeSymbol: "TRX", explorerUrl: "https://tronscan.org/#/transaction/" },
];

export const TOKEN_PRESETS: Token[] = [
  { id: "eth-usdt", networkId: "ethereum-mainnet", name: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, chainType: "evm" },
  { id: "eth-usdc", networkId: "ethereum-mainnet", name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, chainType: "evm" },
  { id: "eth-dai", networkId: "ethereum-mainnet", name: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, chainType: "evm" },
  { id: "eth-weth", networkId: "ethereum-mainnet", name: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, chainType: "evm" },
  { id: "bnb-usdt", networkId: "bnb-mainnet", name: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, chainType: "evm" },
  { id: "bnb-usdc", networkId: "bnb-mainnet", name: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, chainType: "evm" },
  { id: "bnb-wbnb", networkId: "bnb-mainnet", name: "WBNB", address: "0xbb4CdB9CBd36b01bD1cBaEBF2De08d9173bc095c", decimals: 18, chainType: "evm" },
  { id: "polygon-usdt", networkId: "polygon-mainnet", name: "USDT", address: "0xc2132D05D31c914a87C6611C10748AaCb58F3F54", decimals: 6, chainType: "evm" },
  { id: "polygon-usdc", networkId: "polygon-mainnet", name: "USDC.e", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, chainType: "evm" },
  { id: "polygon-weth", networkId: "polygon-mainnet", name: "WETH", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, chainType: "evm" },
  { id: "arb-usdt", networkId: "arbitrum-one", name: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, chainType: "evm" },
  { id: "arb-usdc", networkId: "arbitrum-one", name: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, chainType: "evm" },
  { id: "arb-weth", networkId: "arbitrum-one", name: "WETH", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, chainType: "evm" },
  { id: "op-usdt", networkId: "optimism-mainnet", name: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, chainType: "evm" },
  { id: "op-usdc", networkId: "optimism-mainnet", name: "USDC", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, chainType: "evm" },
  { id: "base-usdc", networkId: "base-mainnet", name: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, chainType: "evm" },
  { id: "base-weth", networkId: "base-mainnet", name: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, chainType: "evm" },
  { id: "tron-usdt", networkId: "tron-mainnet", name: "USDT", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, chainType: "tron" },
  { id: "tron-usdc", networkId: "tron-mainnet", name: "USDC", address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", decimals: 6, chainType: "tron" },
];
```b:Tac0,import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function short(value: string, l = 6, r = 4) {
  const s = String(value || "");
  return s.length > l + r + 3 ? `${s.slice(0, l)}…${s.slice(-r)}` : s;
}

export function formatUnits(raw: bigint | string, decimals: number) {
  const text = ethers.formatUnits(raw, decimals);
  const [whole, fraction = ""] = text.split(".");
  return `${whole}.${fraction.padEnd(6, "0").slice(0, 6)}`;
}

export function parseDecimalUnits(value: string, decimals: number) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text) || !/[1-9]/.test(text)) {
    throw new Error("Enter a positive amount");
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0")
  );
}

export function evmToTronAddress(address: string) {
  const raw = address.replace(/^0x/i, "").toLowerCase();
  const payload = ethers.getBytes(`0x41${raw}`);
  const second = ethers.sha256(ethers.getBytes(ethers.sha256(payload)));
  return base58Encode(ethers.getBytes(`0x41${raw}${second.slice(2, 10)}`));
}

function base58Encode(bytes: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = BigInt(`0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`);
  let result = "";
  while (n > 0n) {
    result = alphabet[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = `1${result}`;
  return result;
}

export const isTronAddress = (a: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(String(a || ""));
export const isValidAddress = (a: string, chainType: string) =>
  chainType === "tron" ? isTronAddress(a) : ethers.isAddress(a);

export function walletFromSecret(input: string, accountIndex = 0, nextNum: number) {
  const clean = input.trim();
  if (!clean) throw new Error("Enter a private key or mnemonic");
  const isPhrase = clean.split(/\s+/).length > 1;
  const wallet = isPhrase
    ? ethers.HDNodeWallet.fromPhrase(clean, undefined, `m/44'/60'/0'/0/${accountIndex}`)
    : new ethers.Wallet(clean.startsWith("0x") ? clean : `0x${clean}`);
  return {
    name: `Wallet_${nextNum}`,
    accountIndex: isPhrase ? accountIndex : 0,
    address: wallet.address,
    tronAddress: evmToTronAddress(wallet.address),
    rawPrivateKey: wallet.privateKey,
    mnemonic: isPhrase ? clean : null,
  };
}c:Tae2,```tsx{path=src/lib/utils.ts}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function short(value: string, l = 6, r = 4) {
  const s = String(value || "");
  return s.length > l + r + 3 ? `${s.slice(0, l)}…${s.slice(-r)}` : s;
}

export function formatUnits(raw: bigint | string, decimals: number) {
  const text = ethers.formatUnits(raw, decimals);
  const [whole, fraction = ""] = text.split(".");
  return `${whole}.${fraction.padEnd(6, "0").slice(0, 6)}`;
}

export function parseDecimalUnits(value: string, decimals: number) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d+)?$/.test(text) || !/[1-9]/.test(text)) {
    throw new Error("Enter a positive amount");
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0")
  );
}

export function evmToTronAddress(address: string) {
  const raw = address.replace(/^0x/i, "").toLowerCase();
  const payload = ethers.getBytes(`0x41${raw}`);
  const second = ethers.sha256(ethers.getBytes(ethers.sha256(payload)));
  return base58Encode(ethers.getBytes(`0x41${raw}${second.slice(2, 10)}`));
}

function base58Encode(bytes: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = BigInt(`0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`);
  let result = "";
  while (n > 0n) {
    result = alphabet[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = `1${result}`;
  return result;
}

export const isTronAddress = (a: string) => /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(String(a || ""));
export const isValidAddress = (a: string, chainType: string) =>
  chainType === "tron" ? isTronAddress(a) : ethers.isAddress(a);

export function walletFromSecret(input: string, accountIndex = 0, nextNum: number) {
  const clean = input.trim();
  if (!clean) throw new Error("Enter a private key or mnemonic");
  const isPhrase = clean.split(/\s+/).length > 1;
  const wallet = isPhrase
    ? ethers.HDNodeWallet.fromPhrase(clean, undefined, `m/44'/60'/0'/0/${accountIndex}`)
    : new ethers.Wallet(clean.startsWith("0x") ? clean : `0x${clean}`);
  return {
    name: `Wallet_${nextNum}`,
    accountIndex: isPhrase ? accountIndex : 0,
    address: wallet.address,
    tronAddress: evmToTronAddress(wallet.address),
    rawPrivateKey: wallet.privateKey,
    mnemonic: isPhrase ? clean : null,
  };
}
```d:Tcc2,import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, Moon, Sun } from "lucide-react";
import { Wallet } from "@/lib/types";
import { short } from "@/lib/utils";
import { useState } from "react";

interface HeaderProps {
  wallets: Wallet[];
  selectedWallet: string;
  onSelectWallet: (address: string) => void;
  onRefresh: () => void;
  onImport: () => void;
  balanceLoading: boolean;
  balanceUpdated: number | null;
}

export function Header({
  wallets,
  selectedWallet,
  onSelectWallet,
  onRefresh,
  onImport,
  balanceLoading,
  balanceUpdated,
}: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mr-auto flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-lg text-white shadow-lg shadow-indigo-500/30">
          ⌁
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold tracking-tight text-slate-100">
            EVM Cockpit
          </div>
          <div className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
            self-custody · local keys
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <Select value={selectedWallet} onValueChange={onSelectWallet}>
          <SelectTrigger className="w-[170px] border-slate-700 bg-slate-900 text-slate-200">
            <SelectValue placeholder="No wallet imported" />
          </SelectTrigger>
          <SelectContent>
            {wallets.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No wallet imported</div>
            )}
            {wallets.map((wallet) => (
              <SelectItem key={wallet.address} value={wallet.address}>
                {wallet.name} · {short(wallet.address)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title="Toggle theme"
        className="text-slate-400 hover:text-slate-100"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={balanceLoading}
        title="Refresh balances"
        className="text-slate-400 hover:text-slate-100"
      >
        <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
      </Button>

      <Button onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
        <Plus className="mr-1 h-4 w-4" />
        Import
      </Button>
    </header>
  );
}e:Tced,```tsx{path=src/components/Header.tsx}
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, Moon, Sun } from "lucide-react";
import { Wallet } from "@/lib/types";
import { short } from "@/lib/utils";
import { useState } from "react";

interface HeaderProps {
  wallets: Wallet[];
  selectedWallet: string;
  onSelectWallet: (address: string) => void;
  onRefresh: () => void;
  onImport: () => void;
  balanceLoading: boolean;
  balanceUpdated: number | null;
}

export function Header({
  wallets,
  selectedWallet,
  onSelectWallet,
  onRefresh,
  onImport,
  balanceLoading,
  balanceUpdated,
}: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mr-auto flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-lg text-white shadow-lg shadow-indigo-500/30">
          ⌁
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold tracking-tight text-slate-100">
            EVM Cockpit
          </div>
          <div className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
            self-custody · local keys
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <Select value={selectedWallet} onValueChange={onSelectWallet}>
          <SelectTrigger className="w-[170px] border-slate-700 bg-slate-900 text-slate-200">
            <SelectValue placeholder="No wallet imported" />
          </SelectTrigger>
          <SelectContent>
            {wallets.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No wallet imported</div>
            )}
            {wallets.map((wallet) => (
              <SelectItem key={wallet.address} value={wallet.address}>
                {wallet.name} · {short(wallet.address)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title="Toggle theme"
        className="text-slate-400 hover:text-slate-100"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={balanceLoading}
        title="Refresh balances"
        className="text-slate-400 hover:text-slate-100"
      >
        <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
      </Button>

      <Button onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
        <Plus className="mr-1 h-4 w-4" />
        Import
      </Button>
    </header>
  );
}
```f:T634,import { LayoutDashboard, Wallet, Send, ShieldCheck, Network, History, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubNavProps {
  view: string;
  onViewChange: (view: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "balances", label: "Balances", icon: Wallet },
  { id: "send", label: "Send", icon: Send },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "networks", label: "Networks", icon: Network },
  { id: "history", label: "History", icon: History },
  { id: "activity", label: "Activity log", icon: Activity },
];

export function SubNav({ view, onViewChange }: SubNavProps) {
  return (
    <nav className="sticky top-16 z-30 flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              "flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all",
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}10:T65f,```tsx{path=src/components/SubNav.tsx}
import { LayoutDashboard, Wallet, Send, ShieldCheck, Network, History, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubNavProps {
  view: string;
  onViewChange: (view: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "balances", label: "Balances", icon: Wallet },
  { id: "send", label: "Send", icon: Send },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "networks", label: "Networks", icon: Network },
  { id: "history", label: "History", icon: History },
  { id: "activity", label: "Activity log", icon: Activity },
];

export function SubNav({ view, onViewChange }: SubNavProps) {
  return (
    <nav className="sticky top-16 z-30 flex items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950/80 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              "flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all",
              active
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
```11:T2aba,import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { RefreshCw, Plus, KeyRound, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DashboardProps {
  onImport: () => void;
}

export function Dashboard({ onImport }: DashboardProps) {
  const { wallets, networks, tokens, allBalanceResults, balanceUpdated, balanceLoading, refreshBalances, removeWallet, setCurrentWallet, currentWalletId } = useWalletStore();
  const [showSecrets, setShowSecrets] = useState<string | null>(null);

  const fundedWallets = wallets.filter((w) =>
    (allBalanceResults[w.address] || []).some(
      (r) => r && !r.error && (r.nativeRaw !== "0" || (r.tokens || []).some((t) => t.raw !== "0"))
    )
  ).length;

  if (wallets.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-slate-800 bg-gradient-to-br from-indigo-950/60 to-transparent">
          <CardContent className="p-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">
              Self-custody control center
            </p>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              No wallet data loaded
            </h2>
            <p className="mb-4 max-w-2xl text-sm text-slate-400">
              Import a private key or mnemonic to query live balances across configured EVM and Tron networks.
              All data is fetched directly from RPC endpoints in real time — nothing is mocked, nothing leaves
              this page except JSON-RPC reads.
            </p>
            <Button onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
              <Plus className="mr-1 h-4 w-4" />
              Import a wallet
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Wallets" value="0" note="Import to begin" />
          <StatTile label="Networks" value={String(networks.length)} note="Live endpoints" />
          <StatTile label="Tokens" value={String(tokens.length)} note="Real contracts" />
          <StatTile
            label="Last update"
            value={balanceUpdated ? new Date(balanceUpdated).toLocaleTimeString() : "Never"}
            note="Auto-refresh enabled"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Wallets" value={String(wallets.length)} note={`${fundedWallets} funded`} />
        <StatTile label="Networks" value={String(networks.length)} note="Live endpoints" />
        <StatTile label="Tokens" value={String(tokens.length)} note="Real contracts" />
        <StatTile
          label="Last update"
          value={balanceUpdated ? new Date(balanceUpdated).toLocaleTimeString() : "Never"}
          note={balanceLoading ? "Querying…" : "Auto-refresh"}
        />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-100">Wallet overview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
              disabled={balanceLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
              Refresh all
            </Button>
            <Button size="sm" onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Import
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => {
            const results = allBalanceResults[wallet.address] || [];
            const errors = results.filter((r) => r && r.error).length;
            const funded = results.filter(
              (r) => r && !r.error && (r.nativeRaw !== "0" || (r.tokens || []).some((t) => t.raw !== "0"))
            );
            const summary = funded.length
              ? funded.map((r) => `${r.network.nativeSymbol}: ${r.nativeBalance}`).join(" · ")
              : results.length
                ? `No funds across ${results.length} network${results.length !== 1 ? "s" : ""}`
                : "No data yet";

            return (
              <div key={wallet.address} className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white">
                      {wallet.address.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-100">{wallet.name}</div>
                      <div className="font-mono text-xs text-slate-500">{short(wallet.address)}</div>
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      results.length
                        ? errors === 0
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {results.length ? (errors === 0 ? "Live" : `${errors} issue${errors !== 1 ? "s" : ""}`) : "Pending"}
                  </span>
                </div>
                <p className="mb-3 break-words text-xs leading-relaxed text-slate-500">{summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecrets(wallet.address)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      <KeyRound className="mr-1 h-3 w-3" />
                      Secrets
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentWallet(wallet.address)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {currentWalletId === wallet.address ? (
                        <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-400" />
                      ) : (
                        "Use"
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWallet(wallet.address)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {showSecrets && (
        <SecretsModal address={showSecrets} onClose={() => setShowSecrets(null)} />
      )}
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <div className="font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}

function SecretsModal({ address, onClose }: { address: string; onClose: () => void }) {
  const { wallets } = useWalletStore();
  const wallet = wallets.find((w) => w.address === address);
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">
              Sensitive key material
            </p>
            <h3 className="text-lg font-bold text-slate-100">Wallet secrets</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">×</button>
        </div>
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Anyone with the private key or mnemonic controls the wallet and its funds.</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Private key</label>
            <input
              type="password"
              readOnly
              value={wallet.rawPrivateKey}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-300"
            />
          </div>
          {wallet.mnemonic && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Mnemonic phrase</label>
              <input
                type="password"
                readOnly
                value={wallet.mnemonic}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-300"
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}12:T2ae8,```tsx{path=src/components/Dashboard.tsx}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { RefreshCw, Plus, KeyRound, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DashboardProps {
  onImport: () => void;
}

export function Dashboard({ onImport }: DashboardProps) {
  const { wallets, networks, tokens, allBalanceResults, balanceUpdated, balanceLoading, refreshBalances, removeWallet, setCurrentWallet, currentWalletId } = useWalletStore();
  const [showSecrets, setShowSecrets] = useState<string | null>(null);

  const fundedWallets = wallets.filter((w) =>
    (allBalanceResults[w.address] || []).some(
      (r) => r && !r.error && (r.nativeRaw !== "0" || (r.tokens || []).some((t) => t.raw !== "0"))
    )
  ).length;

  if (wallets.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-slate-800 bg-gradient-to-br from-indigo-950/60 to-transparent">
          <CardContent className="p-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">
              Self-custody control center
            </p>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              No wallet data loaded
            </h2>
            <p className="mb-4 max-w-2xl text-sm text-slate-400">
              Import a private key or mnemonic to query live balances across configured EVM and Tron networks.
              All data is fetched directly from RPC endpoints in real time — nothing is mocked, nothing leaves
              this page except JSON-RPC reads.
            </p>
            <Button onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
              <Plus className="mr-1 h-4 w-4" />
              Import a wallet
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Wallets" value="0" note="Import to begin" />
          <StatTile label="Networks" value={String(networks.length)} note="Live endpoints" />
          <StatTile label="Tokens" value={String(tokens.length)} note="Real contracts" />
          <StatTile
            label="Last update"
            value={balanceUpdated ? new Date(balanceUpdated).toLocaleTimeString() : "Never"}
            note="Auto-refresh enabled"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Wallets" value={String(wallets.length)} note={`${fundedWallets} funded`} />
        <StatTile label="Networks" value={String(networks.length)} note="Live endpoints" />
        <StatTile label="Tokens" value={String(tokens.length)} note="Real contracts" />
        <StatTile
          label="Last update"
          value={balanceUpdated ? new Date(balanceUpdated).toLocaleTimeString() : "Never"}
          note={balanceLoading ? "Querying…" : "Auto-refresh"}
        />
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-100">Wallet overview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
              disabled={balanceLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
              Refresh all
            </Button>
            <Button size="sm" onClick={onImport} className="bg-indigo-600 text-white hover:bg-indigo-500">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Import
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => {
            const results = allBalanceResults[wallet.address] || [];
            const errors = results.filter((r) => r && r.error).length;
            const funded = results.filter(
              (r) => r && !r.error && (r.nativeRaw !== "0" || (r.tokens || []).some((t) => t.raw !== "0"))
            );
            const summary = funded.length
              ? funded.map((r) => `${r.network.nativeSymbol}: ${r.nativeBalance}`).join(" · ")
              : results.length
                ? `No funds across ${results.length} network${results.length !== 1 ? "s" : ""}`
                : "No data yet";

            return (
              <div key={wallet.address} className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white">
                      {wallet.address.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-100">{wallet.name}</div>
                      <div className="font-mono text-xs text-slate-500">{short(wallet.address)}</div>
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      results.length
                        ? errors === 0
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    {results.length ? (errors === 0 ? "Live" : `${errors} issue${errors !== 1 ? "s" : ""}`) : "Pending"}
                  </span>
                </div>
                <p className="mb-3 break-words text-xs leading-relaxed text-slate-500">{summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecrets(wallet.address)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      <KeyRound className="mr-1 h-3 w-3" />
                      Secrets
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentWallet(wallet.address)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      {currentWalletId === wallet.address ? (
                        <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-400" />
                      ) : (
                        "Use"
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWallet(wallet.address)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {showSecrets && (
        <SecretsModal address={showSecrets} onClose={() => setShowSecrets(null)} />
      )}
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <div className="font-mono text-2xl font-bold tracking-tight text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}

function SecretsModal({ address, onClose }: { address: string; onClose: () => void }) {
  const { wallets } = useWalletStore();
  const wallet = wallets.find((w) => w.address === address);
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">
              Sensitive key material
            </p>
            <h3 className="text-lg font-bold text-slate-100">Wallet secrets</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">×</button>
        </div>
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Anyone with the private key or mnemonic controls the wallet and its funds.</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Private key</label>
            <input
              type="password"
              readOnly
              value={wallet.rawPrivateKey}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-300"
            />
          </div>
          {wallet.mnemonic && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Mnemonic phrase</label>
              <input
                type="password"
                readOnly
                value={wallet.mnemonic}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-slate-300"
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
```13:T1981,import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function Balances() {
  const { wallets, allBalanceResults, balanceLoading, balanceUpdated, refreshBalances, activityGate } = useWalletStore();

  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No wallets imported</p>
        <p className="text-sm text-slate-500">Import wallets to query balances across all configured networks.</p>
      </div>
    );
  }

  const all = Object.values(allBalanceResults).flat().filter(Boolean);
  const skipped = all.filter((r) => r.inactive).length;
  const gateNote = activityGate
    ? ` · activity scan on${skipped ? ` · ${skipped} unused pair${skipped !== 1 ? "s" : ""} skipped` : ""}`
    : " · activity scan off";

  const status = balanceLoading
    ? "Querying live RPC endpoints…"
    : balanceUpdated
      ? `Updated ${new Date(balanceUpdated).toLocaleTimeString()}`
      : "Not queried yet";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">All wallets · all networks</h2>
          <p className="text-xs text-slate-500">
            {status} · {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
            {gateNote}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshBalances}
          disabled={balanceLoading}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
          Refresh all
        </Button>
      </div>

      <div className="space-y-4">
        {wallets.map((wallet) => {
          const results = allBalanceResults[wallet.address] || [];
          return (
            <Card key={wallet.address} className="border-slate-800 bg-slate-900">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-100">{wallet.name}</CardTitle>
                <p className="font-mono text-xs text-slate-500">{short(wallet.address, 8, 6)}</p>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.filter(Boolean).map((result) => (
                  <BalanceCard key={result.network.id} result={result} />
                ))}
                {results.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                    No balance data yet — press Refresh to query endpoints.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BalanceCard({ result }: { result: any }) {
  const chainLabel = result.network.chainType === "tron" ? "TRON" : `EVM · chain ${result.network.chainId || "—"}`;

  if (result.error) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
            <span className="text-[11px] text-slate-500">{chainLabel}</span>
          </div>
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            Unavailable
          </span>
        </div>
        <p className="text-xs leading-relaxed text-red-400">{result.error}</p>
      </div>
    );
  }

  if (result.inactive) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
            <span className="text-[11px] text-slate-500">{chainLabel}</span>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            Unused
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-slate-800 py-2">
          <span className="text-xs text-slate-500">Native · {result.network.nativeSymbol}</span>
          <span className="font-mono text-xs font-semibold text-slate-300">{result.nativeBalance}</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">No transactions or balance — token reads skipped.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
          <span className="text-[11px] text-slate-500">{chainLabel}</span>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          Connected
        </span>
      </div>
      <div className="flex items-baseline justify-between border-t border-slate-800 py-2">
        <span className="text-xs text-slate-500">Native · {result.network.nativeSymbol}</span>
        <span className={`font-mono text-xs font-semibold ${result.nativeRaw !== "0" ? "text-slate-100" : "text-slate-400"}`}>
          {result.nativeBalance}
        </span>
      </div>
      {(result.tokens || []).map((token: any) => (
        <div key={token.name} className="flex items-baseline justify-between border-t border-slate-800 py-2">
          <span className="text-xs text-slate-500">{token.name}</span>
          <span className={`font-mono text-xs font-semibold ${token.raw !== "0" ? "text-slate-100" : "text-slate-400"}`}>
            {token.balance}
          </span>
        </div>
      ))}
      {(result.tokens || []).length === 0 && (
        <p className="mt-2 text-[11px] text-slate-500">No tokens configured.</p>
      )}
    </div>
  );
}14:T19ae,```tsx{path=src/components/Balances.tsx}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function Balances() {
  const { wallets, allBalanceResults, balanceLoading, balanceUpdated, refreshBalances, activityGate } = useWalletStore();

  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No wallets imported</p>
        <p className="text-sm text-slate-500">Import wallets to query balances across all configured networks.</p>
      </div>
    );
  }

  const all = Object.values(allBalanceResults).flat().filter(Boolean);
  const skipped = all.filter((r) => r.inactive).length;
  const gateNote = activityGate
    ? ` · activity scan on${skipped ? ` · ${skipped} unused pair${skipped !== 1 ? "s" : ""} skipped` : ""}`
    : " · activity scan off";

  const status = balanceLoading
    ? "Querying live RPC endpoints…"
    : balanceUpdated
      ? `Updated ${new Date(balanceUpdated).toLocaleTimeString()}`
      : "Not queried yet";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">All wallets · all networks</h2>
          <p className="text-xs text-slate-500">
            {status} · {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
            {gateNote}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshBalances}
          disabled={balanceLoading}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
          Refresh all
        </Button>
      </div>

      <div className="space-y-4">
        {wallets.map((wallet) => {
          const results = allBalanceResults[wallet.address] || [];
          return (
            <Card key={wallet.address} className="border-slate-800 bg-slate-900">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-100">{wallet.name}</CardTitle>
                <p className="font-mono text-xs text-slate-500">{short(wallet.address, 8, 6)}</p>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.filter(Boolean).map((result) => (
                  <BalanceCard key={result.network.id} result={result} />
                ))}
                {results.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                    No balance data yet — press Refresh to query endpoints.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BalanceCard({ result }: { result: any }) {
  const chainLabel = result.network.chainType === "tron" ? "TRON" : `EVM · chain ${result.network.chainId || "—"}`;

  if (result.error) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
            <span className="text-[11px] text-slate-500">{chainLabel}</span>
          </div>
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            Unavailable
          </span>
        </div>
        <p className="text-xs leading-relaxed text-red-400">{result.error}</p>
      </div>
    );
  }

  if (result.inactive) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
            <span className="text-[11px] text-slate-500">{chainLabel}</span>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            Unused
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-slate-800 py-2">
          <span className="text-xs text-slate-500">Native · {result.network.nativeSymbol}</span>
          <span className="font-mono text-xs font-semibold text-slate-300">{result.nativeBalance}</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">No transactions or balance — token reads skipped.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{result.network.name}</h4>
          <span className="text-[11px] text-slate-500">{chainLabel}</span>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          Connected
        </span>
      </div>
      <div className="flex items-baseline justify-between border-t border-slate-800 py-2">
        <span className="text-xs text-slate-500">Native · {result.network.nativeSymbol}</span>
        <span className={`font-mono text-xs font-semibold ${result.nativeRaw !== "0" ? "text-slate-100" : "text-slate-400"}`}>
          {result.nativeBalance}
        </span>
      </div>
      {(result.tokens || []).map((token: any) => (
        <div key={token.name} className="flex items-baseline justify-between border-t border-slate-800 py-2">
          <span className="text-xs text-slate-500">{token.name}</span>
          <span className={`font-mono text-xs font-semibold ${token.raw !== "0" ? "text-slate-100" : "text-slate-400"}`}>
            {token.balance}
          </span>
        </div>
      ))}
      {(result.tokens || []).length === 0 && (
        <p className="mt-2 text-[11px] text-slate-500">No tokens configured.</p>
      )}
    </div>
  );
}
```15:T2b9f,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ethers } from "ethers";
import { parseDecimalUnits, isValidAddress, short } from "@/lib/utils";

export function Send() {
  const { wallets, currentWalletId, networks, tokens, alchemyKey, addTransaction, log } = useWalletStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"native" | "token">("native");
  const [networkId, setNetworkId] = useState(networks[0]?.id || "");
  const [tokenId, setTokenId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customToken, setCustomToken] = useState<{ symbol: string; decimals: number } | null>(null);
  const [sending, setSending] = useState(false);

  const wallet = wallets.find((w) => w.address === currentWalletId);
  const network = networks.find((n) => n.id === networkId);
  const selectedToken = tokens.find((t) => t.id === tokenId);

  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No signing wallet selected</p>
        <p className="text-sm text-slate-500">Import a wallet before sending.</p>
      </div>
    );
  }

  const handleLookupToken = async () => {
    if (!network || !customTokenAddress) return;
    try {
      const url = network.alchemySlug && alchemyKey
        ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
        : network.rpc;
      const provider = new ethers.JsonRpcProvider(url);
      const contract = new ethers.Contract(customTokenAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([contract.symbol(), contract.decimals()]);
      setCustomToken({ symbol, decimals: Number(decimals) });
      toast("Token resolved", "ok");
    } catch (error: any) {
      toast(`Lookup failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !network) return;
    if (!isValidAddress(recipient, network.chainType)) {
      toast("Invalid recipient address", "bad");
      return;
    }

    try {
      setSending(true);
      const signer = new ethers.Wallet(wallet.rawPrivateKey);
      const url = network.alchemySlug && alchemyKey
        ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
        : network.rpc;
      const provider = new ethers.JsonRpcProvider(url);
      const connectedSigner = signer.connect(provider);

      let tx;
      if (mode === "native") {
        const value = parseDecimalUnits(amount, 18);
        tx = await connectedSigner.sendTransaction({
          to: recipient,
          value,
        });
      } else {
        const token = selectedToken || (customToken ? { address: customTokenAddress, decimals: customToken.decimals, name: customToken.symbol } : null);
        if (!token) {
          toast("Select a token or look up a custom contract", "bad");
          return;
        }
        const contract = new ethers.Contract(token.address, ERC20_ABI, connectedSigner);
        const value = parseDecimalUnits(amount, token.decimals);
        tx = await contract.transfer(recipient, value);
      }

      addTransaction(wallet.address, {
        hash: tx.hash,
        type: mode === "native" ? "native" : "token",
        token: mode === "token" ? (selectedToken?.name || customToken?.symbol) : null,
        network: network.name,
        to: recipient,
        amount,
        status: "Pending",
        timestamp: Date.now(),
      });

      toast(`Transaction broadcast: ${tx.hash.slice(0, 10)}…`, "ok");
      setRecipient("");
      setAmount("");
    } catch (error: any) {
      toast(`Send failed: ${error?.message || "Unknown error"}`, "bad");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Send</h2>
          <p className="text-xs text-slate-500">
            The private key never leaves this page. Review recipient and amount before signing.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
          <button
            onClick={() => setMode("native")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "native" ? "bg-slate-800 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Native coin
          </button>
          <button
            onClick={() => setMode("token")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "token" ? "bg-slate-800 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Token
          </button>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl border-slate-800 bg-slate-900">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
            <span className="font-semibold">Real transaction</span>
            <span>Confirm dialogs sign and broadcast a real, irreversible on-chain transaction.</span>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network</Label>
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} · {n.nativeSymbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "token" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Saved token</Label>
                  <Select value={tokenId} onValueChange={setTokenId}>
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens
                        .filter((t) => t.networkId === networkId && t.chainType === network?.chainType)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} · {short(t.address, 8, 6)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                    Or look up custom contract
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      placeholder="0x… or T…"
                      className="border-slate-700 bg-slate-900 font-mono text-xs text-slate-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupToken}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Look up
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {customToken
                      ? `${customToken.symbol} · ${customToken.decimals} decimals`
                      : "No custom contract resolved."}
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Recipient address</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={network?.chainType === "tron" ? "T…" : "0x…"}
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Amount</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Asset</Label>
                <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-indigo-400">
                  {mode === "native"
                    ? network?.nativeSymbol || "ETH"
                    : selectedToken?.name || customToken?.symbol || "—"}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {sending ? "Broadcasting…" : "Sign & send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];16:T2bc8,```tsx{path=src/components/Send.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ethers } from "ethers";
import { parseDecimalUnits, isValidAddress, short } from "@/lib/utils";

export function Send() {
  const { wallets, currentWalletId, networks, tokens, alchemyKey, addTransaction, log } = useWalletStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"native" | "token">("native");
  const [networkId, setNetworkId] = useState(networks[0]?.id || "");
  const [tokenId, setTokenId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customToken, setCustomToken] = useState<{ symbol: string; decimals: number } | null>(null);
  const [sending, setSending] = useState(false);

  const wallet = wallets.find((w) => w.address === currentWalletId);
  const network = networks.find((n) => n.id === networkId);
  const selectedToken = tokens.find((t) => t.id === tokenId);

  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No signing wallet selected</p>
        <p className="text-sm text-slate-500">Import a wallet before sending.</p>
      </div>
    );
  }

  const handleLookupToken = async () => {
    if (!network || !customTokenAddress) return;
    try {
      const url = network.alchemySlug && alchemyKey
        ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
        : network.rpc;
      const provider = new ethers.JsonRpcProvider(url);
      const contract = new ethers.Contract(customTokenAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([contract.symbol(), contract.decimals()]);
      setCustomToken({ symbol, decimals: Number(decimals) });
      toast("Token resolved", "ok");
    } catch (error: any) {
      toast(`Lookup failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !network) return;
    if (!isValidAddress(recipient, network.chainType)) {
      toast("Invalid recipient address", "bad");
      return;
    }

    try {
      setSending(true);
      const signer = new ethers.Wallet(wallet.rawPrivateKey);
      const url = network.alchemySlug && alchemyKey
        ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
        : network.rpc;
      const provider = new ethers.JsonRpcProvider(url);
      const connectedSigner = signer.connect(provider);

      let tx;
      if (mode === "native") {
        const value = parseDecimalUnits(amount, 18);
        tx = await connectedSigner.sendTransaction({
          to: recipient,
          value,
        });
      } else {
        const token = selectedToken || (customToken ? { address: customTokenAddress, decimals: customToken.decimals, name: customToken.symbol } : null);
        if (!token) {
          toast("Select a token or look up a custom contract", "bad");
          return;
        }
        const contract = new ethers.Contract(token.address, ERC20_ABI, connectedSigner);
        const value = parseDecimalUnits(amount, token.decimals);
        tx = await contract.transfer(recipient, value);
      }

      addTransaction(wallet.address, {
        hash: tx.hash,
        type: mode === "native" ? "native" : "token",
        token: mode === "token" ? (selectedToken?.name || customToken?.symbol) : null,
        network: network.name,
        to: recipient,
        amount,
        status: "Pending",
        timestamp: Date.now(),
      });

      toast(`Transaction broadcast: ${tx.hash.slice(0, 10)}…`, "ok");
      setRecipient("");
      setAmount("");
    } catch (error: any) {
      toast(`Send failed: ${error?.message || "Unknown error"}`, "bad");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Send</h2>
          <p className="text-xs text-slate-500">
            The private key never leaves this page. Review recipient and amount before signing.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
          <button
            onClick={() => setMode("native")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "native" ? "bg-slate-800 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Native coin
          </button>
          <button
            onClick={() => setMode("token")}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === "token" ? "bg-slate-800 text-slate-100 shadow" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Token
          </button>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl border-slate-800 bg-slate-900">
        <CardContent className="p-6">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
            <span className="font-semibold">Real transaction</span>
            <span>Confirm dialogs sign and broadcast a real, irreversible on-chain transaction.</span>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network</Label>
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} · {n.nativeSymbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "token" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Saved token</Label>
                  <Select value={tokenId} onValueChange={setTokenId}>
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens
                        .filter((t) => t.networkId === networkId && t.chainType === network?.chainType)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} · {short(t.address, 8, 6)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                    Or look up custom contract
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      placeholder="0x… or T…"
                      className="border-slate-700 bg-slate-900 font-mono text-xs text-slate-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupToken}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Look up
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {customToken
                      ? `${customToken.symbol} · ${customToken.decimals} decimals`
                      : "No custom contract resolved."}
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Recipient address</Label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={network?.chainType === "tron" ? "T…" : "0x…"}
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Amount</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Asset</Label>
                <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-indigo-400">
                  {mode === "native"
                    ? network?.nativeSymbol || "ETH"
                    : selectedToken?.name || customToken?.symbol || "—"}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {sending ? "Broadcasting…" : "Sign & send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];
```17:T2de1,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ethers } from "ethers";
import { parseDecimalUnits, short } from "@/lib/utils";

export function Approvals() {
  const { wallets, currentWalletId, networks, tokens, alchemyKey, addTransaction, log } = useWalletStore();
  const { toast } = useToast();
  const [networkId, setNetworkId] = useState(networks.find((n) => n.chainType === "evm")?.id || "");
  const [tokenId, setTokenId] = useState("");
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [customDecimals, setCustomDecimals] = useState("18");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customToken, setCustomToken] = useState<{ symbol: string; decimals: number } | null>(null);
  const [allowance, setAllowance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wallet = wallets.find((w) => w.address === currentWalletId);
  const network = networks.find((n) => n.id === networkId);
  const selectedToken = tokens.find((t) => t.id === tokenId);

  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No signing wallet selected</p>
        <p className="text-sm text-slate-500">Import a wallet before managing ERC-20 approvals.</p>
      </div>
    );
  }

  const getProvider = () => {
    if (!network) return null;
    const url = network.alchemySlug && alchemyKey
      ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
      : network.rpc;
    return new ethers.JsonRpcProvider(url);
  };

  const getTokenInfo = () => {
    if (selectedToken) return { address: selectedToken.address, decimals: selectedToken.decimals, symbol: selectedToken.name };
    if (customToken) return { address: customAddress, decimals: customToken.decimals, symbol: customToken.symbol };
    return null;
  };

  const handleLookup = async () => {
    const provider = getProvider();
    if (!provider || !customAddress) return;
    try {
      const contract = new ethers.Contract(customAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([contract.symbol(), contract.decimals()]);
      setCustomToken({ symbol, decimals: Number(decimals) });
      toast("Token resolved", "ok");
    } catch (error: any) {
      toast(`Lookup failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleCheckAllowance = async () => {
    const provider = getProvider();
    const token = getTokenInfo();
    if (!provider || !token || !spender) return;
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const raw = await contract.allowance(wallet.address, spender);
      setAllowance(ethers.formatUnits(raw, token.decimals));
      toast("Allowance checked", "ok");
    } catch (error: any) {
      toast(`Check failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleApprove = async (revoke: boolean) => {
    const provider = getProvider();
    const token = getTokenInfo();
    if (!provider || !token || !spender) {
      toast("Select a token and spender", "bad");
      return;
    }
    try {
      setBusy(true);
      const signer = new ethers.Wallet(wallet.rawPrivateKey).connect(provider);
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const value = revoke
        ? 0n
        : unlimited
          ? (1n << 256n) - 1n
          : parseDecimalUnits(amount, token.decimals);
      const tx = await contract.approve(spender, value);
      addTransaction(wallet.address, {
        hash: tx.hash,
        type: "approval",
        token: token.symbol,
        network: network?.name || "",
        to: spender,
        amount: revoke ? "0" : amount || "unlimited",
        status: "Pending",
        timestamp: Date.now(),
      });
      toast(`Approval broadcast: ${tx.hash.slice(0, 10)}…`, "ok");
      setAllowance(null);
    } catch (error: any) {
      toast(`Approval failed: ${error?.message || "Unknown error"}`, "bad");
    } finally {
      setBusy(false);
    }
  };

  const evmNetworks = networks.filter((n) => n.chainType === "evm");
  const evmTokens = tokens.filter((t) => t.chainType === "evm" && t.networkId === networkId);

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-2xl items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
        <span className="font-semibold">Risk</span>
        <span>Unlimited approvals let a spender move any amount of a token at any time. Check the allowance and revoke what you no longer need.</span>
      </div>

      <Card className="mx-auto max-w-2xl border-slate-800 bg-slate-900">
        <CardContent className="p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">EVM / ERC-20 only</p>
          <h3 className="mb-4 text-lg font-bold text-slate-100">Token approvals</h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network</Label>
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {evmNetworks.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Saved token</Label>
              <Select value={tokenId} onValueChange={setTokenId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent>
                  {evmTokens.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {short(t.address, 8, 6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">Or use custom ERC-20</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="0x…"
                  className="border-slate-700 bg-slate-900 font-mono text-xs text-slate-200"
                />
                <Input
                  value={customDecimals}
                  onChange={(e) => setCustomDecimals(e.target.value)}
                  type="number"
                  min="0"
                  max="255"
                  placeholder="Decimals"
                  className="border-slate-700 bg-slate-900 text-xs text-slate-200"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  placeholder="Symbol (optional)"
                  className="border-slate-700 bg-slate-900 text-xs text-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLookup}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Look up
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {customToken ? `${customToken.symbol} · ${customToken.decimals} decimals` : "No custom contract resolved."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Spender address</Label>
              <Input
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                placeholder="0x contract or address…"
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCheckAllowance}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Check current allowance
            </Button>

            {allowance !== null && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                Current allowance: <span className="font-mono font-semibold">{allowance}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Approval amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800"
              />
              Approve unlimited <span className="text-slate-500">(high risk)</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => handleApprove(false)}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Approve amount
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => handleApprove(true)}
                className="bg-red-600 text-white hover:bg-red-500"
              >
                Revoke permission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];18:T2e0f,```tsx{path=src/components/Approvals.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { ethers } from "ethers";
import { parseDecimalUnits, short } from "@/lib/utils";

export function Approvals() {
  const { wallets, currentWalletId, networks, tokens, alchemyKey, addTransaction, log } = useWalletStore();
  const { toast } = useToast();
  const [networkId, setNetworkId] = useState(networks.find((n) => n.chainType === "evm")?.id || "");
  const [tokenId, setTokenId] = useState("");
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [customDecimals, setCustomDecimals] = useState("18");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customToken, setCustomToken] = useState<{ symbol: string; decimals: number } | null>(null);
  const [allowance, setAllowance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wallet = wallets.find((w) => w.address === currentWalletId);
  const network = networks.find((n) => n.id === networkId);
  const selectedToken = tokens.find((t) => t.id === tokenId);

  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No signing wallet selected</p>
        <p className="text-sm text-slate-500">Import a wallet before managing ERC-20 approvals.</p>
      </div>
    );
  }

  const getProvider = () => {
    if (!network) return null;
    const url = network.alchemySlug && alchemyKey
      ? `https://${network.alchemySlug}.g.alchemy.com/v2/${alchemyKey}`
      : network.rpc;
    return new ethers.JsonRpcProvider(url);
  };

  const getTokenInfo = () => {
    if (selectedToken) return { address: selectedToken.address, decimals: selectedToken.decimals, symbol: selectedToken.name };
    if (customToken) return { address: customAddress, decimals: customToken.decimals, symbol: customToken.symbol };
    return null;
  };

  const handleLookup = async () => {
    const provider = getProvider();
    if (!provider || !customAddress) return;
    try {
      const contract = new ethers.Contract(customAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([contract.symbol(), contract.decimals()]);
      setCustomToken({ symbol, decimals: Number(decimals) });
      toast("Token resolved", "ok");
    } catch (error: any) {
      toast(`Lookup failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleCheckAllowance = async () => {
    const provider = getProvider();
    const token = getTokenInfo();
    if (!provider || !token || !spender) return;
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const raw = await contract.allowance(wallet.address, spender);
      setAllowance(ethers.formatUnits(raw, token.decimals));
      toast("Allowance checked", "ok");
    } catch (error: any) {
      toast(`Check failed: ${error?.message || "Unknown error"}`, "bad");
    }
  };

  const handleApprove = async (revoke: boolean) => {
    const provider = getProvider();
    const token = getTokenInfo();
    if (!provider || !token || !spender) {
      toast("Select a token and spender", "bad");
      return;
    }
    try {
      setBusy(true);
      const signer = new ethers.Wallet(wallet.rawPrivateKey).connect(provider);
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const value = revoke
        ? 0n
        : unlimited
          ? (1n << 256n) - 1n
          : parseDecimalUnits(amount, token.decimals);
      const tx = await contract.approve(spender, value);
      addTransaction(wallet.address, {
        hash: tx.hash,
        type: "approval",
        token: token.symbol,
        network: network?.name || "",
        to: spender,
        amount: revoke ? "0" : amount || "unlimited",
        status: "Pending",
        timestamp: Date.now(),
      });
      toast(`Approval broadcast: ${tx.hash.slice(0, 10)}…`, "ok");
      setAllowance(null);
    } catch (error: any) {
      toast(`Approval failed: ${error?.message || "Unknown error"}`, "bad");
    } finally {
      setBusy(false);
    }
  };

  const evmNetworks = networks.filter((n) => n.chainType === "evm");
  const evmTokens = tokens.filter((t) => t.chainType === "evm" && t.networkId === networkId);

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-2xl items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
        <span className="font-semibold">Risk</span>
        <span>Unlimited approvals let a spender move any amount of a token at any time. Check the allowance and revoke what you no longer need.</span>
      </div>

      <Card className="mx-auto max-w-2xl border-slate-800 bg-slate-900">
        <CardContent className="p-6">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">EVM / ERC-20 only</p>
          <h3 className="mb-4 text-lg font-bold text-slate-100">Token approvals</h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network</Label>
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {evmNetworks.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Saved token</Label>
              <Select value={tokenId} onValueChange={setTokenId}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent>
                  {evmTokens.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {short(t.address, 8, 6)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">Or use custom ERC-20</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="0x…"
                  className="border-slate-700 bg-slate-900 font-mono text-xs text-slate-200"
                />
                <Input
                  value={customDecimals}
                  onChange={(e) => setCustomDecimals(e.target.value)}
                  type="number"
                  min="0"
                  max="255"
                  placeholder="Decimals"
                  className="border-slate-700 bg-slate-900 text-xs text-slate-200"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  placeholder="Symbol (optional)"
                  className="border-slate-700 bg-slate-900 text-xs text-slate-200"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLookup}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Look up
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {customToken ? `${customToken.symbol} · ${customToken.decimals} decimals` : "No custom contract resolved."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Spender address</Label>
              <Input
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                placeholder="0x contract or address…"
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCheckAllowance}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Check current allowance
            </Button>

            {allowance !== null && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                Current allowance: <span className="font-mono font-semibold">{allowance}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Approval amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800"
              />
              Approve unlimited <span className="text-slate-500">(high risk)</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={() => handleApprove(false)}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Approve amount
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => handleApprove(true)}
                className="bg-red-600 text-white hover:bg-red-500"
              >
                Revoke permission
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];
```19:T482b,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { Trash2, Plus, RotateCcw } from "lucide-react";

export function Networks() {
  const { networks, tokens, removeNetwork, removeToken, resetNetworks, alchemyKey, setAlchemyKey, tronGridKey, setTronGridKey, activityGate, setActivityGate } = useWalletStore();
  const { toast } = useToast();
  const [showNetworkForm, setShowNetworkForm] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [networkForm, setNetworkForm] = useState({
    name: "",
    id: "",
    rpc: "",
    symbol: "ETH",
    type: "evm",
    chainId: "1",
    explorer: "",
  });
  const [tokenForm, setTokenForm] = useState({
    networkId: networks[0]?.id || "",
    name: "",
    address: "",
    decimals: "18",
  });

  const handleAddNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!networkForm.name || !networkForm.id || !networkForm.rpc) {
      toast("Fill in name, ID, and RPC URL", "bad");
      return;
    }
    addNetwork({
      id: networkForm.id,
      name: networkForm.name,
      chainType: networkForm.type as "evm" | "tron",
      rpc: networkForm.rpc,
      nativeSymbol: networkForm.symbol,
      chainId: networkForm.type === "evm" ? Number(networkForm.chainId) : undefined,
      explorerUrl: networkForm.explorer || undefined,
    });
    toast("Network added", "ok");
    setShowNetworkForm(false);
    setNetworkForm({ name: "", id: "", rpc: "", symbol: "ETH", type: "evm", chainId: "1", explorer: "" });
  };

  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenForm.name || !tokenForm.address) {
      toast("Fill in token name and address", "bad");
      return;
    }
    const network = networks.find((n) => n.id === tokenForm.networkId);
    if (!network) {
      toast("Select a network", "bad");
      return;
    }
    addToken({
      id: `${tokenForm.networkId}-${tokenForm.name.toLowerCase()}`,
      networkId: tokenForm.networkId,
      name: tokenForm.name,
      address: tokenForm.address,
      decimals: Number(tokenForm.decimals),
      chainType: network.chainType,
    });
    toast("Token added", "ok");
    setShowTokenForm(false);
    setTokenForm({ networkId: networks[0]?.id || "", name: "", address: "", decimals: "18" });
  };

  const maskKey = (url: string) => {
    if (alchemyKey) return url.replace(new RegExp(alchemyKey, "g"), "•••");
    return url;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Networks &amp; contracts</h2>
          <p className="text-xs text-slate-500">
            {networks.length} networks · {tokens.length} tokens configured
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetNetworks}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset presets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenForm(!showTokenForm)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Token
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNetworkForm(!showNetworkForm)}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Network
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={activityGate}
            onChange={(e) => setActivityGate(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800"
          />
          <span>
            Activity-first scanning
            <span className="block text-[10px] text-slate-500">Skip token reads on addresses with no on-chain activity</span>
          </span>
        </label>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400">Alchemy API key</Label>
          <Input
            type="password"
            value={alchemyKey}
            onChange={(e) => setAlchemyKey(e.target.value)}
            placeholder="Paste your Alchemy key"
            className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400">TronGrid API key</Label>
          <Input
            type="password"
            value={tronGridKey}
            onChange={(e) => setTronGridKey(e.target.value)}
            placeholder="Paste your TronGrid key"
            className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
          />
        </div>
      </div>

      {showNetworkForm && (
        <Card className="mb-4 border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <form onSubmit={handleAddNetwork} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Name</Label>
                  <Input
                    value={networkForm.name}
                    onChange={(e) => setNetworkForm({ ...networkForm, name: e.target.value })}
                    placeholder="My EVM network"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Network ID / slug</Label>
                  <Input
                    value={networkForm.id}
                    onChange={(e) => setNetworkForm({ ...networkForm, id: e.target.value })}
                    placeholder="my-network"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">RPC URL</Label>
                <Input
                  type="url"
                  value={networkForm.rpc}
                  onChange={(e) => setNetworkForm({ ...networkForm, rpc: e.target.value })}
                  placeholder="https://..."
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Native symbol</Label>
                  <Input
                    value={networkForm.symbol}
                    onChange={(e) => setNetworkForm({ ...networkForm, symbol: e.target.value })}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Chain type</Label>
                  <select
                    value={networkForm.type}
                    onChange={(e) => setNetworkForm({ ...networkForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="evm">EVM</option>
                    <option value="tron">Tron</option>
                  </select>
                </div>
              </div>
              {networkForm.type === "evm" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400">Chain ID</Label>
                    <Input
                      type="number"
                      min="1"
                      value={networkForm.chainId}
                      onChange={(e) => setNetworkForm({ ...networkForm, chainId: e.target.value })}
                      className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400">Explorer tx URL (optional)</Label>
                    <Input
                      type="url"
                      value={networkForm.explorer}
                      onChange={(e) => setNetworkForm({ ...networkForm, explorer: e.target.value })}
                      placeholder="https://etherscan.io/tx/"
                      className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNetworkForm(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
                  Test &amp; add network
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showTokenForm && (
        <Card className="mb-4 border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <form onSubmit={handleAddToken} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Network</Label>
                <select
                  value={tokenForm.networkId}
                  onChange={(e) => setTokenForm({ ...tokenForm, networkId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
                >
                  {networks.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Symbol / name</Label>
                  <Input
                    value={tokenForm.name}
                    onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                    placeholder="USDC"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Decimals</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={tokenForm.decimals}
                    onChange={(e) => setTokenForm({ ...tokenForm, decimals: e.target.value })}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Contract address</Label>
                <Input
                  value={tokenForm.address}
                  onChange={(e) => setTokenForm({ ...tokenForm, address: e.target.value })}
                  placeholder="0x… or T…"
                  className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTokenForm(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
                  Test &amp; add token
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 border-slate-800 bg-slate-900">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-100">RPC endpoints</CardTitle>
          <p className="text-xs text-slate-500">Alchemy keys route supported chains through Alchemy; others use public endpoints.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Network</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">RPC endpoint</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Native</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {networks.map((n) => (
                <tr key={n.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">{n.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {n.chainType === "tron" ? "TRON" : `EVM · chain ${n.chainId || "custom"}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{maskKey(n.rpc)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {n.nativeSymbol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNetwork(n.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <div>
            <CardTitle className="text-sm font-bold text-slate-100">Token contracts</CardTitle>
            <p className="text-xs text-slate-500">Balances and sends use only these contract/network pairs.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenForm(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add token
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Token</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Contract</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Decimals</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.networkId}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.address}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.decimals}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeToken(t.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}1a:T4858,```tsx{path=src/components/Networks.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { Trash2, Plus, RotateCcw } from "lucide-react";

export function Networks() {
  const { networks, tokens, removeNetwork, removeToken, resetNetworks, alchemyKey, setAlchemyKey, tronGridKey, setTronGridKey, activityGate, setActivityGate } = useWalletStore();
  const { toast } = useToast();
  const [showNetworkForm, setShowNetworkForm] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [networkForm, setNetworkForm] = useState({
    name: "",
    id: "",
    rpc: "",
    symbol: "ETH",
    type: "evm",
    chainId: "1",
    explorer: "",
  });
  const [tokenForm, setTokenForm] = useState({
    networkId: networks[0]?.id || "",
    name: "",
    address: "",
    decimals: "18",
  });

  const handleAddNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!networkForm.name || !networkForm.id || !networkForm.rpc) {
      toast("Fill in name, ID, and RPC URL", "bad");
      return;
    }
    addNetwork({
      id: networkForm.id,
      name: networkForm.name,
      chainType: networkForm.type as "evm" | "tron",
      rpc: networkForm.rpc,
      nativeSymbol: networkForm.symbol,
      chainId: networkForm.type === "evm" ? Number(networkForm.chainId) : undefined,
      explorerUrl: networkForm.explorer || undefined,
    });
    toast("Network added", "ok");
    setShowNetworkForm(false);
    setNetworkForm({ name: "", id: "", rpc: "", symbol: "ETH", type: "evm", chainId: "1", explorer: "" });
  };

  const handleAddToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenForm.name || !tokenForm.address) {
      toast("Fill in token name and address", "bad");
      return;
    }
    const network = networks.find((n) => n.id === tokenForm.networkId);
    if (!network) {
      toast("Select a network", "bad");
      return;
    }
    addToken({
      id: `${tokenForm.networkId}-${tokenForm.name.toLowerCase()}`,
      networkId: tokenForm.networkId,
      name: tokenForm.name,
      address: tokenForm.address,
      decimals: Number(tokenForm.decimals),
      chainType: network.chainType,
    });
    toast("Token added", "ok");
    setShowTokenForm(false);
    setTokenForm({ networkId: networks[0]?.id || "", name: "", address: "", decimals: "18" });
  };

  const maskKey = (url: string) => {
    if (alchemyKey) return url.replace(new RegExp(alchemyKey, "g"), "•••");
    return url;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Networks &amp; contracts</h2>
          <p className="text-xs text-slate-500">
            {networks.length} networks · {tokens.length} tokens configured
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetNetworks}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset presets
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenForm(!showTokenForm)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Token
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNetworkForm(!showNetworkForm)}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Network
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={activityGate}
            onChange={(e) => setActivityGate(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800"
          />
          <span>
            Activity-first scanning
            <span className="block text-[10px] text-slate-500">Skip token reads on addresses with no on-chain activity</span>
          </span>
        </label>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400">Alchemy API key</Label>
          <Input
            type="password"
            value={alchemyKey}
            onChange={(e) => setAlchemyKey(e.target.value)}
            placeholder="Paste your Alchemy key"
            className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400">TronGrid API key</Label>
          <Input
            type="password"
            value={tronGridKey}
            onChange={(e) => setTronGridKey(e.target.value)}
            placeholder="Paste your TronGrid key"
            className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
          />
        </div>
      </div>

      {showNetworkForm && (
        <Card className="mb-4 border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <form onSubmit={handleAddNetwork} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Name</Label>
                  <Input
                    value={networkForm.name}
                    onChange={(e) => setNetworkForm({ ...networkForm, name: e.target.value })}
                    placeholder="My EVM network"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Network ID / slug</Label>
                  <Input
                    value={networkForm.id}
                    onChange={(e) => setNetworkForm({ ...networkForm, id: e.target.value })}
                    placeholder="my-network"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">RPC URL</Label>
                <Input
                  type="url"
                  value={networkForm.rpc}
                  onChange={(e) => setNetworkForm({ ...networkForm, rpc: e.target.value })}
                  placeholder="https://..."
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Native symbol</Label>
                  <Input
                    value={networkForm.symbol}
                    onChange={(e) => setNetworkForm({ ...networkForm, symbol: e.target.value })}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Chain type</Label>
                  <select
                    value={networkForm.type}
                    onChange={(e) => setNetworkForm({ ...networkForm, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="evm">EVM</option>
                    <option value="tron">Tron</option>
                  </select>
                </div>
              </div>
              {networkForm.type === "evm" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400">Chain ID</Label>
                    <Input
                      type="number"
                      min="1"
                      value={networkForm.chainId}
                      onChange={(e) => setNetworkForm({ ...networkForm, chainId: e.target.value })}
                      className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400">Explorer tx URL (optional)</Label>
                    <Input
                      type="url"
                      value={networkForm.explorer}
                      onChange={(e) => setNetworkForm({ ...networkForm, explorer: e.target.value })}
                      placeholder="https://etherscan.io/tx/"
                      className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNetworkForm(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
                  Test &amp; add network
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showTokenForm && (
        <Card className="mb-4 border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <form onSubmit={handleAddToken} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Network</Label>
                <select
                  value={tokenForm.networkId}
                  onChange={(e) => setTokenForm({ ...tokenForm, networkId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
                >
                  {networks.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Symbol / name</Label>
                  <Input
                    value={tokenForm.name}
                    onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                    placeholder="USDC"
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400">Decimals</Label>
                  <Input
                    type="number"
                    min="0"
                    max="255"
                    value={tokenForm.decimals}
                    onChange={(e) => setTokenForm({ ...tokenForm, decimals: e.target.value })}
                    className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">Contract address</Label>
                <Input
                  value={tokenForm.address}
                  onChange={(e) => setTokenForm({ ...tokenForm, address: e.target.value })}
                  placeholder="0x… or T…"
                  className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTokenForm(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
                  Test &amp; add token
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 border-slate-800 bg-slate-900">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-100">RPC endpoints</CardTitle>
          <p className="text-xs text-slate-500">Alchemy keys route supported chains through Alchemy; others use public endpoints.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Network</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">RPC endpoint</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Native</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {networks.map((n) => (
                <tr key={n.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">{n.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {n.chainType === "tron" ? "TRON" : `EVM · chain ${n.chainId || "custom"}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{maskKey(n.rpc)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {n.nativeSymbol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNetwork(n.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <div>
            <CardTitle className="text-sm font-bold text-slate-100">Token contracts</CardTitle>
            <p className="text-xs text-slate-500">Balances and sends use only these contract/network pairs.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenForm(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add token
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Token</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Contract</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Decimals</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.networkId}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.address}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{t.decimals}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeToken(t.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```1b:T1aca,import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { Trash2, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/lib/toast";

export function History() {
  const { wallets, history, allHistory, clearHistory, networks } = useWalletStore();
  const { toast } = useToast();

  if (Object.keys(wallets).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No wallets imported</p>
        <p className="text-sm text-slate-500">Import wallets to see transaction history.</p>
      </div>
    );
  }

  const allTransactions = () => {
    const all: any[] = [];
    const push = (source: any) => {
      Object.entries(source || {}).forEach(([address, txs]) => {
        (Array.isArray(txs) ? txs : []).forEach((tx: any) => {
          all.push({ ...tx, walletAddress: address });
        });
      });
    };
    push(history);
    push(allHistory);
    all.sort((a, b) => b.timestamp - a.timestamp);
    const seen = new Set();
    return all.filter((tx) => {
      const key = `${tx.hash}-${tx.network}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const rows = allTransactions().slice(0, 100);

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash)
      .then(() => toast("Hash copied", "ok"))
      .catch(() => toast("Clipboard access denied", "bad"));
  };

  const chipFor = (tx: any) => {
    if (tx.status === "Success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (tx.status === "Failed") return "border-red-500/30 bg-red-500/10 text-red-400";
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Transaction history</h2>
          <p className="text-xs text-slate-500">Combined local records and live chain data.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistory}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Clear all history
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Time</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Wallet</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Network</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Recipient</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => {
                  const network = networks.find((n) => n.name === tx.network || n.id === tx.network);
                  const explorer = network?.explorerUrl ? `${network.explorerUrl}${encodeURIComponent(tx.hash)}` : null;
                  return (
                    <tr key={`${tx.hash}-${tx.network}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {short(tx.walletAddress)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {tx.type}
                        {tx.token ? ` · ${tx.token}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{tx.network}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500" title={tx.to}>
                        {short(tx.to)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{tx.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipFor(tx)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {explorer ? (
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Explorer
                          </a>
                        ) : (
                          <button
                            onClick={() => copyHash(tx.hash)}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                          >
                            <Copy className="h-3 w-3" />
                            Copy hash
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="mb-1 text-sm font-semibold text-slate-200">No transactions yet</p>
              <p className="text-sm text-slate-500">Use a send form or wait for auto-fetch.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}1c:T1af6,```tsx{path=src/components/History.tsx}
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { short } from "@/lib/utils";
import { Trash2, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/lib/toast";

export function History() {
  const { wallets, history, allHistory, clearHistory, networks } = useWalletStore();
  const { toast } = useToast();

  if (Object.keys(wallets).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
        <p className="mb-1 text-sm font-semibold text-slate-200">No wallets imported</p>
        <p className="text-sm text-slate-500">Import wallets to see transaction history.</p>
      </div>
    );
  }

  const allTransactions = () => {
    const all: any[] = [];
    const push = (source: any) => {
      Object.entries(source || {}).forEach(([address, txs]) => {
        (Array.isArray(txs) ? txs : []).forEach((tx: any) => {
          all.push({ ...tx, walletAddress: address });
        });
      });
    };
    push(history);
    push(allHistory);
    all.sort((a, b) => b.timestamp - a.timestamp);
    const seen = new Set();
    return all.filter((tx) => {
      const key = `${tx.hash}-${tx.network}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const rows = allTransactions().slice(0, 100);

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash)
      .then(() => toast("Hash copied", "ok"))
      .catch(() => toast("Clipboard access denied", "bad"));
  };

  const chipFor = (tx: any) => {
    if (tx.status === "Success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (tx.status === "Failed") return "border-red-500/30 bg-red-500/10 text-red-400";
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Transaction history</h2>
          <p className="text-xs text-slate-500">Combined local records and live chain data.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistory}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Clear all history
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="overflow-x-auto p-0">
          {rows.length > 0 ? (
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Time</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Wallet</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Network</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Recipient</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tx) => {
                  const network = networks.find((n) => n.name === tx.network || n.id === tx.network);
                  const explorer = network?.explorerUrl ? `${network.explorerUrl}${encodeURIComponent(tx.hash)}` : null;
                  return (
                    <tr key={`${tx.hash}-${tx.network}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {short(tx.walletAddress)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {tx.type}
                        {tx.token ? ` · ${tx.token}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{tx.network}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500" title={tx.to}>
                        {short(tx.to)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{tx.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipFor(tx)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {explorer ? (
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Explorer
                          </a>
                        ) : (
                          <button
                            onClick={() => copyHash(tx.hash)}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                          >
                            <Copy className="h-3 w-3" />
                            Copy hash
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="mb-1 text-sm font-semibold text-slate-200">No transactions yet</p>
              <p className="text-sm text-slate-500">Use a send form or wait for auto-fetch.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```1d:T6e6,import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { Trash2 } from "lucide-react";

export function Activity() {
  const { logs, clearLog } = useWalletStore();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Activity log</h2>
          <p className="text-xs text-slate-500">Local actions and broadcast events. Nothing is fabricated.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearLog}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Clear log
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-0">
          <div className="max-h-[560px] min-h-[320px] overflow-auto p-4 font-mono text-xs leading-relaxed">
            {logs.length > 0 ? (
              <div className="space-y-1">
                {logs.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 text-slate-600">[{entry.at}]</span>
                    <span className="break-words text-slate-400">{entry.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No activity recorded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}1e:T713,```tsx{path=src/components/Activity.tsx}
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/lib/store";
import { Trash2 } from "lucide-react";

export function Activity() {
  const { logs, clearLog } = useWalletStore();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Activity log</h2>
          <p className="text-xs text-slate-500">Local actions and broadcast events. Nothing is fabricated.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearLog}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Clear log
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-0">
          <div className="max-h-[560px] min-h-[320px] overflow-auto p-4 font-mono text-xs leading-relaxed">
            {logs.length > 0 ? (
              <div className="space-y-1">
                {logs.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 text-slate-600">[{entry.at}]</span>
                    <span className="break-words text-slate-400">{entry.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                No activity recorded yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```1f:T1925,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { walletFromSecret } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { addWallets, nextWalletNum } = useWalletStore();
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [accounts, setAccounts] = useState("1");
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = secret
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast("Enter a private key or mnemonic", "bad");
      return;
    }

    setImporting(true);
    try {
      const numAccounts = Math.min(Math.max(Number(accounts) || 1, 1), 50);
      const newWallets: any[] = [];

      for (const line of lines) {
        const isPhrase = line.split(/\s+/).length > 1;
        if (isPhrase) {
          for (let i = 0; i < numAccounts; i++) {
            try {
              const wallet = walletFromSecret(line, i, nextWalletNum + newWallets.length);
              newWallets.push(wallet);
            } catch (error: any) {
              toast(`Failed to derive account ${i + 1}: ${error?.message || "Invalid mnemonic"}`, "bad");
            }
          }
        } else {
          try {
            const wallet = walletFromSecret(line, 0, nextWalletNum + newWallets.length);
            newWallets.push(wallet);
          } catch (error: any) {
            toast(`Invalid private key: ${error?.message || "Unknown error"}`, "bad");
          }
        }
      }

      if (newWallets.length > 0) {
        addWallets(newWallets);
        toast(`Imported ${newWallets.length} wallet(s)`, "ok");
        setSecret("");
        setAccounts("1");
        onClose();
      } else {
        toast("No valid wallets found", "bad");
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Key material</p>
            <h3 className="text-lg font-bold text-slate-100">Import wallet(s)</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="block">Security warning</strong>
            Use this only on a trusted local copy. Keys are stored unencrypted in this browser's local storage.
          </span>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">
              Private keys or mnemonic phrases
              <span className="ml-1 text-[10px] text-slate-500">(one per line, comma or semicolon separated)</span>
            </Label>
            <Textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              rows={5}
              placeholder={"0x… private key\n12 or 24 word mnemonic phrase"}
              className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Accounts per mnemonic</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Import from file</Label>
              <Input
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setSecret(String(reader.result || ""));
                    reader.readAsText(file);
                  }
                }}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200 file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-xs file:text-slate-200"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Each key or phrase becomes a wallet; mnemonics derive the requested accounts on{" "}
            <span className="font-mono">m/44'/60'/0'/0/i</span>. Duplicates are skipped.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importing}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {importing ? "Importing…" : "Import wallet(s)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}20:T1956,```tsx{path=src/components/ImportDialog.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { walletFromSecret } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const { addWallets, nextWalletNum } = useWalletStore();
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [accounts, setAccounts] = useState("1");
  const [importing, setImporting] = useState(false);

  if (!open) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = secret
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast("Enter a private key or mnemonic", "bad");
      return;
    }

    setImporting(true);
    try {
      const numAccounts = Math.min(Math.max(Number(accounts) || 1, 1), 50);
      const newWallets: any[] = [];

      for (const line of lines) {
        const isPhrase = line.split(/\s+/).length > 1;
        if (isPhrase) {
          for (let i = 0; i < numAccounts; i++) {
            try {
              const wallet = walletFromSecret(line, i, nextWalletNum + newWallets.length);
              newWallets.push(wallet);
            } catch (error: any) {
              toast(`Failed to derive account ${i + 1}: ${error?.message || "Invalid mnemonic"}`, "bad");
            }
          }
        } else {
          try {
            const wallet = walletFromSecret(line, 0, nextWalletNum + newWallets.length);
            newWallets.push(wallet);
          } catch (error: any) {
            toast(`Invalid private key: ${error?.message || "Unknown error"}`, "bad");
          }
        }
      }

      if (newWallets.length > 0) {
        addWallets(newWallets);
        toast(`Imported ${newWallets.length} wallet(s)`, "ok");
        setSecret("");
        setAccounts("1");
        onClose();
      } else {
        toast("No valid wallets found", "bad");
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Key material</p>
            <h3 className="text-lg font-bold text-slate-100">Import wallet(s)</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="block">Security warning</strong>
            Use this only on a trusted local copy. Keys are stored unencrypted in this browser's local storage.
          </span>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">
              Private keys or mnemonic phrases
              <span className="ml-1 text-[10px] text-slate-500">(one per line, comma or semicolon separated)</span>
            </Label>
            <Textarea
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              rows={5}
              placeholder={"0x… private key\n12 or 24 word mnemonic phrase"}
              className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Accounts per mnemonic</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Import from file</Label>
              <Input
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setSecret(String(reader.result || ""));
                    reader.readAsText(file);
                  }
                }}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200 file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:px-2 file:py-1 file:text-xs file:text-slate-200"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Each key or phrase becomes a wallet; mnemonics derive the requested accounts on{" "}
            <span className="font-mono">m/44'/60'/0'/0/i</span>. Duplicates are skipped.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importing}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {importing ? "Importing…" : "Import wallet(s)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```21:T18f0,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { X } from "lucide-react";

interface NetworkDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NetworkDialog({ open, onClose }: NetworkDialogProps) {
  const { addNetwork } = useWalletStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    id: "",
    rpc: "",
    symbol: "ETH",
    type: "evm",
    chainId: "1",
    explorer: "",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.id || !form.rpc) {
      toast("Fill in name, ID, and RPC URL", "bad");
      return;
    }
    addNetwork({
      id: form.id,
      name: form.name,
      chainType: form.type as "evm" | "tron",
      rpc: form.rpc,
      nativeSymbol: form.symbol,
      chainId: form.type === "evm" ? Number(form.chainId) : undefined,
      explorerUrl: form.explorer || undefined,
    });
    toast("Network added", "ok");
    setForm({ name: "", id: "", rpc: "", symbol: "ETH", type: "evm", chainId: "1", explorer: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Network configuration</p>
            <h3 className="text-lg font-bold text-slate-100">Add custom network</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My EVM network"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network ID / slug</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="my-network"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">RPC URL</Label>
            <Input
              type="url"
              value={form.rpc}
              onChange={(e) => setForm({ ...form, rpc: e.target.value })}
              placeholder="https://..."
              className="border-slate-700 bg-slate-800 text-xs text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Native symbol</Label>
              <Input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Chain type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
              >
                <option value="evm">EVM</option>
                <option value="tron">Tron</option>
              </select>
            </div>
          </div>

          {form.type === "evm" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">
                  Chain ID <span className="text-[10px] text-slate-500">(EVM only)</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={form.chainId}
                  onChange={(e) => setForm({ ...form, chainId: e.target.value })}
                  placeholder="1"
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">
                  Explorer tx URL <span className="text-[10px] text-slate-500">(optional)</span>
                </Label>
                <Input
                  type="url"
                  value={form.explorer}
                  onChange={(e) => setForm({ ...form, explorer: e.target.value })}
                  placeholder="https://etherscan.io/tx/"
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
              Test &amp; add network
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}22:T1922,```tsx{path=src/components/NetworkDialog.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { X } from "lucide-react";

interface NetworkDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NetworkDialog({ open, onClose }: NetworkDialogProps) {
  const { addNetwork } = useWalletStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    id: "",
    rpc: "",
    symbol: "ETH",
    type: "evm",
    chainId: "1",
    explorer: "",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.id || !form.rpc) {
      toast("Fill in name, ID, and RPC URL", "bad");
      return;
    }
    addNetwork({
      id: form.id,
      name: form.name,
      chainType: form.type as "evm" | "tron",
      rpc: form.rpc,
      nativeSymbol: form.symbol,
      chainId: form.type === "evm" ? Number(form.chainId) : undefined,
      explorerUrl: form.explorer || undefined,
    });
    toast("Network added", "ok");
    setForm({ name: "", id: "", rpc: "", symbol: "ETH", type: "evm", chainId: "1", explorer: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Network configuration</p>
            <h3 className="text-lg font-bold text-slate-100">Add custom network</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My EVM network"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Network ID / slug</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="my-network"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">RPC URL</Label>
            <Input
              type="url"
              value={form.rpc}
              onChange={(e) => setForm({ ...form, rpc: e.target.value })}
              placeholder="https://..."
              className="border-slate-700 bg-slate-800 text-xs text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Native symbol</Label>
              <Input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Chain type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
              >
                <option value="evm">EVM</option>
                <option value="tron">Tron</option>
              </select>
            </div>
          </div>

          {form.type === "evm" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">
                  Chain ID <span className="text-[10px] text-slate-500">(EVM only)</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={form.chainId}
                  onChange={(e) => setForm({ ...form, chainId: e.target.value })}
                  placeholder="1"
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-400">
                  Explorer tx URL <span className="text-[10px] text-slate-500">(optional)</span>
                </Label>
                <Input
                  type="url"
                  value={form.explorer}
                  onChange={(e) => setForm({ ...form, explorer: e.target.value })}
                  placeholder="https://etherscan.io/tx/"
                  className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
              Test &amp; add network
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```23:T128a,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { X } from "lucide-react";

interface TokenDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TokenDialog({ open, onClose }: TokenDialogProps) {
  const { networks, addToken } = useWalletStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    networkId: networks[0]?.id || "",
    name: "",
    address: "",
    decimals: "18",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      toast("Fill in token name and address", "bad");
      return;
    }
    const network = networks.find((n) => n.id === form.networkId);
    if (!network) {
      toast("Select a network", "bad");
      return;
    }
    addToken({
      id: `${form.networkId}-${form.name.toLowerCase()}`,
      networkId: form.networkId,
      name: form.name,
      address: form.address,
      decimals: Number(form.decimals),
      chainType: network.chainType,
    });
    toast("Token added", "ok");
    setForm({ networkId: networks[0]?.id || "", name: "", address: "", decimals: "18" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Token configuration</p>
            <h3 className="text-lg font-bold text-slate-100">Add custom token</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Network</Label>
            <select
              value={form.networkId}
              onChange={(e) => setForm({ ...form, networkId: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
            >
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Symbol / name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="USDC"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Decimals</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: e.target.value })}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Contract address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="0x… or T…"
              className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
              Test &amp; add token
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}24:T12ba,```tsx{path=src/components/TokenDialog.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { X } from "lucide-react";

interface TokenDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TokenDialog({ open, onClose }: TokenDialogProps) {
  const { networks, addToken } = useWalletStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    networkId: networks[0]?.id || "",
    name: "",
    address: "",
    decimals: "18",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      toast("Fill in token name and address", "bad");
      return;
    }
    const network = networks.find((n) => n.id === form.networkId);
    if (!network) {
      toast("Select a network", "bad");
      return;
    }
    addToken({
      id: `${form.networkId}-${form.name.toLowerCase()}`,
      networkId: form.networkId,
      name: form.name,
      address: form.address,
      decimals: Number(form.decimals),
      chainType: network.chainType,
    });
    toast("Token added", "ok");
    setForm({ networkId: networks[0]?.id || "", name: "", address: "", decimals: "18" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-400">Token configuration</p>
            <h3 className="text-lg font-bold text-slate-100">Add custom token</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Network</Label>
            <select
              value={form.networkId}
              onChange={(e) => setForm({ ...form, networkId: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
            >
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Symbol / name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="USDC"
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Decimals</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: e.target.value })}
                className="border-slate-700 bg-slate-800 text-xs text-slate-200"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Contract address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="0x… or T…"
              className="border-slate-700 bg-slate-800 font-mono text-xs text-slate-200"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-500">
              Test &amp; add token
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

```25:Te67,import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { AlertTriangle, X, Eye, EyeOff } from "lucide-react";

interface SecretsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SecretsDialog({ open, onClose }: SecretsDialogProps) {
  const { wallets, currentWalletId } = useWalletStore();
  const [showKeys, setShowKeys] = useState(false);

  if (!open) return null;

  const wallet = wallets.find((w) => w.address === currentWalletId);
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">Sensitive key material</p>
            <h3 className="text-lg font-bold text-slate-100">Wallet secrets</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Never share these values. Anyone with the private key or mnemonic controls the wallet and its funds.</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Private key</Label>
            <div className="relative">
              <Input
                type={showKeys ? "text" : "password"}
                readOnly
                value={wallet.rawPrivateKey}
                className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
              />
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {wallet.mnemonic && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Mnemonic phrase</Label>
              <div className="relative">
                <Input
                  type={showKeys ? "text" : "password"}
                  readOnly
                  value={wallet.mnemonic}
                  className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
                />
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}26:Te99,```tsx{path=src/components/SecretsDialog.tsx}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/lib/store";
import { AlertTriangle, X, Eye, EyeOff } from "lucide-react";

interface SecretsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SecretsDialog({ open, onClose }: SecretsDialogProps) {
  const { wallets, currentWalletId } = useWalletStore();
  const [showKeys, setShowKeys] = useState(false);

  if (!open) return null;

  const wallet = wallets.find((w) => w.address === currentWalletId);
  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">Sensitive key material</p>
            <h3 className="text-lg font-bold text-slate-100">Wallet secrets</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Never share these values. Anyone with the private key or mnemonic controls the wallet and its funds.</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400">Private key</Label>
            <div className="relative">
              <Input
                type={showKeys ? "text" : "password"}
                readOnly
                value={wallet.rawPrivateKey}
                className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
              />
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {wallet.mnemonic && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400">Mnemonic phrase</Label>
              <div className="relative">
                <Input
                  type={showKeys ? "text" : "password"}
                  readOnly
                  value={wallet.mnemonic}
                  className="border-slate-700 bg-slate-800 pr-10 font-mono text-xs text-slate-200"
                />
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
```27:T4f8,import { useToast } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-xs font-medium shadow-lg backdrop-blur-sm ${
            toast.type === "ok"
              ? "border-emerald-500/30 bg-slate-900/95 text-emerald-400"
              : toast.type === "bad"
                ? "border-red-500/30 bg-slate-900/95 text-red-400"
                : "border-slate-700 bg-slate-900/95 text-slate-300"
          }`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : toast.type === "bad" ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}28:T524,```tsx{path=src/components/Toaster.tsx}
import { useToast } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 text-xs font-medium shadow-lg backdrop-blur-sm ${
            toast.type === "ok"
              ? "border-emerald-500/30 bg-slate-900/95 text-emerald-400"
              : toast.type === "bad"
                ? "border-red-500/30 bg-slate-900/95 text-red-400"
                : "border-slate-700 bg-slate-900/95 text-slate-300"
          }`}
          onClick={() => dismiss(toast.id)}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : toast.type === "bad" ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="leading-relaxed">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}