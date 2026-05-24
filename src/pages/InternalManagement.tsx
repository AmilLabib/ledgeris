import { useEffect, useMemo, useState, useCallback } from "react";
import { Factory, Users, Clock, Brain, X, Plus } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatRupiah } from "../data/financials";
import { useBusinessSector } from "../context/BusinessSectorContext";
import { useInventory } from "../context/InventoryContext";

function mockWorkforce() {
  return {
    attendance: [
      {
        name: "Budi",
        role: "Cook",
        date: "2025-12-23",
        checkIn: "08:03",
        checkOut: "17:15",
        status: "On-time",
      },
      {
        name: "Siti",
        role: "Cashier",
        date: "2025-12-23",
        checkIn: "08:10",
        checkOut: "17:20",
        status: "Slightly Late",
      },
      {
        name: "Andi",
        role: "Waiter",
        date: "2025-12-23",
        checkIn: "07:55",
        checkOut: "16:50",
        status: "Early",
      },
      {
        name: "Rina",
        role: "Cook",
        date: "2025-12-23",
        checkIn: "08:05",
        checkOut: "17:05",
        status: "On-time",
      },
    ],
    roleSuitability: {
      employee: "Budi",
      sector: "Kitchen / Cook",
      score: 92,
      insights:
        "High compatibility. Strong consistency in prep speed and taste score; recommended for main course station leadership.",
    },
  };
}

// Sector-aware mock data to render immediately
const MOCKS: Record<string, any> = {
  kuliner: {
    inventory: {
      wip: [
        { name: "Rendang Marinasi", qty: 25, unit: "kg", unitCost: 160_000 },
        { name: "Kaldu Dasar", qty: 40, unit: "kg", unitCost: 40_000 },
      ],
      finishedGoods: [
        { name: "Rendang Daging", qty: 180, unit: "porsi", unitCost: 35_000 },
        { name: "Soto Ayam", qty: 220, unit: "porsi", unitCost: 18_000 },
      ],
      cogsMonthToDate: 48_500_000,
    },
    suppliers: [
      { name: "Supplier Daging A", materials: ["Daging Sapi"] },
      { name: "Pasar Induk", materials: ["Bumbu Rempah", "Sayur Mix"] },
      {
        name: "Konveksi Jaya",
        materials: ["Baju Top Long sleeve", "Celana Track pants"],
      },
      { name: "Pengrajin Kayu", materials: ["Kayu Jati", "Rotan"] },
    ],
    workforce: mockWorkforce(),
    business: {
      customerInsights: {
        avgOrderValue: 52_000,
        retentionRate: 0.68,
        weeklyOrders: 820,
        trend: +0.06,
      },
      campaignNotes:
        "Promo pekan ini: Paket Bakso Frozen + Kuah 10% off. Kolaborasi reseller pasar tradisional radius 5 km.",
      payments: {
        qrisStatus: "Active" as "Active" | "Inactive",
        merchantName: "Warung Nusantara Bu Rina",
        merchantId: "IDM-QRIS-88231",
      },
    },
  },
  agribisnis: {
    inventory: {
      wip: [
        { name: "Pupuk Organik", qty: 120, unit: "karung", unitCost: 75_000 },
      ],
      finishedGoods: [
        { name: "Sayur Segar", qty: 1200, unit: "kg", unitCost: 6_000 },
      ],
      cogsMonthToDate: 12_500_000,
    },
    suppliers: [{ name: "Kebun Mitra", materials: ["Pupuk", "Benih"] }],
    workforce: mockWorkforce(),
    business: {
      customerInsights: {
        avgOrderValue: 18_000,
        retentionRate: 0.45,
        weeklyOrders: 420,
        trend: -0.02,
      },
      campaignNotes:
        "Panen musim ini: fokus ke saluran reseller pasar digital.",
      payments: {
        qrisStatus: "Active",
        merchantName: "Kebun Organik",
        merchantId: "AG-001",
      },
    },
  },
  fashion: {
    inventory: {
      wip: [{ name: "Kain Batik", qty: 60, unit: "meter", unitCost: 45_000 }],
      finishedGoods: [
        { name: "Kemeja Batik", qty: 300, unit: "pcs", unitCost: 85_000 },
      ],
      cogsMonthToDate: 22_000_000,
    },
    suppliers: [{ name: "Konveksi Jaya", materials: ["Kain", "Resleting"] }],
    workforce: mockWorkforce(),
    business: {
      customerInsights: {
        avgOrderValue: 120_000,
        retentionRate: 0.55,
        weeklyOrders: 210,
        trend: 0.03,
      },
      campaignNotes: "Luncurkan koleksi musim panas dengan diskon pre-order.",
      payments: {
        qrisStatus: "Active",
        merchantName: "Toko Modis",
        merchantId: "FS-101",
      },
    },
  },
  industri: {
    inventory: {
      wip: [{ name: "Komponen A", qty: 400, unit: "pcs", unitCost: 12_000 }],
      finishedGoods: [
        { name: "Produk Olahan", qty: 1200, unit: "pcs", unitCost: 45_000 },
      ],
      cogsMonthToDate: 142_000_000,
    },
    suppliers: [{ name: "Pabrik Besi", materials: ["Besi", "Cat"] }],
    workforce: mockWorkforce(),
    business: {
      customerInsights: {
        avgOrderValue: 420_000,
        retentionRate: 0.72,
        weeklyOrders: 80,
        trend: 0.01,
      },
      campaignNotes: "Optimalkan lini produksi untuk menekan lead time.",
      payments: {
        qrisStatus: "Inactive",
        merchantName: "PT Produksi",
        merchantId: "IN-501",
      },
    },
  },
  perdagangan: {
    inventory: {
      wip: [],
      finishedGoods: [
        { name: "Paket Promo", qty: 900, unit: "pcs", unitCost: 25_000 },
      ],
      cogsMonthToDate: 32_000_000,
    },
    suppliers: [
      { name: "Distributor Sentral", materials: ["Barang Konsumsi"] },
    ],
    workforce: mockWorkforce(),
    business: {
      customerInsights: {
        avgOrderValue: 72_000,
        retentionRate: 0.61,
        weeklyOrders: 1020,
        trend: 0.04,
      },
      campaignNotes: "Flash sale akhir pekan: 15% untuk member.",
      payments: {
        qrisStatus: "Active",
        merchantName: "Retail Nusantara",
        merchantId: "RT-777",
      },
    },
  },
};

