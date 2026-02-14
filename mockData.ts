
import { Unit, User, Routine, Frequency, UserRole } from './types';

export const mockUnits: Unit[] = [
  { id: '00000000-0000-0000-0000-000000000001', company_id: 'c1', name: 'Matriz - Centro', address: 'Rua das Flores, 123' },
  { id: '00000000-0000-0000-0000-000000000002', company_id: 'c1', name: 'Filial - Shopping', address: 'Av. Principal, 500' }
];

export const mockUsers: User[] = [
  { 
    id: '00000000-0000-0000-0000-000000000001', 
    company_id: 'c1', 
    name: 'Ricardo Santos', 
    cpf: '123.456.789-00', 
    role: UserRole.ADMIN, 
    unit_id: '00000000-0000-0000-0000-000000000001', 
    role_name: 'Administrador', 
    permitted_modules: ['dashboard', 'timeclock', 'routines', 'inventory'] 
  }
];

export const pizzaInsumos = [
  { id: 'i1', name: 'Farinha 00', unit: 'KG', ideal_quantity: 50, cost_price: 8.5, current_stock: 12 },
  { id: 'i2', name: 'Queijo Muçarela', unit: 'KG', ideal_quantity: 30, cost_price: 32.0, current_stock: 8 },
  { id: 'i3', name: 'Molho de Tomate', unit: 'LT', ideal_quantity: 20, cost_price: 15.0, current_stock: 18 },
  { id: 'i4', name: 'Calabresa Fatiada', unit: 'KG', ideal_quantity: 15, cost_price: 28.0, current_stock: 4 }
];

export const mockRoutines: Routine[] = [
  { id: 'r1', company_id: 'c1', title: 'Abertura de Cozinha', description: 'Verificar gás, temperatura do forno e validade de insumos abertos.', frequency: Frequency.DAILY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: true, require_geo: true, deadline: '10:00' },
  { id: 'r2', company_id: 'c1', title: 'Limpeza de Geladeiras', description: 'Higienização interna e organização PVPS.', frequency: Frequency.WEEKLY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: true, require_geo: false, deadline: '15:00' },
  { id: 'r3', company_id: 'c1', title: 'Controle de Estoque Noturno', description: 'Contagem rápida dos 5 itens mais vendidos.', frequency: Frequency.DAILY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: false, require_geo: true, deadline: '23:30', is_stock_control: true }
];