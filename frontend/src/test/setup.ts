import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Mock global do @react-pdf/renderer para evitar erro de transformação do Vite
vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: ({ children }: any) => children({ loading: false }),
    PDFViewer: ({ children }: any) => children,
    Document: ({ children }: any) => children,
    Page: ({ children }: any) => children,
    Text: ({ children }: any) => children,
    View: ({ children }: any) => children,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() }
}));

// Mock do docx (evita erros de transformação do Vite)
vi.mock('docx', () => ({
    Document: vi.fn(),
    Packer: { toBlob: vi.fn() },
    Paragraph: vi.fn(),
    TextRun: vi.fn(),
    AlignmentType: {},
    HeadingLevel: {},
    Header: vi.fn(),
    Footer: vi.fn(),
    ImageRun: vi.fn(),
    ExternalHyperlink: vi.fn(),
    Table: vi.fn(),
    TableRow: vi.fn(),
    TableCell: vi.fn(),
    VerticalAlign: {},
    WidthType: {},
    BorderStyle: {}
}));

// Mock do file-saver
vi.mock('file-saver', () => ({
    saveAs: vi.fn()
}));

// Mock do window.URL (necessário para alguns componentes de PDF/Blob)
if (typeof window !== 'undefined') {
    window.URL.createObjectURL = vi.fn();
}

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
