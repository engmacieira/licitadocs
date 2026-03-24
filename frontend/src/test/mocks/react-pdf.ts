import { vi } from 'vitest';

export const PDFDownloadLink = ({ children }: any) => children({ loading: false });
export const PDFViewer = ({ children }: any) => children;
export const Document = ({ children }: any) => children;
export const Page = ({ children }: any) => children;
export const Text = ({ children }: any) => children;
export const View = ({ children }: any) => children;
export const StyleSheet = { create: (s: any) => s };
export const Font = { register: vi.fn() };

export default {
    PDFDownloadLink,
    PDFViewer,
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font
};
