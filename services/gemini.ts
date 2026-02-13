
import { GoogleGenAI } from "@google/genai";

export const getOperationalInsights = async (complianceData: any) => {
  // A chave de API deve ser obtida exclusivamente da variável de ambiente process.env.API_KEY
  if (!process.env.API_KEY) {
    console.warn("API_KEY não encontrada nas variáveis de ambiente.");
    return "Insights desativados: Configure a API_KEY nas configurações do Vercel para habilitar a análise de IA.";
  }

  try {
    // Inicialização do SDK utilizando process.env.API_KEY diretamente no construtor
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Atue como um Consultor de Operações Especialista. Analise os seguintes dados de conformidade de uma empresa:
      ${JSON.stringify(complianceData)}
      
      Gere um resumo executivo curto (máximo 3 parágrafos) em Português do Brasil destacando:
      1. O nível geral de eficiência.
      2. Possíveis gargalos ou unidades críticas.
      3. Recomendações acionáveis para melhorar a execução das rotinas.
    `;

    // Chamada ao modelo gemini-3-flash-preview conforme diretrizes para tarefas de texto básicas
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Acesso direto à propriedade .text da resposta
    return response.text;
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return "Erro ao processar insights de IA. Verifique se a chave de API é válida e se há conexão com a internet.";
  }
};
