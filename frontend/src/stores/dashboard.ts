import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import api from '@/services/api';
import type {
  DashboardStats,
  TestGuidelineListItem,
  TestGuidelineDetail,
  TestGuidelinesResponse,
  IeComment,
} from '@/types';

export type DashboardTab = 'active' | 'adopted' | 'archived';

export const useDashboardStore = defineStore('dashboard', () => {
  const testGuidelines = ref<TestGuidelineListItem[]>([]);
  const stats = ref<DashboardStats>({
    total: 0,
    draft: 0,
    ieComments: 0,
    leChecking: 0,
    active: 0,
    adopted: 0,
    archive: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeTab = ref<DashboardTab>('active');
  const selectedTgId = ref<number | null>(null);
  const selectedTgDetail = ref<TestGuidelineDetail | null>(null);
  const detailLoading = ref(false);
  const ieComments = ref<IeComment[]>([]);
  const ieCommentsLoading = ref(false);

  let fetchAbortController: AbortController | null = null;

  const tabCounts = computed(() => ({
    active: stats.value.active,
    adopted: stats.value.adopted,
    archive: stats.value.archive,
  }));

  async function fetchTestGuidelines(): Promise<void> {
    fetchAbortController?.abort();
    fetchAbortController = new AbortController();

    loading.value = true;
    error.value = null;
    try {
      const url = `/api/test-guidelines?tab=${activeTab.value}`;
      const response = await api.get<TestGuidelinesResponse>(url, {
        signal: fetchAbortController.signal,
      });
      testGuidelines.value = response.data.items || [];
    } catch (err) {
      if (axios.isCancel(err)) return;
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

  async function fetchTgDetail(id: number): Promise<void> {
    detailLoading.value = true;
    try {
      const response = await api.get<TestGuidelineDetail>(
        `/api/test-guidelines/${id}`,
      );
      selectedTgDetail.value = response.data;
    } catch (err) {
      console.error('Failed to fetch TG detail:', err);
      selectedTgDetail.value = null;
    } finally {
      detailLoading.value = false;
    }
  }

  async function fetchIeComments(id: number): Promise<void> {
    ieCommentsLoading.value = true;
    try {
      const response = await api.get<IeComment[]>(`/api/test-guidelines/${id}/ie-comments`);
      ieComments.value = response.data;
    } catch (err) {
      console.error('Failed to fetch IE comments:', err);
      ieComments.value = [];
    } finally {
      ieCommentsLoading.value = false;
    }
  }

  function selectTg(id: number): void {
    if (selectedTgId.value === id) {
      selectedTgId.value = null;
      selectedTgDetail.value = null;
      ieComments.value = [];
      return;
    }
    selectedTgId.value = id;
    fetchTgDetail(id);
    fetchIeComments(id);
  }

  function setTab(tab: DashboardTab): void {
    activeTab.value = tab;
    selectedTgId.value = null;
    selectedTgDetail.value = null;
    ieComments.value = [];
    fetchTestGuidelines();
  }

  return {
    testGuidelines,
    tabCounts,
    stats,
    loading,
    error,
    activeTab,
    selectedTgId,
    selectedTgDetail,
    detailLoading,
    ieComments,
    ieCommentsLoading,
    fetchTestGuidelines,
    fetchStats,
    fetchTgDetail,
    selectTg,
    setTab,
  };
});
