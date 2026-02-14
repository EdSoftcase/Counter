
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export type AppModule = 'dashboard' | 'timeclock' | 'routines' | 'execution' | 'users' | 'reports' | 'audit' | 'niches' | 'proposal' | 'validation' | 'database' | 'settings' | 'inventory';

// Added Unit interface used in mockData.ts
export interface Unit {
  id: string;
  company_id: string;
  name: string;
  address: string;
}

export interface User {
  id: string;
  // Added properties used in mockData.ts to fix property check errors
  company_id?: string;
  cpf?: string;
  unit_id?: string;
  role_name?: string;
  permitted_modules?: (AppModule | string)[];
  name: string;
  role: string | UserRole;
  access_level?: string;
  created_at?: string;
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
  ideal_quantity: number;
  current_stock: number;
  cost_price: number;
}

export interface Routine {
  id: string;
  // Added properties used in mockData.ts to fix property check errors
  company_id?: string;
  unit_id?: string;
  is_stock_control?: boolean;
  title: string;
  description: string;
  frequency: Frequency;
  require_photo: boolean;
  require_geo: boolean;
  deadline: string;
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
