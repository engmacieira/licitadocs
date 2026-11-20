"""
Serviço de integração com a API pública do PNCP (Portal Nacional de Contratações Públicas).
Responsável por consultar contratações, extrair fornecedores/vencedores e sincronizar leads.
"""

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.repositories.pncp_lead_repository import PncpLeadRepository
from app.schemas.pncp_lead_schemas import PncpLeadSyncResponse, PncpLeadUpsert

logger = logging.getLogger("app.services.pncp_service")


class PncpService:
    """Cliente resiliente para captura e sincronização de leads a partir do PNCP."""

    PNCP_CONSULTA_URL = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao"
    PNCP_API_BASE_URL = "https://pncp.gov.br/api/pncp/v1"
    DEFAULT_TIMEOUT = 20.0
    MAX_ITEMS_PER_CONTRATACAO = 10

    @staticmethod
    def _clean_str(value: Any) -> Optional[str]:
        if value is None:
            return None
        cleaned = str(value).strip()
        return cleaned or None

    @classmethod
    def _build_origem_pncp(cls, contratacao: dict[str, Any]) -> Optional[str]:
        numero_controle = cls._clean_str(contratacao.get("numeroControlePNCP"))
        orgao_entidade = contratacao.get("orgaoEntidade") or {}
        orgao_nome = cls._clean_str(orgao_entidade.get("razaoSocial"))

        if numero_controle and orgao_nome:
            return f"{numero_controle} - {orgao_nome}"
        if numero_controle:
            return numero_controle

        cnpj_orgao = cls._clean_str(orgao_entidade.get("cnpj"))
        ano = contratacao.get("anoCompra")
        seq = contratacao.get("sequencialCompra")
        if cnpj_orgao and ano and seq:
            return f"PNCP {cnpj_orgao}/{ano}-{seq}"
        return orgao_nome

    @classmethod
    def _parse_lead_payload(
        cls,
        raw_fornecedor: dict[str, Any],
        contratacao: dict[str, Any],
    ) -> Optional[PncpLeadUpsert]:
        raw_doc = (
            raw_fornecedor.get("niFornecedor")
            or raw_fornecedor.get("cnpjFornecedor")
            or raw_fornecedor.get("cnpj")
            or raw_fornecedor.get("cpfCnpj")
        )
        digits = re.sub(r"\D", "", str(raw_doc or ""))
        if len(digits) != 14:
            return None

        razao_social = (
            cls._clean_str(raw_fornecedor.get("nomeRazaoSocialFornecedor"))
            or cls._clean_str(raw_fornecedor.get("razaoSocial"))
            or cls._clean_str(raw_fornecedor.get("nomeFornecedor"))
            or cls._clean_str(raw_fornecedor.get("nome"))
        )
        if not razao_social:
            return None

        unidade_orgao = contratacao.get("unidadeOrgao") or {}
        uf = (
            cls._clean_str(raw_fornecedor.get("uf"))
            or cls._clean_str(raw_fornecedor.get("ufSigla"))
            or cls._clean_str(unidade_orgao.get("ufSigla"))
        )
        municipio = (
            cls._clean_str(raw_fornecedor.get("municipio"))
            or cls._clean_str(raw_fornecedor.get("municipioNome"))
            or cls._clean_str(unidade_orgao.get("municipioNome"))
        )

        try:
            return PncpLeadUpsert(
                cnpj=digits,
                razao_social=razao_social,
                nome_fantasia=cls._clean_str(raw_fornecedor.get("nomeFantasia")),
                email=(
                    cls._clean_str(raw_fornecedor.get("email"))
                    or cls._clean_str(raw_fornecedor.get("emailFornecedor"))
                ),
                telefone=(
                    cls._clean_str(raw_fornecedor.get("telefone"))
                    or cls._clean_str(raw_fornecedor.get("telefoneFornecedor"))
                ),
                uf=uf,
                municipio=municipio,
                porte=(
                    cls._clean_str(raw_fornecedor.get("porteFornecedorNome"))
                    or cls._clean_str(raw_fornecedor.get("porte"))
                ),
                origem_pncp=cls._build_origem_pncp(contratacao),
            )
        except (ValidationError, ValueError):
            return None

    @classmethod
    async def _fetch_contratacoes_page(
        cls,
        client: httpx.AsyncClient,
        data_inicial: str,
        data_final: str,
        codigo_modalidade: int,
        pagina: int,
        tamanho_pagina: int,
        uf: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {
            "dataInicial": data_inicial,
            "dataFinal": data_final,
            "codigoModalidadeContratacao": codigo_modalidade,
            "pagina": pagina,
            "tamanhoPagina": tamanho_pagina,
        }
        if uf:
            params["uf"] = uf.strip().upper()

        response = await client.get(cls.PNCP_CONSULTA_URL, params=params)
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            data = payload.get("data") or payload.get("items") or []
            if isinstance(data, list):
                return [item for item in data if isinstance(item, dict)]
        return []

    @classmethod
    async def _fetch_fornecedores_from_contratacao(
        cls,
        client: httpx.AsyncClient,
        contratacao: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        Extrai fornecedores diretamente do payload da contratação (quando presente)
        ou consulta os itens e resultados da compra no PNCP.
        """
        inline_fornecedores: list[dict[str, Any]] = []
        if isinstance(contratacao.get("fornecedores"), list):
            inline_fornecedores.extend(
                item for item in contratacao["fornecedores"] if isinstance(item, dict)
            )
        if any(
            contratacao.get(key)
            for key in ("niFornecedor", "cnpjFornecedor", "cpfCnpj")
        ):
            inline_fornecedores.append(contratacao)
        if inline_fornecedores:
            return inline_fornecedores

        orgao_entidade = contratacao.get("orgaoEntidade") or {}
        cnpj_orgao = re.sub(r"\D", "", str(orgao_entidade.get("cnpj") or ""))
        ano_compra = contratacao.get("anoCompra")
        sequencial_compra = contratacao.get("sequencialCompra")
        if not (cnpj_orgao and ano_compra and sequencial_compra):
            return []

        itens_url = (
            f"{cls.PNCP_API_BASE_URL}/orgaos/{cnpj_orgao}/compras/"
            f"{ano_compra}/{sequencial_compra}/itens"
        )
        try:
            itens_resp = await client.get(itens_url)
            if itens_resp.status_code == 404:
                return []
            itens_resp.raise_for_status()
            itens_data = itens_resp.json()
        except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError, ValueError):
            return []

        if not isinstance(itens_data, list):
            return []

        fornecedores: list[dict[str, Any]] = []
        for item in itens_data[: cls.MAX_ITEMS_PER_CONTRATACAO]:
            if not isinstance(item, dict):
                continue
            numero_item = item.get("numeroItem")
            if numero_item is None:
                continue

            resultados_url = f"{itens_url}/{numero_item}/resultados"
            try:
                res_resp = await client.get(resultados_url)
                if res_resp.status_code == 404:
                    continue
                res_resp.raise_for_status()
                resultados = res_resp.json()
                if isinstance(resultados, list):
                    fornecedores.extend(r for r in resultados if isinstance(r, dict))
                elif isinstance(resultados, dict):
                    fornecedores.append(resultados)
            except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError, ValueError):
                continue

        return fornecedores

    @classmethod
    async def sync_leads(
        cls,
        db: Session,
        uf: Optional[str] = None,
        dias_retroativos: int = 7,
        codigo_modalidade: int = 6,
        max_paginas: int = 2,
        tamanho_pagina: int = 50,
        client: Optional[httpx.AsyncClient] = None,
    ) -> PncpLeadSyncResponse:
        """
        Consulta contratações recentes no PNCP, extrai fornecedores com CNPJ válido
        e executa upsert seguro preservando histórico anti-SPAM.
        """
        now_utc = datetime.now(timezone.utc)
        data_final = now_utc.strftime("%Y%m%d")
        data_inicial = (now_utc - timedelta(days=dias_retroativos)).strftime("%Y%m%d")

        summary = PncpLeadSyncResponse()
        seen_cnpjs: set[str] = set()

        owns_client = client is None
        http_client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(cls.DEFAULT_TIMEOUT),
            headers={"Accept": "application/json"},
        )

        try:
            for pagina in range(1, max_paginas + 1):
                try:
                    contratacoes = await cls._fetch_contratacoes_page(
                        client=http_client,
                        data_inicial=data_inicial,
                        data_final=data_final,
                        codigo_modalidade=codigo_modalidade,
                        pagina=pagina,
                        tamanho_pagina=tamanho_pagina,
                        uf=uf,
                    )
                except httpx.TimeoutException as exc:
                    msg = f"Timeout ao consultar PNCP (página {pagina}): {exc}"
                    logger.warning(msg)
                    summary.errors.append(msg)
                    break
                except httpx.HTTPStatusError as exc:
                    msg = f"Erro HTTP {exc.response.status_code} ao consultar PNCP (página {pagina})"
                    logger.warning(msg)
                    summary.errors.append(msg)
                    break
                except httpx.RequestError as exc:
                    msg = f"Erro de rede ao consultar PNCP (página {pagina}): {exc}"
                    logger.warning(msg)
                    summary.errors.append(msg)
                    break
                except ValueError as exc:
                    msg = f"Payload inválido do PNCP (página {pagina}): {exc}"
                    logger.warning(msg)
                    summary.errors.append(msg)
                    break

                if not contratacoes:
                    break

                for contratacao in contratacoes:
                    fornecedores = await cls._fetch_fornecedores_from_contratacao(
                        http_client,
                        contratacao,
                    )
                    for raw_fornecedor in fornecedores:
                        summary.fetched += 1
                        lead_upsert = cls._parse_lead_payload(raw_fornecedor, contratacao)
                        if not lead_upsert:
                            summary.skipped += 1
                            continue

                        if lead_upsert.cnpj in seen_cnpjs:
                            summary.skipped += 1
                            continue
                        seen_cnpjs.add(lead_upsert.cnpj)

                        try:
                            _, created = PncpLeadRepository.upsert_from_pncp(db, lead_upsert)
                            if created:
                                summary.created += 1
                            else:
                                summary.updated += 1
                        except ValueError as exc:
                            summary.errors.append(str(exc))

                if len(contratacoes) < tamanho_pagina:
                    break
        finally:
            if owns_client:
                await http_client.aclose()

        return summary
