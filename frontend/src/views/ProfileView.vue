<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import { Alert, Button, CheckboxGroup, FormField, PageHeader, Card, Icon } from 'upov-ui';
import type { StatusBadgeVariant } from 'upov-ui';

const router = useRouter();
const authStore = useAuthStore();

const roleLabelMap: Record<string, string> = { ADM: 'Admin', EXP: 'Expert', TRN: 'Translator' };
const roleVariantMap: Record<string, StatusBadgeVariant> = { ADM: 'info', EXP: 'success', TRN: 'warning' };
const roleCode = computed(() => authStore.user?.roles?.[0] || '');
const roleLabel = computed(() => roleLabelMap[roleCode.value] || roleCode.value);
const roleVariant = computed<StatusBadgeVariant>(() => roleVariantMap[roleCode.value] || 'neutral');

const twpCodes = ref<string[]>(
  authStore.user?.twps
    ? authStore.user.twps.split(',').map((c) => c.trim()).filter(Boolean)
    : []
);
const twpOptions = [
  { value: 'TWA', label: 'TWA - Agricultural Crops' },
  { value: 'TWF', label: 'TWF - Fruit Crops' },
  { value: 'TWO', label: 'TWO - Ornamental Plants' },
  { value: 'TWV', label: 'TWV - Vegetables' },
];

const saving = ref(false);
const error = ref<string | null>(null);

const selectedTwps = computed(() => twpCodes.value.join(','));

const hasChanges = computed(() => {
  const current = authStore.user?.twps || '';
  return selectedTwps.value !== current;
});

const isValid = computed(() => twpCodes.value.length > 0 && hasChanges.value);

async function handleSave() {
  if (!isValid.value) return;
  saving.value = true;
  error.value = null;
  try {
    const res = await api.patch<{ message: string; twps: string; assigned: number }>('/api/profile/twps', {
      twps: selectedTwps.value,
    });
    await authStore.fetchUser();
    const msg = res.data.assigned > 0
      ? `TWPs updated. You were assigned as IE to ${res.data.assigned} new test guideline(s).`
      : 'TWPs updated.';
    sessionStorage.setItem('toast', msg);
    router.push('/documents');
  } catch (err: unknown) {
    error.value = 'Failed to update TWPs. Please try again.';
    console.error('Update TWPs error:', err);
  } finally {
    saving.value = false;
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function handleClose() {
  router.back();
}
</script>

<template>
  <div class="profile-page">
    <Card elevation="medium" max-width="560px">
      <div class="profile-header">
        <PageHeader title="Profile" :status-badge-label="roleLabel" :status-badge-variant="roleVariant" />
        <button class="logout-icon" title="Logout" @click="handleLogout">
          <Icon icon="box-arrow-right" />
        </button>
      </div>

      <div class="profile-info">
        <div class="field-inline">
          <span class="field-label">Username</span>
          <span class="field-value">{{ authStore.user?.username || '' }}</span>
        </div>

        <div class="field-inline">
          <span class="field-label">Full Name</span>
          <span class="field-value">{{ authStore.user?.name || '' }}</span>
        </div>

        <div class="field-inline">
          <span class="field-label">Email</span>
          <span class="field-value">{{ authStore.user?.email || '' }}</span>
        </div>

        <div class="field-inline">
          <span class="field-label">Organization</span>
          <span class="field-value">{{ authStore.user?.officeCode || '' }}</span>
        </div>
      </div>

      <Alert v-if="error" variant="error" class="profile-alert">{{ error }}</Alert>

      <div v-if="!authStore.isAdmin" class="profile-form">
        <FormField label="Technical Working Parties">
          <CheckboxGroup v-model="twpCodes" :options="twpOptions" />
        </FormField>

        <div class="profile-actions">
          <Button type="primary" :disabled="!isValid || saving" @click="handleSave">
            {{ saving ? 'Saving...' : 'Save' }}
          </Button>
          <Button type="secondary" @click="handleClose">Back</Button>
        </div>

      </div>
      <div v-else class="profile-actions">
        <Button type="secondary" @click="handleClose">Back</Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  justify-content: center;
  padding: 48px 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-neutral-200);
  padding-bottom: 12px;
}

.profile-header :deep(.page-header) {
  border-bottom: none;
  padding-bottom: 0;
}

.logout-icon {
  display: flex;
  align-items: center;
  padding: 6px;
  border: 1px solid var(--color-neutral-400);
  background: none;
  color: var(--color-neutral-400);
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.125rem;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

.logout-icon:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
  background: var(--color-bg-light);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  margin-bottom: 24px;
}

.profile-alert {
  margin-bottom: 16px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--color-neutral-200);
}

.field-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.field-label {
  color: var(--color-text-secondary);
  white-space: nowrap;
  min-width: 90px;
}

.field-value {
  color: var(--color-text-primary);
}
</style>
