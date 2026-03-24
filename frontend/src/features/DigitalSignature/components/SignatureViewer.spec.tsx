import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SignatureViewer } from './SignatureViewer';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the document components using a standard factory
vi.mock('../../../components/signature/ContractDocument', () => {
    return {
        ContractDocument: ({ razaoSocial }: any) => (
            <div data-testid="contract-document">
                Mocked Contract: {razaoSocial}
            </div>
        )
    };
});

vi.mock('../../../components/signature/ProxyDocument', () => {
    return {
        ProxyDocument: ({ razaoSocial }: any) => (
            <div data-testid="proxy-document">
                Mocked Proxy: {razaoSocial}
            </div>
        )
    };
});

describe('SignatureViewer', () => {
    afterEach(cleanup);
    
    const mockSetActiveTab = vi.fn();
    const mockHandlePrint = vi.fn();
    const mockContractRef = { current: null };
    const mockProxyRef = { current: null };
    
    const companyData = {
        razaoSocial: 'Empresa Teste LTDA',
        cnpj: '12.345.678/0001-99'
    };

    const defaultProps = {
        activeTab: 'contract' as 'contract' | 'proxy',
        setActiveTab: mockSetActiveTab,
        handlePrint: mockHandlePrint,
        contractRef: mockContractRef as any,
        proxyRef: mockProxyRef as any,
        companyData
    };

    it('should render correctly with contract tab active', () => {
        render(<SignatureViewer {...defaultProps} />);
        
        expect(screen.getByText(/visualiza/i)).toBeInTheDocument();
        expect(screen.getByText(/Salvar/i)).toBeInTheDocument();
        
        const contractTab = screen.getByRole('button', { name: /Contrato SaaS/i });
        expect(contractTab).toBeInTheDocument();
        
        expect(screen.getByTestId('contract-document')).toBeInTheDocument();
        expect(screen.getByText(/Mocked Contract: Empresa Teste LTDA/i)).toBeInTheDocument();
    });

    it('should render correctly with proxy tab active', () => {
        render(<SignatureViewer {...defaultProps} activeTab="proxy" />);
        
        expect(screen.getByText(/Salvar/i)).toBeInTheDocument();
        
        const proxyTab = screen.getByRole('button', { name: /^Procur/i });
        expect(proxyTab).toBeInTheDocument();
        
        expect(screen.getByTestId('proxy-document')).toBeInTheDocument();
        expect(screen.getByText(/Mocked Proxy: Empresa Teste LTDA/i)).toBeInTheDocument();
    });

    it('should call setActiveTab when tabs are clicked', async () => {
        const user = userEvent.setup();
        render(<SignatureViewer {...defaultProps} />);
        
        const proxyTab = screen.getByRole('button', { name: /^Procur/i });
        await user.click(proxyTab);
        
        expect(mockSetActiveTab).toHaveBeenCalledWith('proxy');
        
        const contractTab = screen.getByRole('button', { name: /Contrato SaaS/i });
        await user.click(contractTab);
        expect(mockSetActiveTab).toHaveBeenCalledWith('contract');
    });

    it('should call handlePrint when print button is clicked', async () => {
        const user = userEvent.setup();
        render(<SignatureViewer {...defaultProps} />);
        
        const printButton = screen.getByText(/Salvar/i);
        await user.click(printButton);
        
        expect(mockHandlePrint).toHaveBeenCalled();
    });
});
