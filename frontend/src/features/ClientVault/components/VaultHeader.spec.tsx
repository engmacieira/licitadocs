import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, describe, vi } from 'vitest';
import { VaultHeader } from './VaultHeader';

describe('VaultHeader', () => {
    it('deve renderizar o título e a descrição corretamente', () => {
        render(<VaultHeader searchTerm="" setSearchTerm={() => {}} />);

        expect(screen.getByText('Cofre Digital')).toBeInTheDocument();
        expect(screen.getByText('Gerencie e visualize as certidões e documentos da sua empresa.')).toBeInTheDocument();
    });

    it('deve exibir o termo de pesquisa inicial no campo de input', () => {
        render(<VaultHeader searchTerm="certidão" setSearchTerm={() => {}} />);

        const input = screen.getByPlaceholderText('Buscar documentos...');
        expect(input).toHaveValue('certidão');
    });

    it('deve chamar setSearchTerm ao digitar no campo de pesquisa', async () => {
        const mockSetSearchTerm = vi.fn();
        const user = userEvent.setup();

        const Wrapper = ({ onChange }: { onChange: (val: string) => void }) => {
            const [val, setVal] = useState('');
            return (
                <VaultHeader
                    searchTerm={val}
                    setSearchTerm={(newVal) => {
                        setVal(newVal);
                        onChange(newVal);
                    }}
                />
            );
        };
        
        render(<Wrapper onChange={mockSetSearchTerm} />);

        const input = screen.getByPlaceholderText('Buscar documentos...');
        await user.type(input, 'habite-se');

        expect(mockSetSearchTerm).toHaveBeenLastCalledWith('habite-se');
    });
});
