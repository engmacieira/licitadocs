"""
Interface Base para Automação (Motor Strategy).
Garante que todos os robôs tenham uma estrutura padronizada.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseCrawler(ABC):
    def __init__(self, execution_params: Dict[str, Any] = None):
        """
        Recebe os parâmetros dinâmicos.
        Aqui injetaremos o CNPJ da empresa, Inscrição Estadual, ou os `extra_params` do banco.
        """
        self.execution_params = execution_params or {}

    @abstractmethod
    def fetch(self) -> dict:
        """
        Método principal que DEVE ser implementado por cada robô.
        Deve retornar um dicionário padronizado com o resultado da busca.
        """
        pass