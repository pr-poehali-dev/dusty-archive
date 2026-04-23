export const PURCHASES_URL = "https://functions.poehali.dev/ec7ab38c-b81f-4f32-886e-907af780fddf";
export const REFS_URL = "https://functions.poehali.dev/f306d1bc-8c13-4391-bebe-54d07aeec2f8";

export interface ProductType { id: number; name: string; }
export interface Competitor { id: number; name: string; }
export interface Executor { id: number; full_name: string; }

export interface Purchase {
  id: number;
  name: string;
  product_type_id: number | null;
  product_type_name: string | null;
  competitor_id: number | null;
  competitor_name: string | null;
  submission_date: string | null;
  quantity: number | null;
  competitor_price: number | null;
  our_price: number | null;
  percent: number | null;
  our_coefficient: number | null;
  note: string | null;
  executor_id: number | null;
  executor_name: string | null;
  purchase_link: string | null;
  is_important: boolean;
  is_rejected: boolean;
}

export const emptyPurchase: Omit<Purchase, "id" | "product_type_name" | "competitor_name" | "executor_name"> = {
  name: "",
  product_type_id: null,
  competitor_id: null,
  submission_date: null,
  quantity: null,
  competitor_price: null,
  our_price: null,
  percent: null,
  our_coefficient: null,
  note: null,
  executor_id: null,
  purchase_link: null,
  is_important: false,
  is_rejected: false,
};

export interface Refs {
  product_types: ProductType[];
  competitors: Competitor[];
  executors: Executor[];
}
