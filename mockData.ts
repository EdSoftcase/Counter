import { Unit, User, Routine, Frequency, UserRole } from './types';

export const mockUnits: Unit[] = [
  { id: '1', companyId: 'c1', name: 'Matriz - Centro', address: 'Rua das Flores, 123' },
  { id: '2', companyId: 'c1', name: 'Filial - Shopping', address: 'Av. Principal, 500' }
];

export const mockUsers: User[] = [
  { id: 'u1', companyId: 'c1', name: 'Ricardo Santos', cpf: '123.456.789-00', role: UserRole.ADMIN, unitId: '1', roleName: 'Administrador', permittedModules: ['dashboard', 'timeclock', 'routines', 'inventory'] }
];

export const pizzaInsumos = [
  { id: 'i1', name: 'Farinha 00', unit: 'KG', idealQuantity: 50, costPrice: 8.5, currentStock: 12 },
  { id: 'i2', name: 'Queijo Muçarela', unit: 'KG', idealQuantity: 30, costPrice: 32.0, currentStock: 8 },
  { id: 'i3', name: 'Molho de Tomate', unit: 'LT', idealQuantity: 20, costPrice: 15.0, currentStock: 18 },
  { id: 'i4', name: 'Calabresa Fatiada', unit: 'KG', idealQuantity: 15, costPrice: 28.0, currentStock: 4 }
];

export const mockRoutines: Routine[] = [
  { id: 'r1', companyId: 'c1', title: 'Abertura de Cozinha', description: 'Verificar gás, temperatura do forno e validade de insumos abertos.', frequency: Frequency.DAILY, unitId: '1', requirePhoto: true, requireGeo: true, deadline: '10:00' },
  { id: 'r2', companyId: 'c1', title: 'Limpeza de Geladeiras', description: 'Higienização interna e organização PVPS.', frequency: Frequency.WEEKLY, unitId: '1', requirePhoto: true, requireGeo: false, deadline: '15:00' },
  { id: 'r3', companyId: 'c1', title: 'Controle de Estoque Noturno', description: 'Contagem rápida dos 5 itens mais vendidos.', frequency: Frequency.DAILY, unitId: '1', requirePhoto: false, requireGeo: true, deadline: '23:30', isStockControl: true }
];