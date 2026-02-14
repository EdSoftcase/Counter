
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

export const pizzaInsumosSugeridos = [
  // Ingredientes
  { name: 'Ervilha', unit: 'KG', ideal_quantity: 10, cost_price: 12.50, current_stock: 0 },
  { name: 'Milho', unit: 'KG', ideal_quantity: 10, cost_price: 9.80, current_stock: 0 },
  { name: 'Mussarella de Bufala', unit: 'KG', ideal_quantity: 15, cost_price: 65.00, current_stock: 0 },
  { name: 'Parmesão', unit: 'KG', ideal_quantity: 10, cost_price: 85.00, current_stock: 0 },
  { name: 'Provolone', unit: 'KG', ideal_quantity: 8, cost_price: 55.00, current_stock: 0 },
  { name: 'Gorgonzola', unit: 'KG', ideal_quantity: 5, cost_price: 78.00, current_stock: 0 },
  { name: 'Presunto', unit: 'KG', ideal_quantity: 20, cost_price: 32.00, current_stock: 0 },
  { name: 'Farinha de trigo especial', unit: 'KG', ideal_quantity: 100, cost_price: 6.50, current_stock: 0 },
  { name: 'Fermento biológico', unit: 'KG', ideal_quantity: 5, cost_price: 45.00, current_stock: 0 },
  { name: 'Molho de tomate', unit: 'LT', ideal_quantity: 50, cost_price: 18.00, current_stock: 0 },
  { name: 'Muçarela', unit: 'KG', ideal_quantity: 60, cost_price: 38.00, current_stock: 0 },
  { name: 'Calabresa', unit: 'KG', ideal_quantity: 30, cost_price: 29.00, current_stock: 0 },
  { name: 'Orégano', unit: 'KG', ideal_quantity: 2, cost_price: 95.00, current_stock: 0 },
  { name: 'Manjericão', unit: 'KG', ideal_quantity: 3, cost_price: 25.00, current_stock: 0 },
  { name: 'Azeite', unit: 'LT', ideal_quantity: 12, cost_price: 42.00, current_stock: 0 },
  // Equipamentos
  { name: 'Pá de Pizza (Alumínio)', unit: 'UN', ideal_quantity: 2, cost_price: 180.00, current_stock: 0 },
  { name: 'Pá de Pizza (Madeira)', unit: 'UN', ideal_quantity: 4, cost_price: 95.00, current_stock: 0 },
  { name: 'Cortador de Pizza (Facão)', unit: 'UN', ideal_quantity: 2, cost_price: 120.00, current_stock: 0 },
  { name: 'Cortador de Pizza (Carretilha)', unit: 'UN', ideal_quantity: 5, cost_price: 35.00, current_stock: 0 },
  { name: 'Rolo de Polietileno', unit: 'UN', ideal_quantity: 2, cost_price: 85.00, current_stock: 0 },
  { name: 'Escova/Vassoura de Forno', unit: 'UN', ideal_quantity: 2, cost_price: 150.00, current_stock: 0 },
  { name: 'Balança Digital', unit: 'UN', ideal_quantity: 2, cost_price: 220.00, current_stock: 0 },
  { name: 'Espátulas de Inox', unit: 'UN', ideal_quantity: 10, cost_price: 28.00, current_stock: 0 },
  { name: 'Caixas de Fermentação', unit: 'UN', ideal_quantity: 20, cost_price: 45.00, current_stock: 0 }
];

export const pizzaInsumos = pizzaInsumosSugeridos.slice(0, 4);

export const mockRoutines: Routine[] = [
  { id: 'r1', company_id: 'c1', title: 'Abertura de Cozinha', description: 'Verificar gás, temperatura do forno e validade de insumos abertos.', frequency: Frequency.DAILY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: true, require_geo: true, deadline: '10:00' },
  { id: 'r2', company_id: 'c1', title: 'Limpeza de Geladeiras', description: 'Higienização interna e organização PVPS.', frequency: Frequency.WEEKLY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: true, require_geo: false, deadline: '15:00' },
  { id: 'r3', company_id: 'c1', title: 'Controle de Estoque Noturno', description: 'Contagem rápida dos 5 itens mais vendidos.', frequency: Frequency.DAILY, unit_id: '00000000-0000-0000-0000-000000000001', require_photo: false, require_geo: true, deadline: '23:30', is_stock_control: true }
];
