import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import type { DashboardStats, TestGuidelineListItem, TestGuidelinesResponse } from '@/types';

export const useDashboardStore = defineStore('dashboard', () => {
  const testGuidelines = ref<TestGuidelineListItem[]>([]);
  const stats = ref<DashboardStats>({
    total: 0,
    draft: 0,
    ieComments: 0,
    leChecking: 0,
    adopted: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTestGuidelines(filters: Record<string, string> = {}): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get<TestGuidelinesResponse>(`/api/test-guidelines?${params}`);
      testGuidelines.value = response.data.items || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch test guidelines:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats(): Promise<void> {
    try {
      const response = await api.get<DashboardStats>('/api/dashboard/stats');
      stats.value = response.data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  return {
    testGuidelines,
    stats,
    loading,
    error,
    fetchTestGuidelines,
    fetchStats,
  };
});
