with open("frontend/src/services/adminService.ts", "r") as f:
    content = f.read()

import_statement = "import { PaginatedAuditLogs, AuditLogFilters } from '../schemas/audit';\n"
if "PaginatedAuditLogs" not in content:
    content = content.replace("import api from './api';", f"import api from './api';\n{import_statement}")

method_code = """    },

    // ==========================================
    // 📊 AUDITORIA (Audit Trail)
    // ==========================================

    /**
     * Busca o histórico de auditoria paginado e com filtros aplicados.
     */
    getAuditLogs: async (filters: AuditLogFilters): Promise<PaginatedAuditLogs> => {
        // Remove undefined values to not send `param=undefined` in query
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        );

        const response = await api.get<PaginatedAuditLogs>('/admin/audit-logs', {
            params: cleanFilters
        });
        return response.data;
    }
};
"""

if "getAuditLogs" not in content:
    content = content.replace("        }\n    }\n};", "        }\n    }\n" + method_code)

with open("frontend/src/services/adminService.ts", "w") as f:
    f.write(content)
