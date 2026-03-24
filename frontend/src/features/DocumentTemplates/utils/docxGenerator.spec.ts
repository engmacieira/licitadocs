import { describe, it, expect, vi } from 'vitest';

// Tenta desmockar explicitamente para evitar vazamento de outros testes
vi.unmock('docx');
vi.unmock('file-saver');

import * as docx from 'docx';
import * as fileSaver from 'file-saver';
import { generateDocx } from './docxGenerator';

describe('docxGenerator final clean', () => {
    it('deve gerar e salvar sem erros de mock', async () => {
        // Spy em vez de mock para ser mais seguro
        const saveAsSpy = vi.spyOn(fileSaver, 'saveAs').mockImplementation(() => {});
        const packerSpy = vi.spyOn(docx.Packer, 'toBlob').mockResolvedValue(new Blob(['test']));

        const mockData = {
            razaoSocial: 'T', cnpj: 'C', endereco: 'E', cidadeUf: 'CU',
            dataAtual: 'D', nomeRepresentante: 'R', cpfRepresentante: 'CP'
        };

        await generateDocx('T', ['B'], mockData, 'f');

        expect(packerSpy).toHaveBeenCalled();
        
        await new Promise(r => setTimeout(r, 100));
        expect(saveAsSpy).toHaveBeenCalled();
        
        saveAsSpy.mockRestore();
        packerSpy.mockRestore();
    });
});
