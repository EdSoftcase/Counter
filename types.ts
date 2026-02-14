
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export type AppModule = 'dashboard' | 'timeclock' | 'routines' | 'execution' | 'users' | 'reports' | 'audit' | 'niches' | 'proposal' | 'validation' | 'database' | 'settings' | 'inventory' | 'compliance' | 'finance';

export interface Unit {
  id: string;
  company_id: string;
  name: string;
  address: string;
}

export interface User {
  id: string;
  company_id?: string;
  cpf?: string;
  unit_id?: string;
  role_name?: string;
  permitted_modules?: (AppModule | string)[];
  name: string;
  role: string | UserRole;
  access_level?: string;
  created_at?: string;
  salary?: number;
  hire_date?: string;
}

export type AdjustmentStatus = 'ORIGINAL' | 'PENDENTE' | 'APROVADO' | 'NEGADO';

export interface TimeLog {
  id: string;
  user_id: string;
  timestamp: string;
  type: string;
  status: AdjustmentStatus;
  location?: any;
  hash: string;
}

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
}

export interface ComplianceService {
  id: string;
  name: string;
  last_performed: string;
  validity_months: number;
  cost: number;
  provider?: string;
}

export interface VacationRecord {
  id: string;
  user_id: string;
  user_name: string;
  hire_date: string;
  planned_date: string;
  cost_estimated: number;
}

export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'INVENTORY' | 'SERVICE' | 'UTILITY' | 'LABOR' | 'LOAN' | 'LEGAL' | 'MAINTENANCE' | 'FEES' | 'OTHER';
  description: string;
  amount: number;
  due_date: string;
  status: 'PAID' | 'PENDING';
}

export interface PaymentMethod {
  id: string;
  name: string;
  fee_percentage: number;
  settlement_days: number;
}

export interface Routine {
  id: string;
  company_id?: string;
  unit_id?: string;
  is_stock_control?: boolean;
  target_categories?: string[]; // Categorias de estoque vinculadas
  target_roles?: string[];      // Cargos que podem ver esta tarefa
  day_of_week?: number;         // 0-6 (Segunda é 1)
  title: string;
  description: string;
  frequency: Frequency;
  require_photo: boolean;
  require_geo: boolean;
  deadline: string;
  updated_at?: string;
}

export enum Frequency {
  DAILY = 'DIARIA',
  WEEKLY = 'SEMANAL',
  MONTHLY = 'MENSAL'
}

export interface TaskLog {
  id: string;
  routine_id: string;
  executed_by_id?: string;
  executed_by: string;
  status: string;
  evidence_url: string;
  location?: any;
  created_at: string;
}
