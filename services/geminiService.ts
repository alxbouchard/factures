
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CompanyInfo } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("La variable d'environnement VITE_GEMINI_API_KEY n'est pas définie. Les fonctionnalités Gemini ne fonctionneront pas.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const generateDescription = async (title: string): Promise<string> => {
    if (!genAI) return title;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Étant donné le titre de l'article \"" + title + "\", rédigez une description d'article professionnelle et concise pour une facture commerciale. Limitez-vous à une seule phrase. N'incluez pas le prix ou la quantité.";

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Erreur lors de la génération de la description:", error);
        return title;
    }
};

export const generateEmailBody = async (invoiceDetails: string): Promise<string> => {
    if (!genAI) {
        const clientName = invoiceDetails.split('Nom du client: ')[1]?.split(',')[0] || 'Client';
        return "Bonjour " + clientName + ",\n\nVeuillez trouver votre facture en pièce jointe.\n\nMerci de faire affaire avec nous.";
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Rédigez un corps de courriel professionnel et amical pour envoyer une facture à un client. Utilisez les détails suivants en français: " + invoiceDetails + ". Le courriel doit être bref et courtois. Adressez-vous au client par son nom. Mentionnez le montant total et la date d'échéance, et informez-le que la facture PDF est jointe à ce courriel.";

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Erreur lors de la génération du corps du courriel:", error);
        const clientName = invoiceDetails.split('Nom du client: ')[1]?.split(',')[0] || 'Client';
        return "Bonjour " + clientName + ",\n\nVoici votre facture. Merci!";
    }
};

export const generateSmsBody = async (invoiceDetails: string): Promise<string> => {
    const invoiceNum = invoiceDetails.split('Numéro de facture: ')[1]?.split(',')[0] || '';
    if (!genAI) {
        return "Bonjour. Votre facture " + invoiceNum + " est prête. Merci.";
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Rédigez un SMS professionnel et très concis (moins de 160 caractères) pour informer un client de sa facture. Utilisez ces détails en français: " + invoiceDetails + ". Mentionnez le montant total et la date d'échéance.";

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Erreur lors de la génération du corps du SMS:", error);
        return "Bonjour. Votre facture " + invoiceNum + " est prête. Merci.";
    }
}

export const analyzeInvoice = async (fileData: { mimeType: string; data: string }): Promise<Partial<CompanyInfo>> => {
    if (!genAI) throw new Error("L'IA n'est pas configurée.");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    address: { type: SchemaType.STRING },
                    phone: { type: SchemaType.STRING },
                    email: { type: SchemaType.STRING },
                },
                required: ["name", "address", "phone", "email"],
            }
        }
    });

    const prompt = "Analysez ce document de facture. Identifiez les informations de l'entreprise émettrice.";
    const imagePart = {
        inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        return JSON.parse(result.response.text()) as Partial<CompanyInfo>;
    } catch (error) {
        console.error("Erreur lors de l'analyse de la facture:", error);
        throw new Error("Échec de l'analyse.");
    }
};

export const analyzeClientInfo = async (fileData: { mimeType: string; data: string }): Promise<Partial<import("../types").ClientInfo>> => {
    if (!genAI) throw new Error("L'IA n'est pas configurée.");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    address: { type: SchemaType.STRING },
                    email: { type: SchemaType.STRING },
                },
                required: ["name", "address", "email"],
            }
        }
    });

    const prompt = "Analysez ce document. Identifiez les informations du CLIENT.";
    const imagePart = {
        inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        return JSON.parse(result.response.text()) as Partial<import("../types").ClientInfo>;
    } catch (error) {
        console.error("Erreur lors de l'analyse client:", error);
        throw new Error("Échec de l'analyse.");
    }
};

// Chat with Tools
let chatSession: any = null;

const createInvoiceTool = {
    functionDeclarations: [{
        name: 'create_invoice',
        description: 'Crée une nouvelle facture.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                clientName: { type: SchemaType.STRING, description: 'Nom du client' },
                clientAddress: { type: SchemaType.STRING, description: 'Adresse du client' },
                clientEmail: { type: SchemaType.STRING, description: 'Email du client' },
                dueDate: { type: SchemaType.STRING, description: 'Date échéance (AAAA-MM-JJ)' },
                lineItems: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            description: { type: SchemaType.STRING },
                            quantity: { type: SchemaType.NUMBER },
                            price: { type: SchemaType.NUMBER },
                        },
                        required: ['description', 'quantity', 'price']
                    }
                }
            },
            required: ['clientName', 'lineItems']
        }
    }]
};

export const startChatAndSendMessage = async (userMessage: string) => {
    if (!genAI) throw new Error("L'API Gemini n'est pas configurée.");

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-CA');

    if (!chatSession) {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: [createInvoiceTool],
            systemInstruction: "Vous êtes un assistant de facturation.\nBUT: Créer une facture via 'create_invoice' dès que possible.\nRÈGLES:\n1. Si vous avez Client, Description, Prix -> APPELEZ create_invoice.\n2. Ne demandez pas confirmation.\n3. Taxes automatiques.\n4. Date: " + dateStr + "."
        });
        chatSession = model.startChat();
    }

    try {
        const result = await chatSession.sendMessage(userMessage);
        const response = result.response;
        const calls = response.functionCalls();

        if (calls && calls.length > 0) {
            // Map to expected format
            const mappedCalls = calls.map((call: any) => ({
                name: call.name,
                args: call.args
            }));
            return { functionCalls: mappedCalls };
        }

        return { text: response.text() };
    } catch (error) {
        console.error("Erreur chat:", error);
        return { text: "Désolé, une erreur s'est produite." };
    }
};