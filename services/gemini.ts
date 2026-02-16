
import { GoogleGenAI, Type } from "@google/genai";

export const getOperationalInsights = async (complianceData: any) => {
  if (!process.env.API_KEY) return "Insights desativados: Configure a API_KEY.";

  try {
    // Re-initialize GoogleGenAI on each request to ensure it uses the latest API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analise os dados: ${JSON.stringify(complianceData)}
        Gere um resumo executivo curto em PT-BR destacando eficiência, gargalos e recomendações.
      `,
    });
    return response.text;
  } catch (error: any) {
    console.error("Error fetching AI insights:", error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return "IA indisponível temporariamente (Cota excedida). Tente novamente mais tarde.";
    }
    return "Erro ao processar insights de IA.";
  }
};

export const analyzeInventoryImage = async (base64Image: string, itemName?: string, existingItems?: string[]) => {
  if (!process.env.API_KEY) throw new Error("API_KEY não configurada.");

  const prompt = itemName 
    ? `Você é um assistente de logística. Analise esta imagem (nota fiscal ou produto) e extraia a QUANTIDADE e o PREÇO UNITÁRIO referente ao item "${itemName}".`
    : `Você é um assistente de logística. Analise esta imagem e identifique qual destes produtos está sendo entregue: [${existingItems?.join(', ')}]. Além disso, extraia a QUANTIDADE e o PREÇO UNITÁRIO.`;

  try {
    // Re-initialize GoogleGenAI on each request to ensure it uses the latest API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `${prompt} 
            Retorne APENAS um objeto JSON no formato: {"productName": string, "quantity": number, "price": number}. 
            Se não identificar o nome, use "". Se não encontrar valores, use 0.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
          },
          required: ["productName", "quantity", "price"],
        },
      },
    });

    const result = JSON.parse(response.text || '{"productName": "", "quantity": 0, "price": 0}');
    return result;
  } catch (error: any) {
    console.error("Erro na análise de imagem IA:", error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
       throw new Error("Limite de uso da IA excedido. Por favor, insira os dados manualmente ou tente mais tarde.");
    }
    throw error;
  }
};
