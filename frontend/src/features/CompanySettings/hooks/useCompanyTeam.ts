import { useState, useCallback } from 'react';
import { companyService } from '../../../services/companyService';
import type { MemberResponse } from '../../../types';

export function useCompanyTeam(companyId: string | undefined) {
    const [team, setTeam] = useState<MemberResponse[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);

    const loadTeamData = useCallback(async () => {
        if (!companyId) return;
        setIsLoadingTeam(true);
        try {
            const members = await companyService.getTeam(companyId);
            setTeam(members);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingTeam(false);
        }
    }, [companyId]);

    return {
        team,
        isLoadingTeam,
        loadTeamData
    };
}
