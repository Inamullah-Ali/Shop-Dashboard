export type Product = {
  id: number;
  appwriteDocumentId?: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  discount: number;
};

export interface ProductState {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (
    id: number,
    updatedProduct: Partial<Omit<Product, "id" | "createdAt">>
  ) => void;
  deleteProduct: (id: number) => void;
}