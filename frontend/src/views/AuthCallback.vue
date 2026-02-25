<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { AuthProvider } from '@/types';
import { Spinner, Button } from 'upov-ui';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const error = ref<string | null>(null);

function parseProvider(stateParam: unknown): AuthProvider {
  if (typeof stateParam !== 'string') return 'forgerock';
  try {
    const parsed = JSON.parse(atob(stateParam));
    return parsed.provider === 'entraid' ? 'entraid' : 'forgerock';
  } catch {
    return 'forgerock';
  }
}

onMounted(async () => {
  const code = route.query.code;
  if (typeof code !== 'string') {
    error.value = 'No authorization code received';
    return;
  }

  const provider = parseProvider(route.query.state);
  const success = await authStore.handleCallback(code, provider);
  if (success) {
    const redirect = (route.query.redirect as string) || '/dashboard';
    router.push(redirect);
  } else {
    error.value = 'Authentication failed. Please try again.';
  }
});
</script>

<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="error" class="error">
        <p>{{ error }}</p>
        <RouterLink to="/login" class="retry-link">
          <Button type="primary" size="small">Back to Login</Button>
        </RouterLink>
      </div>
      <div v-else class="loading">
        <Spinner :diameter="48" message="Signing you in..." />
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-light);
}

.callback-card {
  background: var(--color-bg-white);
  padding: 48px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error p {
  color: var(--color-danger);
  margin-bottom: 16px;
}

.retry-link {
  text-decoration: none;
}
</style>
