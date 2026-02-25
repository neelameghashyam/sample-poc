<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Logo, Button } from 'upov-ui';

const router = useRouter();
const authStore = useAuthStore();

const redirecting = ref(true);
const cancelled = ref(false);
let redirectTimer: ReturnType<typeof setTimeout>;

onMounted(() => {
  if (authStore.isDevMode) {
    redirecting.value = false;
    cancelled.value = true;
    return;
  }
  redirectTimer = setTimeout(() => {
    if (redirecting.value) {
      authStore.loginEntraID();
    }
  }, 1500);
});

function cancelRedirect(): void {
  clearTimeout(redirectTimer);
  redirecting.value = false;
  cancelled.value = true;
}

async function handleDevLogin(): Promise<void> {
  await authStore.devLogin();
  router.push('/dashboard');
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <Logo size="large" />
      </div>
      <h1 class="login-title">TG Template</h1>

      <!-- Redirecting state -->
      <template v-if="redirecting">
        <p class="login-subtitle">
          Redirecting to <strong>WIPO Entra ID</strong>
          <a href="#" class="cancel-link" @click.prevent="cancelRedirect">Cancel</a>
        </p>
        <div class="progress-bar">
          <div class="progress-bar-fill" />
        </div>
      </template>

      <!-- Cancelled / chooser state -->
      <template v-if="cancelled">
        <p class="login-subtitle">Sign in with your account</p>
        <p class="idp-header">Log in with</p>
        <Button type="primary" size="medium" class="login-btn" @click="authStore.loginEntraID">
          Sign in with WIPO Entra ID
        </Button>
        <Button type="secondary" size="medium" class="login-btn login-btn--alt" @click="authStore.loginForgeRock">
          Sign in with WIPO Account
        </Button>
      </template>

      <!-- Dev mode bypass -->
      <div v-if="authStore.isDevMode" class="dev-mode">
        <hr class="divider" />
        <p class="dev-label">Development Mode</p>
        <Button type="tertiary" size="medium" class="login-btn" @click="handleDevLogin">
          Dev Login (bypass OAuth)
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-green-dark) 0%, var(--color-primary-green-bright) 100%);
}

.login-card {
  background: var(--color-bg-white);
  padding: 48px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.login-logo {
  margin-bottom: 24px;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-green-dark);
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.cancel-link {
  margin-left: 0.75em;
  color: var(--color-text-secondary);
  text-decoration: underline;
  font-size: 0.875rem;
}

.progress-bar {
  height: 4px;
  background: var(--color-border-light, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary-green-bright, #4caf50);
  border-radius: 2px;
  animation: progress 1.5s ease-in-out forwards;
}

@keyframes progress {
  from { width: 0; }
  to { width: 100%; }
}

.idp-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
}

.login-btn :deep(.upov-btn) {
  width: 100%;
}

.login-btn--alt {
  margin-top: 12px;
}

.dev-mode {
  margin-top: 24px;
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 16px 0;
}

.dev-label {
  font-size: 0.75rem;
  color: var(--color-orange);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}
</style>
