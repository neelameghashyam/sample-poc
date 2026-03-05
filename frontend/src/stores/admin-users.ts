import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import type { PendingUser, AdminUser } from '@/types';

export const useAdminUsersStore = defineStore('admin-users', () => {
  const pendingUsers = ref<PendingUser[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const allUsers = ref<AdminUser[]>([]);
  const loadingAll = ref(false);
  const errorAll = ref<string | null>(null);

  async function fetchPendingUsers() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<{ items: PendingUser[] }>('/api/admin/access-requests');
      pendingUsers.value = res.data.items;
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      error.value = 'Failed to load pending requests.';
    } finally {
      loading.value = false;
    }
  }

  async function approveUser(id: number) {
    try {
      await api.post(`/api/admin/access-requests/${id}/approve`);
      pendingUsers.value = pendingUsers.value.filter((u) => u.id !== id);
    } catch (err) {
      console.error('Failed to approve user:', err);
      throw err;
    }
  }

  async function rejectUser(id: number) {
    try {
      await api.post(`/api/admin/access-requests/${id}/reject`);
      pendingUsers.value = pendingUsers.value.filter((u) => u.id !== id);
    } catch (err) {
      console.error('Failed to reject user:', err);
      throw err;
    }
  }

  async function fetchAllUsers() {
    loadingAll.value = true;
    errorAll.value = null;
    try {
      const res = await api.get<{ items: AdminUser[] }>('/api/admin/users');
      allUsers.value = res.data.items;
    } catch (err) {
      console.error('Failed to fetch all users:', err);
      errorAll.value = 'Failed to load users.';
    } finally {
      loadingAll.value = false;
    }
  }

  async function updateUserRole(id: number, roleCode: string) {
    await api.put(`/api/admin/users/${id}/role`, { roleCode });
    const user = allUsers.value.find((u) => u.id === id);
    if (user) {
      user.roleCode = roleCode;
    }
  }

  async function deleteUser(id: number) {
    await api.delete(`/api/admin/users/${id}`);
    allUsers.value = allUsers.value.filter((u) => u.id !== id);
  }

  return {
    pendingUsers,
    loading,
    error,
    allUsers,
    loadingAll,
    errorAll,
    fetchPendingUsers,
    approveUser,
    rejectUser,
    fetchAllUsers,
    updateUserRole,
    deleteUser,
  };
});
