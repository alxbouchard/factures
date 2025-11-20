
import { GoogleGenAI, Type, FunctionDeclaration, Chat } from "@google/genai";
import { CompanyInfo } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    // This is a fallback for development and should not happen in the target environment.
    // In a real app, you might want to show a more user-friendly error.
    console.warn("La variable d'environnement VITE_GEMINI_API_KEY n'est pas définie. Les fonctionnalités Gemini ne fonctionneront pas.");
}

// We create the instance only if the key exists.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateDescription = async (title: string): Promise<string> => {
    if (!ai) {
        return Promise.resolve(title); // Return original title if AI is not configured
    }
    const prompt = `Étant donné le titre de l'article "${title}", rédigez une description d'article professionnelle et concise pour une facture commerciale.Limitez - vous à une seule phrase.N'incluez pas le prix ou la quantité.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erreur lors de la génération de la description:", error);
        // Fallback to the original title on error
        return title;
    }
};

export const generateEmailBody = async (invoiceDetails: string): Promise<string> => {
    if (!ai) {
        const clientName = invoiceDetails.split('Nom du client: ')[1]?.split(',')[0] || 'Client';
        return Promise.resolve(`Bonjour ${clientName},\n\nVeuillez trouver votre facture en pièce jointe.\n\nMerci de faire affaire avec nous.`);
    }
    const prompt = `Rédigez un corps de courriel professionnel et amical pour envoyer une facture à un client. Utilisez les détails suivants en français: ${invoiceDetails}. Le courriel doit être bref et courtois. Adressez-vous au client par son nom. Mentionnez le montant total et la date d'échéance, et informez-le que la facture PDF est jointe à ce courriel.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        const clientName = invoiceDetails.split('Nom du client: ')[1]?.split(',')[0] || 'Client';
        const invoiceNum = invoiceDetails.split('Numéro de facture: ')[1]?.split(',')[0] || '';
        const total = invoiceDetails.split('Total: ')[1]?.split(' CAD')[0] || '';
        console.error("Erreur lors de la génération du corps du courriel:", error);
        return `Bonjour ${clientName},\n\nVeuillez trouver ci-joint la facture ${invoiceNum} d'un montant de ${total} CAD.\n\nCordialement,`;
    }
};

export const generateSmsBody = async (invoiceDetails: string): Promise<string> => {
    const invoiceNum = invoiceDetails.split('Numéro de facture: ')[1]?.split(',')[0] || '';
    if (!ai) {
        return Promise.resolve(`Bonjour. Votre facture ${invoiceNum} est prête. Le document PDF a été envoyé à votre adresse courriel. Merci.`);
    }
    const prompt = `Rédigez un SMS professionnel et très concis (moins de 160 caractères) pour informer un client de sa facture. Utilisez ces détails en français: ${invoiceDetails}. Mentionnez le montant total et la date d'échéance, et précisez que la facture PDF détaillée a été envoyée par courriel.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Erreur lors de la génération du corps du SMS:", error);
        return `Bonjour. Votre facture ${invoiceNum} est prête. Le document PDF a été envoyé à votre adresse courriel. Merci.`;
    }
}

export const analyzeInvoice = async (fileData: { mimeType: string; data: string }): Promise<Partial<CompanyInfo>> => {
    if (!ai) {
        throw new Error("L'IA n'est pas configurée. Veuillez vérifier votre clé API.");
    }

    const prompt = `Vous êtes un expert en extraction de données à partir de documents. Analysez ce document de facture. Identifiez les informations de l'entreprise qui a ÉMIS la facture (pas le client). Extrayez le nom de l'entreprise, son adresse complète, son numéro de téléphone et son adresse e-mail. Ignorez les informations du client, les articles de la facture, les totaux et les taxes. Si une information n'est pas trouvée, retournez une chaîne vide pour cette clé.`;

    const imagePart = {
        inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.data,
        },
    };

    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nom de l'entreprise émettrice" },
                        address: { type: Type.STRING, description: "Adresse complète de l'entreprise" },
                        phone: { type: Type.STRING, description: "Numéro de téléphone de l'entreprise" },
                        email: { type: Type.STRING, description: "Adresse e-mail de l'entreprise" },
                    },
                    required: ["name", "address", "phone", "email"],
                },
            },
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);
        return parsedData as Partial<CompanyInfo>;

    } catch (error) {
        console.error("Erreur lors de l'analyse de la facture:", error);
        throw new Error("Échec de l'analyse du document par l'IA.");
    }
};


