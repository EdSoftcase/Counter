
import React from 'react';
import { Database, Table, Key, Link as LinkIcon } from 'lucide-react';

const DatabaseSchema: React.FC = () => {
  const tables = [
    {
      name: 'Companies',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'name', type: 'String' },
        { name: 'cnpj', type: 'String', unique: true },
        { name: 'plan_id', type: 'FK', fk: 'Plans.id' }
      ]
    },
    {
      name: 'Units',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'company_id', type: 'FK', fk: 'Companies.id' },
        { name: 'name', type: 'String' },
        { name: 'location_data', type: 'JSON' }
      ]
    },
    {
      name: 'Routines',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'unit_id', type: 'FK', fk: 'Units.id' },
        { name: 'title', type: 'String' },
        { name: 'config', type: 'JSONB (Frequency, Flags)' }
      ]
    },
    {
      name: 'TaskLogs',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'routine_id', type: 'FK', fk: 'Routines.id' },
        { name: 'executed_by', type: 'FK', fk: 'Users.id' },
        { name: 'evidence_url', type: 'String' },
        { name: 'timestamp', type: 'TIMESTAMPTZ' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-emerald-500" /> Estrutura de Dados
        </h2>
        <p className="text-slate-500">Arquitetura Multi-tenant otimizada para escalabilidade e auditoria imutável.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((table) => (
          <div key={table.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-sm">
                <Table size={14} className="text-emerald-400" />
                {table.name}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">SQL TABLE</span>
            </div>
            <div className="p-4 space-y-3">
              {table.columns.map((col) => (
                <div key={col.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {col.pk ? <Key size={12} className="text-amber-500" /> : col.fk ? <LinkIcon size={12} className="text-blue-500" /> : <div className="w-3" />}
                    <span className="font-mono text-slate-700">{col.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono italic">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h4 className="font-bold text-slate-800 mb-2">Conceitos de Engenharia</h4>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li><strong>Logs Imutáveis:</strong> Toda execução de tarefa gera um hash único criptográfico para auditoria legal.</li>
          <li><strong>Storage S3:</strong> Evidências fotográficas armazenadas com versionamento e acesso controlado via Signed URLs.</li>
          <li><strong>Real-time Sync:</strong> WebSocket para notificações instantâneas de falha na execução crítica.</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseSchema;
