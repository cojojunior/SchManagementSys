import type { FeeStructure } from "@/types/finance";

const now = "2024-09-01T08:00:00Z";

// Helper to build items with unique-ish ids
let seq = 0;
const item = (
  name: string,
  category: FeeStructure["items"][number]["category"],
  amount: number,
  description?: string,
) => ({
  id: `fi-${++seq}`,
  name,
  category,
  amount,
  description,
});

export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  // Nursery & KG
  {
    id: "fs-nur-t1",
    name: "Nursery 2024/2025 Term 1",
    division: "nursery",
    academicYear: "2024/2025",
    termId: "t-2024-1",
    termName: "Term 1",
    items: [
      item("Tuition", "tuition", 400),
      item("Feeding", "feeding", 150),
      item("Books & Materials", "books", 50),
      item("Result Access", "result_access", 10),
    ],
    total: 610,
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "fs-kg-t1",
    name: "KG 2024/2025 Term 1",
    division: "kg",
    academicYear: "2024/2025",
    termId: "t-2024-1",
    termName: "Term 1",
    items: [
      item("Tuition", "tuition", 420),
      item("Feeding", "feeding", 150),
      item("Books & Materials", "books", 60),
      item("Result Access", "result_access", 10),
    ],
    total: 640,
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  // Primary
  {
    id: "fs-pri-t1",
    name: "Primary 2024/2025 Term 1",
    division: "primary",
    academicYear: "2024/2025",
    termId: "t-2024-1",
    termName: "Term 1",
    items: [
      item("Tuition", "tuition", 500),
      item("Feeding", "feeding", 180),
      item("Books & Materials", "books", 80),
      item("Examination", "other", 40),
      item("Result Access", "result_access", 15),
    ],
    total: 815,
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  // JHS
  {
    id: "fs-jhs-t1",
    name: "JHS 2024/2025 Term 1",
    division: "jhs",
    academicYear: "2024/2025",
    termId: "t-2024-1",
    termName: "Term 1",
    items: [
      item("Tuition", "tuition", 550),
      item("Feeding", "feeding", 200),
      item("Books & Materials", "books", 100),
      item("Examination", "other", 50),
      item("Result Access", "result_access", 20),
    ],
    total: 920,
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];
