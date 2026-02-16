
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export type AppModule = 'dashboard' | 'timeclock' | 'routines' | 'execution' | 'users' | 'reports' | 'audit' | 'niches' | 'proposal' | 'validation' | 'database' | 'settings' | 'inventory' | 'compliance' | 'finance' | 'cash_register' | 'pos';

export type ProductCategory = 'ENTRADAS' | 'PIZZAS' | 'BEBIDAS' | 'PORCOES' | 'BORDAS' | 'VINHOS' | 'SABORES_PIZZA';
export type OrderType = 'DINE_IN' | 'DELIVERY' | 'COUNTER';
export type OrderStatus = 'AVAILABLE' | 'OCCUPIED' | 'PREPARING' | 'READY' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface CompanyConfig {
  id: string;
  cnpj: string;
  ie: string; // Inscrição Estadual
  csc_token: string;
  csc_id: string;
  environment: 'homologation' | 'production';
  cert_pfx_base64?: string;
  cert_password?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf_cnpj?: string; // Fiscal
  address: string;
  region: string;
  created_at?: string;
}

export interface MenuProduct {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description?: string;
  is_pizza_base?: boolean;
  max_flavors?: number;
  // Campos Fiscais
  ncm?: string;
  cfop?: string;
  cest?: string;
  tax_origin?: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  flavors?: string[]; 
  is_pizza?: boolean;
  sent_to_kitchen?: boolean;
  cancelled_by?: string;
}

export interface TableSession {
  id: string;
  type: OrderType;
  table_number?: number;
  customer?: Customer;
  status: OrderStatus;
  items: OrderItem[];
  cancelled_items?: OrderItem[];
  opened_at: string;
  prepared_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  motoboy_name?: string;
  operator_name?: string;
  delivery_fee?: number;
  use_service_charge: boolean;
}

export interface Unit { id: string; company_id: string; name: string; address: string; }
export interface User { id: string; company_id?: string; cpf?: string; unit_id?: string; role_name?: string; permitted_modules?: (AppModule | string)[]; name: string; role: string | UserRole; access_level?: string; created_at?: string; salary?: number; hire_date?: string; }
export type AdjustmentStatus = 'ORIGINAL' | 'PENDENTE' | 'APROVADO' | 'NEGADO';
export interface TimeLog { id: string; user_id: string; timestamp: string; type: string; status: AdjustmentStatus; location?: any; hash: string; }

export interface StockItem { 
  id: string; 
  name: string; 
  unit: string; 
  category: 'PERECIVEIS' | 'BEBIDAS' | 'EQUIPAMENTOS'; 
  ideal_quantity: number; 
  current_stock: number; 
  cost_price: number; 
  is_ordered?: boolean; 
  updated_at?: string;
  // Campos Fiscais para entrada de nota
  ncm?: string;
  cfop?: string;
}

export interface ComplianceService { id: string; name: string; last_performed: string; validity_months: number; cost: number; provider?: string; }
export interface VacationRecord { id: string; user_id: string; user_name: string; hire_date: string; planned_date: string; cost_estimated: number; }

export interface FinancialTransaction { 
  id: string; 
  type: 'INCOME' | 'EXPENSE'; 
  category: 'INVENTORY' | 'SERVICE' | 'UTILITY' | 'LABOR' | 'LOAN' | 'LEGAL' | 'MAINTENANCE' | 'FEES' | 'OTHER'; 
  description: string; 
  amount: number; 
  due_date: string; 
  status: 'PAID' | 'PENDING'; 
  attachment_url?: string; 
  supplier?: string;
  // Auditoria Fiscal
  nf_key?: string;      // Chave de 44 dígitos
  nf_status?: string;   // AUTHORIZED, REJECTED, CANCELLED
  nf_url?: string;      // Link PDF DANFE
  nf_xml_url?: string;  // Link XML
}

export interface PaymentMethod { id: string; name: string; fee_percentage: number; settlement_days: number; }
export interface Routine { id: string; company_id?: string; unit_id?: string; is_stock_control?: boolean; target_categories?: string[]; target_roles?: string[]; day_of_week?: number; title: string; description: string; frequency: Frequency; require_photo: boolean; require_geo: boolean; deadline: string; updated_at?: string; }
export enum Frequency { DAILY = 'DIARIA', WEEKLY = 'SEMANAL', MONTHLY = 'MENSAL' }
export interface TaskLog { id: string; routine_id: string; executed_by_id?: string; executed_by: string; status: string; evidence_url: string; location?: any; created_at: string; }