const createInvoiceTool: FunctionDeclaration = {
    name: 'create_invoice',
    description: 'Crée une nouvelle facture avec les informations du client et les articles.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            clientName: { type: Type.STRING, description: 'Le nom complet du client.' },
            clientAddress: { type: Type.STRING, description: "L'adresse postale complète du client." },
            clientEmail: { type: Type.STRING, description: "L'adresse courriel du client." },
            dueDate: { type: Type.STRING, description: "La date d'échéance au format AAAA-MM-JJ. Optionnel." },
            lineItems: {
                type: Type.ARRAY,
                description: 'Une liste des articles ou services facturés.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "La description de l'article ou du service." },
                        quantity: { type: Type.NUMBER, description: 'La quantité de cet article.' },
                        price: { type: Type.NUMBER, description: 'Le prix unitaire de cet article.' },
                    },
                    required: ['description', 'quantity', 'price'],
                },
            },
        },
        required: ['clientName', 'lineItems'],
    },
};

let chatInstance: Chat | null = null;

export const startChatAndSendMessage = async (userMessage: string) => {
    if (!ai) {
        throw new Error("L'API Gemini n'est pas configurée.");
    }

    // Get current date info for context
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-CA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Calculate current week (Monday to Friday)
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const weekStr = `${monday.toLocaleDateString('fr-CA')} au ${friday.toLocaleDateString('fr-CA')}`;

    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                tools: [{ functionDeclarations: [createInvoiceTool] }],
                systemInstruction: `Vous êtes un assistant de facturation intelligent et amical pour une application québécoise.

CONTEXTE TEMPOREL IMPORTANT:
- Date d'aujourd'hui: ${dateStr}
- Semaine en cours (lundi à vendredi): ${weekStr}
- Quand l'utilisateur dit "cette semaine", utilisez les dates: lundi ${monday.toLocaleDateString('fr-CA')} au vendredi ${friday.toLocaleDateString('fr-CA')}

INFORMATION IMPORTANTE SUR LES TAXES:
- L'application calcule AUTOMATIQUEMENT la TPS (5%) et la TVQ (9.975%) sur TOUTES les factures
- Vous n'avez PAS besoin d'ajouter les taxes manuellement
- Ne dites JAMAIS que vous ne pouvez pas ajouter les taxes
- Les taxes sont TOUJOURS incluses dans le total final

Votre rôle:
1. Aidez l'utilisateur à créer des factures en conversant naturellement en français québécois
2. Posez des questions pour obtenir les informations manquantes:
   - Nom du client (obligatoire)
   - Description du service/produit (obligatoire)
   - Quantité et prix (obligatoire)
   - Email du client (optionnel mais recommandé pour envoi)
   - Adresse du client (optionnelle)
   
3. Quand vous avez assez d'informations, appelez la fonction create_invoice
4. Soyez concis, amical et efficace
5. Comprenez le français québécois (ex: "omerco" pas "Roberto")
6. Comprenez les références temporelles: "cette semaine", "aujourd'hui", "la semaine passée", etc.

RAPPEL: Les taxes TPS/TVQ sont AUTOMATIQUES - ne demandez jamais si l'utilisateur veut les ajouter, elles sont déjà là!`
            }
        });
    }

    try {
        const result = await chatInstance.sendMessage({ message: userMessage });
        const { functionCalls, text } = result;

        if (functionCalls && functionCalls.length > 0) {
            return { functionCalls };
        }

        return { text: text.trim() };

    } catch (error) {
        console.error("Erreur lors de l'interaction avec le chat Gemini:", error);
        return { text: "Désolé, une erreur s'est produite lors du traitement de votre demande." };
    }
};