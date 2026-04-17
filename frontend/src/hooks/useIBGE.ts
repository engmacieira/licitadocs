import { useState, useEffect } from 'react';

interface UF {
    sigla: string;
    nome: string;
}

interface City {
    nome: string;
}

export function useIBGE(selectedUf?: string) {
    const [ufs, setUfs] = useState<UF[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(res => res.json())
            .then(data => setUfs(data))
            .catch(err => console.error("Erro ao buscar UFs:", err));
    }, []);

    useEffect(() => {
        if (!selectedUf) {
            setCities([]);
            return;
        }
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
            .then(res => res.json())
            .then(data => setCities(data))
            .catch(err => console.error("Erro ao buscar Cidades:", err));
    }, [selectedUf]);

    return { ufs, cities };
}
