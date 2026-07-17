export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role?: User['role'];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: User['role'];
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderWithItems extends Order {
  user_name?: string;
  user_email?: string;
  items: (OrderItem & { product_name: string })[];
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
