
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR'
}

export type AppModule = 'dashboard' | 'timeclock' | 'routines' | 'execution' | 'users' | 'reports' | 'audit' | 'niches' | 'proposal' | 'validation' | 'database' | 'settings' | 'inventory';

export interface User {
  id: string;
  companyId: string;
  name: string;
  cpf: string;
  role: UserRole;
  unitId: string;
  roleName: string;
  permittedModules: AppModule[];
}

export type AdjustmentStatus = 'ORIGINAL' | 'PENDENTE' | 'APROVADO' | 'NEGADO';

export interface TimeLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  requestedTimestamp?: string;
  type: 'ENTRADA' | 'SAIDA_INTERVALO' | 'RETORNO_INTERVALO' | 'SAIDA';
  status: AdjustmentStatus;
  location?: { lat: number; lng: number };
  hash: string;
  photoUrl?: string;
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: 'KG' | 'UN' | 'LT' | 'CX';
  idealQuantity: number;
  costPrice: number;
  currentStock: number; 
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface SaleProduct {
  id: string;
  name: string;
  recipe: RecipeItem[];
}

export interface DailySale {
  productId: string;
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'PENDENTE',
  ORDERED = 'SOLICITADO',
  RECEIVED = 'RECEBIDO'
}

export interface PurchaseOrder {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  orderedAt: string;
  receivedAt?: string;
  receivedBy?: string;
  notes?: string;
}

export interface Routine {
  id: string;
  companyId: string;
  title: string;
  description: string;
  frequency: Frequency;
  unitId: string;
  requirePhoto: boolean;
  requireGeo: boolean;
  deadline: string;
  isStockControl?: boolean;
  stockItems?: StockItem[];
}

export enum Frequency {
  DAILY = 'DIARIA',
  WEEKLY = 'SEMANAL',
  MONTHLY = 'MENSAL'
}

export enum TaskStatus {
  PENDING = 'PENDENTE',
  COMPLETED = 'CONCLUIDO',
  FAILED = 'FALHA'
}

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  address: string;
}

export interface StockLog {
  id: string;
  unitId: string;
  routineId: string;
  executedBy: string;
  executedAt: string;
  photoUrl: string;
  items: {
    itemId: string;
    itemName: string;
    counted: number;
    ideal: number;
    unit: string;
  }[];
}

export interface TaskInstance {
  id: string;
  routineId: string;
  status: TaskStatus;
  executedAt?: string;
  executedBy?: string;
  photoUrl?: string;
  location?: { lat: number; lng: number };
  stockMeasurements?: { itemId: string, currentQuantity: number }[];
}