const palette = {
  operational: "#0ea5e9", // sky
  nonOperational: "#f97316", // orange
};

type Supplier = { name: string; materials: string[] };
type Material = { name: string };
type WipItem = { name: string };
type FinalItem = { name: string };
type SupplierForm = { name: string; materialsText: string };

type InventoryCategory = string;

type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  qty: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  image: string;
  supplier: string;
};

function SupplyChainDiagram({
  suppliers,
  rawMaterials,
  wip,
  finished,
}: {
  suppliers: Supplier[];
  rawMaterials: Material[];
  wip: WipItem[];
  finished: FinalItem[];
}) {
  const initialNodes = useMemo<any[]>(() => {
    const nodes: any[] = [];

    // Layout constants
    const colGap = 250;
    const vGap = 80;

    // Y-coordinate generator
    const getYs = (count: number) => {
      const startY = 50;
      return Array.from({ length: count }, (_, i) => startY + i * vGap);
    };

    const supYs = getYs(suppliers.length);
    suppliers.forEach((s, i) => {
      nodes.push({
        id: `sup-${s.name}`,
        data: { label: s.name },
        position: { x: 0, y: supYs[i] },
        sourcePosition: "right",
        targetPosition: "left",
        style: {
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
        },
      });
    });

    const rawYs = getYs(rawMaterials.length);
    rawMaterials.forEach((r, i) => {
      nodes.push({
        id: `raw-${r.name}`,
        data: { label: r.name },
        position: { x: colGap, y: rawYs[i] },
        sourcePosition: "right",
        targetPosition: "left",
        style: {
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          color: "#1e40af",
        },
      });
    });

    const wipYs = getYs(wip.length);
    wip.forEach((w, i) => {
      nodes.push({
        id: `wip-${w.name}`,
        data: { label: w.name },
        position: { x: colGap * 2, y: wipYs[i] },
        sourcePosition: "right",
        targetPosition: "left",
        style: {
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          color: "#9a3412",
        },
      });
    });

    const finYs = getYs(finished.length);
    finished.forEach((f, i) => {
      nodes.push({
        id: `fin-${f.name}`,
        data: { label: f.name },
        position: { x: colGap * 3, y: finYs[i] },
        sourcePosition: "right",
        targetPosition: "left",
        style: {
          background: "#ecfdf5",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12px",
          color: "#065f46",
        },
      });
    });

    return nodes;
  }, [suppliers, rawMaterials, wip, finished]);

  const initialEdges = useMemo<any[]>(() => {
    const edges: any[] = [];
    let edgeId = 0;

    const rawNames = new Set(rawMaterials.map((r) => r.name));
    const wipNames = new Set(wip.map((w) => w.name));
    const finNames = new Set(finished.map((f) => f.name));

    suppliers.forEach((s) => {
      s.materials.forEach((mat) => {
        if (rawNames.has(mat)) {
          edges.push({
            id: `e-${edgeId++}`,
            source: `sup-${s.name}`,
            target: `raw-${mat}`,
            animated: true,
            style: { stroke: "#9ca3af", strokeWidth: 1.5 },
          });
        }
      });
    });

    const rawToWipPairs: Record<string, string[]> = {
      "Daging Sapi": ["Rendang Marinasi"],
      "Bumbu Rempah": ["Rendang Marinasi", "Kaldu Dasar"],
      Ayam: ["Kaldu Dasar"],
    };
    rawMaterials.forEach((r) => {
      (rawToWipPairs[r.name] || []).forEach((wName) => {
        if (wipNames.has(wName)) {
          edges.push({
            id: `e-${edgeId++}`,
            source: `raw-${r.name}`,
            target: `wip-${wName}`,
            animated: true,
            style: { stroke: "#9ca3af", strokeWidth: 1.5 },
          });
        }
      });
    });

    const wipToFinalPairs: Record<string, string[]> = {
      "Rendang Marinasi": ["Rendang Daging"],
      "Kaldu Dasar": ["Soto Ayam"],
    };
    wip.forEach((w) => {
      (wipToFinalPairs[w.name] || []).forEach((fName) => {
        if (finNames.has(fName)) {
          edges.push({
            id: `e-${edgeId++}`,
            source: `wip-${w.name}`,
            target: `fin-${fName}`,
            animated: true,
            style: { stroke: "#9ca3af", strokeWidth: 1.5 },
          });
        }
      });
    });

    return edges;
  }, [suppliers, rawMaterials, wip, finished]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Allow connecting nodes freely
  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds: any[]) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  // Update nodes and edges when props change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="h-[450px] w-full border rounded-xl bg-gray-50 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
      <div className="absolute top-3 left-4 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 z-10">
        💡 Tip: Drag nodes to reposition or connect them to form new flows
      </div>
    </div>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function RadialGauge({
  value,
  size = 120,
  stroke = 12,
  color = "#10b981",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-gray-800"
        style={{ fontSize: 18, fontWeight: 700 }}
      >
        {clamped}%
      </text>
    </svg>
  );
}

export default function InternalManagement() {
  usePageTitle("Internal Management");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const { sector } = useBusinessSector();
  const sectorData = (MOCKS as any)[sector] || (MOCKS as any)["kuliner"];

  const [note, setNote] = useState<string>(sectorData.business.campaignNotes);
  const [attendance, setAttendance] = useState(() => [
    ...sectorData.workforce.attendance,
  ]);
  const [newAtt, setNewAtt] = useState({
    name: "",
    role: "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "08:00",
    checkOut: "17:00",
    status: "On-time" as "On-time" | "Slightly Late" | "Early",
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => [
    ...sectorData.suppliers,
  ]);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: "",
    materialsText: "",
  });
  const [editingSupplierIndex, setEditingSupplierIndex] = useState<
    number | null
  >(null);

  const {
    products: inventoryItems,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useInventory();
  const [inventoryForm, setInventoryForm] = useState<Omit<InventoryItem, "id">>(
    {
      name: "",
      category: "Kuliner",
      qty: 0,
      unit: "pcs",
      unitCost: 0,
      sellingPrice: 0,
      image: "",
      supplier: "",
    },
  );
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(
    null,
  );

  const inventoryValue = useMemo(
    () => inventoryItems.reduce((s, m) => s + m.qty * m.unitCost, 0),
    [inventoryItems],
  );
  const operationalCost = useMemo(
    () => inventoryValue + sectorData.inventory.cogsMonthToDate,
    [inventoryValue, sectorData],
  );
  const nonOperationalCost = useMemo(
    () => Math.round(inventoryValue * 0.18 + 2_800_000),
    [inventoryValue],
  );

  const costBars = useMemo(
    () => [
      {
        stage: "Operational",
        value: operationalCost,
        color: palette.operational,
      },
      {
        stage: "Non-Operational",
        value: nonOperationalCost,
        color: palette.nonOperational,
      },
    ],
    [operationalCost, nonOperationalCost],
  );

  const saveSupplier = () => {
    const name = supplierForm.name.trim();
    if (!name) return;
    const materials = supplierForm.materialsText
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const payload: Supplier = { name, materials };
    if (editingSupplierIndex !== null) {
      setSuppliers((prev) =>
        prev.map((s, i) => (i === editingSupplierIndex ? payload : s)),
      );
    } else {
      setSuppliers((prev) => [payload, ...prev]);
    }
    setSupplierForm({ name: "", materialsText: "" });
    setEditingSupplierIndex(null);
  };

  const saveInventoryItem = () => {
    if (!inventoryForm.name.trim() || inventoryForm.qty <= 0) return;
    const payload = {
      ...inventoryForm,
      image: inventoryForm.image.trim() || "https://via.placeholder.com/150",
      supplier:
        inventoryForm.supplier || suppliers[0]?.name || "Belum ditentukan",
    };
    if (editingInventoryId) {
      updateProduct(editingInventoryId, payload as any);
    } else {
      addProduct(payload as any);
    }
    setInventoryForm({
      name: "",
      category: "Kuliner",
      qty: 0,
      unit: "pcs",
      unitCost: 0,
      sellingPrice: 0,
      image: "",
      supplier: "",
    });
    setEditingInventoryId(null);
  };

  // Optional: local persistence for notes (lightweight enhancement)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("im_campaign_note");
      if (stored) setNote(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("im_campaign_note", note);
    } catch {}
  }, [note]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <p className="text-sm text-gray-600 mb-6 mt-1">
          Operasional harian bisnis: pantau biaya operasional, non-operasional,
          supplier, stok inventaris, tenaga kerja, dan kontrol internal dalam
          satu dasbor.
        </p>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Supply Chain & Cost Accounting - prominent */}
          <section className="lg:col-span-8 bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">
                  Inventory & Cost Control
                </h2>
              </div>
              <span className="text-xs text-gray-500">
                as of {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">Operational Cost</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(operationalCost)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">Non-Operational Cost</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(nonOperationalCost)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">COGS (MTD)</p>
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(sectorData.inventory.cogsMonthToDate)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-gray-500">Inventory Items</p>
                <p className="text-lg font-semibold text-primary">
                  {inventoryItems.length}
                </p>
              </div>
            </div>

            {/* Cost Bar Chart */}
            <div className="mt-5 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costBars}
                  margin={{ top: 8, right: 16, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) =>
                      Number(v) >= 1_000_000
                        ? `${(Number(v) / 1_000_000).toFixed(1)}M`
                        : `${v}`
                    }
                    width={40}
                  />
                  <ReTooltip
                    formatter={(v: number) => formatRupiah(Number(v))}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {costBars.map((d, i) => (
                      <Cell key={`bar-${i}`} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Supply Chain Diagram */}
            <div className="mt-6">
              <h3 className="text-base font-semibold mb-2">
                Supply Chain Diagram
              </h3>
              <SupplyChainDiagram
                suppliers={suppliers}
                rawMaterials={inventoryItems.map((m) => ({
                  name: m.name,
                }))}
                wip={sectorData.inventory.wip.map((m: any) => ({
                  name: m.name,
                }))}
                finished={sectorData.inventory.finishedGoods.map((m: any) => ({
                  name: m.name,
                }))}
              />
            </div>
          </section>

          {/* Supplier Management */}
          <section className="lg:col-span-4 bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md min-w-0 card-hover flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">Supplier Management</h2>
              </div>
              <button
                onClick={() => {
                  setEditingSupplierIndex(null);
                  setSupplierForm({ name: "", materialsText: "" });
                  setIsSupplierModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="rounded-xl border p-4 flex-1 overflow-hidden flex flex-col">
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {suppliers.map((s, idx) => (
                  <div
                    key={`${s.name}-${idx}`}
                    className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-2 bg-white hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        Materials:{" "}
                        <span className="font-medium text-gray-700">
                          {s.materials.join(", ") || "-"}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs shrink-0">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 font-medium"
                        onClick={() => {
                          setEditingSupplierIndex(idx);
                          setSupplierForm({
                            name: s.name,
                            materialsText: s.materials.join(", "),
                          });
                          setIsSupplierModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md border border-red-100 text-red-600 bg-white hover:bg-red-50 font-medium"
                        onClick={() =>
                          setSuppliers((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Inventory Management */}
          <section className="lg:col-span-8 bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">Inventory Management</h2>
              </div>
              <button
                onClick={() => {
                  setEditingInventoryId(null);
                  setInventoryForm({
                    name: "",
                    category: "Kuliner",
                    qty: 0,
                    unit: "pcs",
                    unitCost: 0,
                    sellingPrice: 0,
                    image: "",
                    supplier: "",
                  });
                  setIsInventoryModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            <div className="rounded-xl border p-4 bg-white/50">
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 pb-4 pt-2">
                {inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    <div className="relative shrink-0 self-center sm:self-auto">
                      <img
                        src={item.image || "https://via.placeholder.com/150"}
                        alt={item.name}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.25)] transition-all duration-300 relative z-10"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="font-semibold text-lg text-gray-800 truncate">
                        {item.name}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          {item.qty} {item.unit}
                        </span>
                        <span className="text-sm text-gray-300">•</span>
                        <span className="text-sm font-semibold text-emerald-600">
                          HPP: {formatRupiah(item.unitCost)}
                          <span className="text-xs text-gray-500 font-normal">
                            /{item.unit}
                          </span>
                        </span>
                        <span className="text-sm text-primary font-semibold">
                          Harga Jual:{" "}
                          {formatRupiah(item.sellingPrice ?? item.unitCost)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-2">
                        Supplier:{" "}
                        <span className="font-medium text-gray-700">
                          {item.supplier}
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-center sm:flex-col gap-2 text-sm shrink-0">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium"
                        onClick={() => {
                          setEditingInventoryId(item.id);
                          setInventoryForm({
                            name: item.name,
                            category:
                              (item.category as InventoryCategory) || "",
                            qty: item.qty,
                            unit: item.unit,
                            unitCost: item.unitCost,
                            sellingPrice: item.sellingPrice ?? item.unitCost,
                            image: item.image || "",
                            supplier: item.supplier || "",
                          });
                          setIsInventoryModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                        onClick={() => {
                          deleteProduct(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Human Resources */}
          <section className="lg:col-span-4 bg-gradient-to-b from-[#f2fcf9] from-2% to-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">Smart Workforce</h2>
              </div>
              <button
                onClick={() => {
                  setNewAtt({
                    name: "",
                    role: "",
                    date: new Date().toISOString().slice(0, 10),
                    checkIn: "08:00",
                    checkOut: "17:00",
                    status: "On-time",
                  });
                  setIsAttendanceModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Attendance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-800">Attendance</h3>
              </div>

              <div className="overflow-x-auto -mx-1">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-100">
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Role</th>
                      <th className="py-2 pr-3 font-medium">In</th>
                      <th className="py-2 pr-3 font-medium">Out</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-50 last:border-0 hover:bg-white/50 transition-colors"
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap font-medium text-gray-800">
                          {a.name}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap text-gray-600">
                          {a.role}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap text-gray-700">
                          {a.checkIn}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap text-gray-700">
                          {a.checkOut}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs border font-medium ${
                              a.status === "On-time"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : a.status === "Slightly Late"
                                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            onClick={() =>
                              setAttendance((prev) =>
                                prev.filter((_, i2) => i2 !== idx),
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mt-6 border border-purple-100 bg-purple-50/30 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">
                  AI Role Suitability Match
                </h3>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <RadialGauge
                  value={sectorData.workforce.roleSuitability.score}
                  color="#8b5cf6"
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-lg">
                    {sectorData.workforce.roleSuitability.employee}
                  </p>
                  <p className="text-sm font-medium text-purple-700">
                    Sector: {sectorData.workforce.roleSuitability.sector}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {sectorData.workforce.roleSuitability.insights}
                  </p>
                </div>
              </div>
              {/* Background decoration */}
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            </div>
          </section>
        </div>
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplierIndex !== null ? "Edit Supplier" : "Add Supplier"}
      >
        <div className="grid grid-cols-1 gap-4 mt-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              placeholder="Supplier name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Materials
            </label>
            <input
              type="text"
              placeholder="e.g., Tepung Tapioka, Daging Sapi Segar"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={supplierForm.materialsText}
              onChange={(e) =>
                setSupplierForm((p) => ({
                  ...p,
                  materialsText: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple materials with commas
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              onClick={() => {
                saveSupplier();
                setIsSupplierModalOpen(false);
              }}
            >
              {editingSupplierIndex !== null ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title={
          editingInventoryId ? "Edit Inventory Item" : "Add Inventory Item"
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g., Lele Premium, Bakso, Baju"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.name}
              onChange={(e) =>
                setInventoryForm((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.category}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  category: e.target.value as InventoryCategory,
                }))
              }
            >
              <option value="Kuliner">Kuliner</option>
              <option value="Agribisnis dan Pertanian">
                Agribisnis dan Pertanian
              </option>
              <option value="Fashion & Kecantikan">Fashion & Kecantikan</option>
              <option value="Industri pengolahan">Industri pengolahan</option>
              <option value="Perdagangan / Retail">Perdagangan / Retail</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Quantity
            </label>
            <input
              type="number"
              min={0}
              placeholder="Qty"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.qty || ""}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  qty: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              HPP
            </label>
            <input
              type="number"
              min={0}
              placeholder="HPP"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.unitCost || ""}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  unitCost: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Harga Jual
            </label>
            <input
              type="number"
              min={0}
              placeholder="Harga jual"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.sellingPrice || ""}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  sellingPrice: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Unit
            </label>
            <input
              type="text"
              placeholder="e.g., kg, pcs, pack"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.unit}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  unit: e.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Supplier
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={inventoryForm.supplier}
              onChange={(e) =>
                setInventoryForm((p) => ({
                  ...p,
                  supplier: e.target.value,
                }))
              }
            >
              <option value="">Select supplier</option>
              {suppliers.map((s, i) => (
                <option key={`${s.name}-${i}`} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Custom Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setInventoryForm((p) => ({
                      ...p,
                      image: reader.result as string,
                    }));
                  };
                  reader.readAsDataURL(file);
                } else {
                  setInventoryForm((p) => ({ ...p, image: "" }));
                }
              }}
            />
          </div>
          <div className="sm:col-span-2 pt-2">
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              onClick={() => {
                saveInventoryItem();
                setIsInventoryModalOpen(false);
              }}
            >
              {editingInventoryId ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Add Attendance"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Employee Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.name}
              onChange={(e) =>
                setNewAtt((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Role
            </label>
            <input
              type="text"
              placeholder="e.g., Cook"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.role}
              onChange={(e) =>
                setNewAtt((p) => ({ ...p, role: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.date}
              onChange={(e) =>
                setNewAtt((p) => ({ ...p, date: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Check In
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.checkIn}
              onChange={(e) =>
                setNewAtt((p) => ({ ...p, checkIn: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Check Out
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.checkOut}
              onChange={(e) =>
                setNewAtt((p) => ({ ...p, checkOut: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              value={newAtt.status}
              onChange={(e) =>
                setNewAtt((p) => ({
                  ...p,
                  status: e.target.value as
                    | "On-time"
                    | "Slightly Late"
                    | "Early",
                }))
              }
            >
              <option>On-time</option>
              <option>Slightly Late</option>
              <option>Early</option>
            </select>
          </div>
          <div className="sm:col-span-2 pt-2">
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              onClick={() => {
                if (!newAtt.name.trim() || !newAtt.role.trim()) return;
                setAttendance((prev) => [{ ...newAtt }, ...prev]);
                setIsAttendanceModalOpen(false);
              }}
            >
              Add Attendance
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
