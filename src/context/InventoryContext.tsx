import React, { createContext, useContext, useEffect, useState } from "react";
import type { BusinessSector } from "./BusinessSectorContext";
import { useBusinessSector } from "./BusinessSectorContext";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitCost: number;
  image?: string;
  supplier?: string;
};

const STORAGE_PREFIX = "inventory_v1_";

type InventoryCtx = {
  products: InventoryItem[];
  addProduct: (p: Omit<InventoryItem, "id">) => void;
  updateProduct: (id: string, p: Partial<InventoryItem>) => void;
  deleteProduct: (id: string) => void;
  decrementStock: (id: string, qty: number) => boolean;
  getById: (id: string) => InventoryItem | undefined;
  setProducts: (items: InventoryItem[]) => void;
};

const ctx = createContext<InventoryCtx | undefined>(undefined);

function seedForSector(sector: BusinessSector): InventoryItem[] {
  const make = (
    n: string,
    category: string,
    qty: number,
    unitCost: number,
    folder: string,
    idx: number,
  ) =>
    ({
      id: `${sector}-${n.replace(/\s+/g, "-")}-${Math.floor(Math.random() * 10000)}`,
      name: n,
      category,
      qty,
      unit: "pcs",
      unitCost,
      image: `/${encodeURIComponent(folder)}/${idx}.png`,
      supplier: "Default Supplier",
    }) as InventoryItem;

  if (sector === "perdagangan") {
    // retail images in /retail/1.png .. /retail/8.png
    const names = [
      "Mie Instan",
      "Beras 5kg",
      "Kecap ABC 600ml",
      "Susu UHT 1L",
      "Gula Pasir 1kg",
      "Minyak Goreng 1L",
      "Kopi Sachet",
      "Teh Celup",
    ];
    return names.map((n, i) =>
      make(
        n,
        "Retail",
        Math.max(50, 200 - i * 20),
        [4000, 72000, 18000, 12000, 12000, 16000, 2500, 2000][i] || 10000,
        "retail",
        i + 1,
      ),
    );
  }

  if (sector === "kuliner") {
    // kuliner images /kuliner/1.png..10.png
    const names = [
      "Bakso",
      "Mie Ayam",
      "Nasi Goreng",
      "Kentang Goreng",
      "Lalapan",
      "Matcha Latte",
      "Kopi Tubruk",
      "Aren Latte",
      "Butterscotch Latte",
      "Iced Tea",
    ];
    const costs = [
      25000, 20000, 25000, 15000, 35000, 20000, 12000, 22000, 25000, 8000,
    ];
    return names.map((n, i) =>
      make(
        n,
        "Kuliner",
        Math.max(30, 150 - i * 10),
        costs[i] || 10000,
        "kuliner",
        i + 1,
      ),
    );
  }

  if (sector === "agribisnis") {
    // Agribisnis folder images `/Agribisnis/1.png..9.png`
    const names = [
      "Pupuk NPK Mutiara Biru 5kg",
      "Pupuk NPK Varian RG 2kg",
      "Neem Oil 500ml",
      "Pestisida Cair Siap Pakai 750ml",
      "Sprayer Elektrik Pertanian 16L",
      "Benih Sayuran Kemangi Lalap",
      "Sprayer Elektrik Farmjet",
      "REAIM Mist Blower",
      "Benih Bunga Nasturtium",
    ];
    const costs = [
      120000, 60000, 45000, 80000, 450000, 15000, 420000, 1200000, 8000,
    ];
    return names.map((n, i) =>
      make(
        n,
        "Agribisnis",
        Math.max(20, 200 - i * 10),
        costs[i] || 20000,
        "Agribisnis",
        i + 1,
      ),
    );
  }

  if (sector === "fashion") {
    // Fashion & Kecantikan images folder name contains spaces
    const folder = "Fashion & Kecantikan";
    const names = [
      "Kaos Oversized Graphic Tee",
      "Kemeja Linen Long Sleeve",
      "Celana Cargo Pants",
      "Jaket Varsity Bomber",
      "Rok Plisket Maxi Skirt",
      "Serum Vitamin C Brightening",
      "Sunscreen Gel SPF 50",
      "Moisturizer Ceramide Gel",
      "Lip Tint Transferproof",
      "Micellar Water Cleansing",
    ];
    const costs = [
      120000, 150000, 180000, 320000, 220000, 90000, 75000, 95000, 65000, 50000,
    ];
    return names.map((n, i) =>
      make(
        n,
        "Fashion & Kecantikan",
        Math.max(10, 200 - i * 15),
        costs[i] || 50000,
        folder,
        i + 1,
      ),
    );
  }

  // industri -> use peternakan images as industrial/farm supplies
  if (sector === "industri") {
    const names = [
      "Pakan Ayam",
      "Pakan Sapi Potong",
      "Konsentrat Bebek Petelur",
      "Suplemen Vitamin Ternak Cair",
      "Obat Cacing Ternak",
      "Desinfektan Kandang",
      "Tempat Pakan Otomatis",
      "Nipple Drinker",
      "Lampu Penghangat Infrared 250W",
      "Serbuk Gergaji Alas Kandang",
    ];
    const costs = [
      250000, 450000, 180000, 90000, 60000, 70000, 120000, 45000, 350000, 15000,
    ];
    return names.map((n, i) =>
      make(
        n,
        "Industri",
        Math.max(10, 100 - i * 5),
        costs[i] || 50000,
        "peternakan",
        i + 1,
      ),
    );
  }

  return [];
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { sector } = useBusinessSector();
  const key = `${STORAGE_PREFIX}${sector}`;

  // Start with the seeded data for the current sector. We'll persist/overwrite
  // stored inventory for all sectors on mount so the seeded data becomes
  // authoritative (per user's request to replace previous inventory).
  const [products, setProductsState] = useState<InventoryItem[]>(() =>
    seedForSector(sector),
  );

  // Overwrite any previously stored inventory for all sectors with the
  // seeded datasets. This is destructive by design (user asked to delete
  // previous data and replace it).
  useEffect(() => {
    const ALL_SECTORS: BusinessSector[] = [
      "kuliner",
      "agribisnis",
      "fashion",
      "industri",
      "perdagangan",
    ];
    try {
      ALL_SECTORS.forEach((s) => {
        localStorage.setItem(
          `${STORAGE_PREFIX}${s}`,
          JSON.stringify(seedForSector(s)),
        );
      });
      // Ensure current provider state matches the seeded data for the active sector
      setProductsState(seedForSector(sector));
    } catch {
      // ignore localStorage failures
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when sector changes, try to load that sector's inventory (or seed)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setProductsState(JSON.parse(raw));
      else setProductsState(seedForSector(sector));
    } catch {
      setProductsState(seedForSector(sector));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(products));
    } catch {}
  }, [key, products]);

  const addProduct = (p: Omit<InventoryItem, "id">) => {
    const item: InventoryItem = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...p,
    };
    setProductsState((s) => [item, ...s]);
  };

  const updateProduct = (id: string, p: Partial<InventoryItem>) => {
    setProductsState((s) =>
      s.map((it) => (it.id === id ? { ...it, ...p } : it)),
    );
  };

  const deleteProduct = (id: string) =>
    setProductsState((s) => s.filter((it) => it.id !== id));

  const decrementStock = (id: string, qty: number) => {
    // Use current products snapshot to perform a synchronous check and update
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const currentQty = products[idx].qty;
    if (currentQty < qty) return false;
    const next = products.map((p) =>
      p.id === id ? { ...p, qty: Math.max(0, p.qty - qty) } : p,
    );
    setProductsState(next);
    return true;
  };

  const getById = (id: string) => products.find((p) => p.id === id);

  return (
    <ctx.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        decrementStock,
        getById,
        setProducts: setProductsState,
      }}
    >
      {children}
    </ctx.Provider>
  );
}

export function useInventory() {
  const c = useContext(ctx);
  if (!c) throw new Error("useInventory must be used within InventoryProvider");
  return c;
}
