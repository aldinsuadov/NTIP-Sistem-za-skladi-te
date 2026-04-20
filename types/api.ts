export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface ProductRow {
  id: number;
  name: string;
  price: number;
  /** Stanje na skladištu (kom) */
  quantity: number;
  categoryId: number;
  createdAt: string;
  category: CategoryOption;
}

/** Sortiranje liste artikala (API `sort` query). */
export type ProductListSort = "price_asc" | "price_desc" | "date_asc" | "date_desc";

export interface ProductsListResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    q: string | null;
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    sort: ProductListSort;
  };
  data: ProductRow[];
}

export interface CategoriesListResponse {
  data: Array<CategoryOption & { _count?: { products: number } }>;
}

export interface StatsCategoryRow {
  categoryId: number;
  categoryName: string;
  productsCount: number;
  totalPrice: number;
}

export interface StatsResponse {
  productsPerCategory: StatsCategoryRow[];
  totalProductsPrice: number;
  usersCount: number;
}
