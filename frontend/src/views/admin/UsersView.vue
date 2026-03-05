<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useAdminUsersStore } from '@/stores/admin-users';
import { useAuthStore } from '@/stores/auth';
import {
  Tabs, DataTable, Button, Chip, StatusBadge,
  ActionMenu, Modal, Select, Alert, PaginationNav,
} from 'upov-ui';
import type { TabItem, DataTableColumn, ActionMenuItem, SelectOption, DataTableSortState } from 'upov-ui';
import type { AdminUser } from '@/types';

const store = useAdminUsersStore();
const authStore = useAuthStore();
const activeTab = ref('pending');

const tabs = computed<TabItem[]>(() => [
  { id: 'pending', label: `Pending Requests (${store.pendingUsers.length})` },
  { id: 'all', label: 'All Users' },
]);

function onTabChange(tab: TabItem) {
  activeTab.value = tab.id;
  if (tab.id === 'all' && store.allUsers.length === 0) {
    store.fetchAllUsers();
  }
}

// Pending tab columns
const pendingColumns: DataTableColumn[] = [
  { key: 'fullName', label: 'Name', width: '200px' },
  { key: 'email', label: 'Email', width: '240px' },
  { key: 'officeName', label: 'Organization/Country', width: '200px' },
  { key: 'twps', label: 'TWPs', width: '200px' },
  { key: 'actions', label: '', width: '180px' },
];

// All Users tab columns
const allUsersColumns: DataTableColumn[] = [
  { key: 'userName', label: 'User Name', width: '160px', filterable: true },
  { key: 'fullName', label: 'Full Name', width: '200px', filterable: true },
  { key: 'email', label: 'Email', width: '240px', filterable: true },
  { key: 'roleCode', label: 'Role', width: '120px' },
  { key: 'officeName', label: 'Organization/Country', width: '180px' },
  { key: 'twps', label: 'TWPs', width: '160px' },
  { key: 'leTgNames', label: 'LE of TG', width: '200px' },
  { key: 'lastUpdated', label: 'Last Login', width: '120px', sortable: true },
  { key: 'actions', label: '', width: '60px' },
];

// Filtering, Sorting + Pagination
const currentPage = ref(1);
const itemsPerPage = 20;
const filterValues = ref<Record<string, string>>({});
const sortState = ref<DataTableSortState>({ key: '', direction: null });

const filteredUsers = computed(() => {
  const filters = filterValues.value;
  const keys = Object.keys(filters).filter((k) => filters[k]);
  if (keys.length === 0) return store.allUsers;
  return store.allUsers.filter((row) =>
    keys.every((key) => {
      const cell = String((row as any)[key] ?? '').toLowerCase();
      return cell.includes(filters[key].toLowerCase());
    }),
  );
});

const sortedUsers = computed(() => {
  const { key, direction } = sortState.value;
  if (!key || !direction) return filteredUsers.value;
  return [...filteredUsers.value].sort((a, b) => {
    const aVal = (a as any)[key] ?? '';
    const bVal = (b as any)[key] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'asc' ? cmp : -cmp;
  });
});

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedUsers.value.slice(start, start + itemsPerPage);
});

function onFilter(values: Record<string, string>) {
  filterValues.value = values;
  currentPage.value = 1;
}

