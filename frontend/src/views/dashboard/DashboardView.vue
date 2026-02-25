<script setup lang="ts">
import { onMounted } from 'vue';
import { useDashboardStore } from '@/stores/dashboard';
import { PageHeader } from 'upov-ui';
import StatsCard from '@/components/common/StatsCard.vue';
import TestGuidelinesTable from '@/components/common/TestGuidelinesTable.vue';

const dashboardStore = useDashboardStore();

onMounted(() => {
  dashboardStore.fetchStats();
  dashboardStore.fetchTestGuidelines();
});
</script>

<template>
  <div class="dashboard">
    <PageHeader title="Dashboard" />

    <div class="stats-grid">
      <StatsCard
        title="Total TGs"
        :value="dashboardStore.stats.total"
        icon="bar-chart-fill"
      />
      <StatsCard
        title="LE Draft"
        :value="dashboardStore.stats.draft"
        icon="pencil-square"
        color="#d57c35"
      />
      <StatsCard
        title="IE Comments"
        :value="dashboardStore.stats.ieComments"
        icon="chat-dots"
        color="#3585cb"
      />
      <StatsCard
        title="LE Checking"
        :value="dashboardStore.stats.leChecking"
        icon="check-circle"
        color="#009a6e"
      />
      <StatsCard
        title="Adopted"
        :value="dashboardStore.stats.adopted"
        icon="trophy"
        color="#46b2a0"
      />
    </div>

    <section class="recent-section">
      <h2 class="section-title">Recent Test Guidelines</h2>
      <TestGuidelinesTable
        :items="dashboardStore.testGuidelines"
        :loading="dashboardStore.loading"
      />
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.recent-section {
  background: var(--color-bg-white);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text);
}
</style>
