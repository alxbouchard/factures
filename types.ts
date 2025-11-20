export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null; // base64 encoded image
}

export interface ClientInfo {
  name: string;
  address: string;
  email: string;
}

export interface LineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

export type ThemeColor = 'light' | 'dark';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientInfo: ClientInfo;
  lineItems: LineItem[];
}

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'model' | 'loading';
}