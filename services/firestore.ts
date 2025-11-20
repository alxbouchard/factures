import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { CompanyInfo, Invoice } from '../types';

export const saveCompanyInfo = async (userId: string, info: CompanyInfo) => {
    const userRef = doc(db, 'users', userId);
    // We store company info in a subcollection or just a field in the user document. 
    // Let's store it in a dedicated document under a subcollection 'settings' or just directly in the user doc if it's the only setting.
    // Plan said: users/{userId}/companyInfo
    // Actually, let's use a subcollection 'settings' and doc 'companyInfo' to be clean, or just a doc 'companyInfo' in a root collection 'companies'?
    // The plan said: users/{userId}/companyInfo. This implies a subcollection named 'companyInfo' ? No, probably a document.
    // Let's do: users/{userId}/settings/companyInfo

    const companyInfoRef = doc(db, 'users', userId, 'settings', 'companyInfo');
    await setDoc(companyInfoRef, info);
};

export const getCompanyInfo = async (userId: string): Promise<CompanyInfo | null> => {
    const companyInfoRef = doc(db, 'users', userId, 'settings', 'companyInfo');
    const docSnap = await getDoc(companyInfoRef);

    if (docSnap.exists()) {
        return docSnap.data() as CompanyInfo;
    } else {
        return null;
    }
};

export const saveInvoice = async (userId: string, invoice: Invoice) => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoice.id);
    await setDoc(invoiceRef, invoice);
};

export const getInvoices = async (userId: string): Promise<Invoice[]> => {
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    // Order by invoice number or date? Let's try invoiceNumber desc or created date if we had it.
    // Invoice ID has timestamp, so we can sort by ID or just fetch all and sort in client.
    // Let's fetch all.
    const q = query(invoicesRef);
    const querySnapshot = await getDocs(q);

    const invoices: Invoice[] = [];
    querySnapshot.forEach((doc) => {
        invoices.push(doc.data() as Invoice);
    });

    // Sort by invoice number desc (assuming numeric strings)
    invoices.sort((a, b) => parseInt(b.invoiceNumber) - parseInt(a.invoiceNumber));

    return invoices;
};

export const deleteInvoice = async (userId: string, invoiceId: string) => {
    const invoiceRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
};