function onSort(state: DataTableSortState) {
  sortState.value = state;
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

const roleVariant: Record<string, 'info' | 'success' | 'warning'> = {
  ADM: 'info',
  EXP: 'success',
  TRN: 'warning',
};

const roleLabels: Record<string, string> = {
  ADM: 'Admin',
  EXP: 'Expert',
  TRN: 'Translator',
};

const roleOptions: SelectOption[] = [
  { value: 'ADM', label: 'Admin' },
  { value: 'EXP', label: 'Expert' },
  { value: 'TRN', label: 'Translator' },
];

const actionMenuItems: ActionMenuItem[] = [
  { id: 'change-role', label: 'Change Role', icon: 'pencil' },
  { id: 'delete', label: 'Delete', icon: 'trash', danger: true, separator: true },
];

function formatDate(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// Pending tab actions
async function handleApprove(id: number) {
  try {
    await store.approveUser(id);
  } catch {
    // Error is logged in store
  }
}

async function handleReject(id: number) {
  try {
    await store.rejectUser(id);
  } catch {
    // Error is logged in store
  }
}

// Change Role modal
const showRoleModal = ref(false);
const roleModalUser = ref<AdminUser | null>(null);
const selectedRole = ref('');
const roleUpdating = ref(false);

function openRoleModal(user: AdminUser) {
  roleModalUser.value = user;
  selectedRole.value = user.roleCode;
  showRoleModal.value = true;
}

async function confirmRoleChange() {
  if (!roleModalUser.value || !selectedRole.value) return;
  roleUpdating.value = true;
  try {
    await store.updateUserRole(roleModalUser.value.id, selectedRole.value);
    showRoleModal.value = false;
  } catch (err) {
    console.error('Failed to update role:', err);
  } finally {
    roleUpdating.value = false;
  }
}

// Delete modal
const showDeleteModal = ref(false);
const deleteModalUser = ref<AdminUser | null>(null);
const deleteError = ref('');
const deleting = ref(false);

function openDeleteModal(user: AdminUser) {
  deleteModalUser.value = user;
  if (user.leTgNames) {
    const count = user.leTgNames.split('||').length;
    deleteError.value = `Cannot delete user assigned as Leading Expert to ${count} test guideline(s). Remove LE assignments first.`;
  } else {
    deleteError.value = '';
  }
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!deleteModalUser.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    await store.deleteUser(deleteModalUser.value.id);
    showDeleteModal.value = false;
  } catch (err: any) {
    const msg = err?.response?.data?.error?.message;
    deleteError.value = msg || 'Failed to delete user.';
  } finally {
    deleting.value = false;
  }
}

function onActionSelect(item: ActionMenuItem, user: AdminUser) {
  if (item.id === 'change-role') {
    openRoleModal(user);
  } else if (item.id === 'delete') {
    openDeleteModal(user);
  }
}

onMounted(() => {
  store.fetchPendingUsers();
});
</script>

<template>
  <div class="users-view">
    <Tabs :tabs="tabs" :active-tab-id="activeTab" @tab-change="onTabChange" />

    <!-- Pending Requests Tab -->
    <div v-if="activeTab === 'pending'" class="tab-content">
      <DataTable
        :columns="pendingColumns"
        :rows="store.pendingUsers"
        row-key="id"
        :loading="store.loading"
        empty-message="No pending access requests."
      >
        <template #cell-twps="{ row }">
          <div class="twp-chips">
            <Chip
              v-for="code in (row.twps || '').split(',')"
              :key="code"
              :label="code.trim()"
              size="small"
              :removable="false"
              variant="tonal"
            />
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="action-buttons">
            <Button type="primary" size="small" @click.stop="handleApprove(row.id)">
              Approve
            </Button>
            <Button type="secondary" size="small" @click.stop="handleReject(row.id)">
              Reject
            </Button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- All Users Tab -->
    <div v-else class="tab-content">
      <DataTable
        :columns="allUsersColumns"
        :rows="pagedUsers"
        row-key="id"
        :loading="store.loadingAll"
        empty-message="No users found."
        filter-mode="remote"
        :filter-values="filterValues"
        @update:filter-values="filterValues = $event"
        @filter="onFilter"
        :sort-state="sortState"
        @sort="onSort"
      >
        <template #cell-roleCode="{ row }">
          <StatusBadge
            :label="roleLabels[row.roleCode] || row.roleCode"
            :variant="roleVariant[row.roleCode] || 'neutral'"
          />
        </template>

        <template #cell-twps="{ row }">
          <div v-if="row.twps" class="twp-chips">
            <Chip
              v-for="code in row.twps.split(',')"
              :key="code"
              :label="code.trim()"
              size="small"
              :removable="false"
              variant="tonal"
            />
          </div>
        </template>

        <template #cell-leTgNames="{ row }">
          <span v-if="row.leTgNames">{{ row.leTgNames.split('||').join(', ') }}</span>
        </template>

        <template #cell-lastUpdated="{ row }">
          {{ formatDate(row.lastUpdated) }}
        </template>

        <template #cell-actions="{ row }">
          <ActionMenu
            v-if="row.userName?.toUpperCase() !== authStore.user?.username?.toUpperCase()"
            :items="actionMenuItems"
            @select="(item: ActionMenuItem) => onActionSelect(item, row)"
          />
        </template>
      </DataTable>

      <PaginationNav
        :current-page="currentPage"
        :total-items="sortedUsers.length"
        :items-per-page="itemsPerPage"
        @page-change="onPageChange"
      />
    </div>

    <!-- Change Role Modal -->
    <Modal v-model:open="showRoleModal" title="Change Role" max-width="420px">
      <template v-if="roleModalUser">
        <p class="modal-label">
          Changing role for <strong>{{ roleModalUser.fullName }}</strong>
        </p>
        <Select
          v-model="selectedRole"
          :options="roleOptions"
          placeholder="Select role"
        />
      </template>
      <template #footer>
        <Button type="secondary" size="small" @click="showRoleModal = false">Cancel</Button>
        <Button
          type="primary"
          size="small"
          :disabled="!selectedRole || selectedRole === roleModalUser?.roleCode || roleUpdating"
          @click="confirmRoleChange"
        >
          {{ roleUpdating ? 'Saving...' : 'Save' }}
        </Button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model:open="showDeleteModal" title="Delete User" max-width="480px">
      <template v-if="deleteModalUser">
        <Alert v-if="deleteError" variant="error" title="Cannot delete user">
          {{ deleteError }}
        </Alert>
        <p v-else>
          Are you sure you want to remove the access for <strong>{{ deleteModalUser.fullName }}</strong>?
          This action cannot be undone.
        </p>
      </template>
      <template #footer>
        <template v-if="deleteError">
          <Button type="primary" size="small" @click="showDeleteModal = false">OK</Button>
        </template>
        <template v-else>
          <Button type="secondary" size="small" @click="showDeleteModal = false">Cancel</Button>
          <Button
            type="danger"
            size="small"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </Button>
        </template>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.users-view {
  max-width: 1400px;
  margin: 0 auto;
}

.tab-content {
  margin-top: 16px;
}

.twp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}


</style>
