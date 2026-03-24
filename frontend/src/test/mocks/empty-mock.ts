import { vi } from 'vitest';

export const Document = vi.fn();
export const Packer = { toBlob: vi.fn(), toBuffer: vi.fn() };
export const Paragraph = vi.fn();
export const TextRun = vi.fn();
export const AlignmentType = {};
export const HeadingLevel = {};
export const Header = vi.fn();
export const Footer = vi.fn();
export const ImageRun = vi.fn();
export const ExternalHyperlink = vi.fn();
export const Table = vi.fn();
export const TableRow = vi.fn();
export const TableCell = vi.fn();
export const VerticalAlign = {};
export const WidthType = {};
export const BorderStyle = {};
export const saveAs = vi.fn();

export default {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    Header,
    Footer,
    ImageRun,
    ExternalHyperlink,
    Table,
    TableRow,
    TableCell,
    VerticalAlign,
    WidthType,
    BorderStyle,
    saveAs
};
