import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to manage unread message count for both Admin and Client users.
 * Performs a lightweight polling every 10 minutes, and allows manual refresh.
 */
export function useUnreadCount() {
    const { user, currentCompany } = useAuth();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchUnreadCount = useCallback(async () => {
        // If not authenticated, or if client doesn't have a selected company
        if (!user) return;
        if (user.role === 'client' && !currentCompany?.id) return;

        setLoading(true);
        try {
            let response;
            if (user.role === 'admin') {
                response = await api.get('/messages/admin/unread-count');
            } else {
                response = await api.get(`/messages/${currentCompany?.id}/unread-count`);
            }
            setUnreadCount(response.data.unread_count || 0);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        } finally {
            setLoading(false);
        }
    }, [user, currentCompany]);

    useEffect(() => {
        fetchUnreadCount();

        // 10 minutes interval (10 * 60 * 1000)
        const intervalId = setInterval(fetchUnreadCount, 600000);

        return () => clearInterval(intervalId);
    }, [fetchUnreadCount]);

    return {
        unreadCount,
        loading,
        fetchUnreadCount,
    };
}
