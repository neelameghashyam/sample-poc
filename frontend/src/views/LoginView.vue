<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Logo, Button, Spinner, CenteredPage, Card } from 'upov-ui';

type LoginState = 'detecting' | 'wipo-network' | 'chooser' | 'external';

const router = useRouter();
const authStore = useAuthStore();

const state = ref<LoginState>('detecting');
let redirectTimer: ReturnType<typeof setTimeout>;

async function detectWipoNetwork(): Promise<boolean> {
  try {
    await fetch('https://intranet.wipo.int/', {
      mode: 'no-cors',
      signal: AbortSignal.timeout(3000),
    });
    return true;
  } catch {
    return false;
  }
}

onMounted(async () => {
  if (authStore.isDevMode) {
    state.value = 'chooser';
    return;
  }

  const onWipoNetwork = await detectWipoNetwork();

  if (onWipoNetwork) {
    state.value = 'wipo-network';
    redirectTimer = setTimeout(() => {
      if (state.value === 'wipo-network') {
        authStore.loginEntraID();
      }
    }, 3000);
  } else {
    state.value = 'external';
  }
});

function cancelRedirect(): void {
  clearTimeout(redirectTimer);
  state.value = 'chooser';
}

async function handleDevLogin(): Promise<void> {
  await authStore.devLogin();
  router.push('/dashboard');
}
</script>

<template>
  <CenteredPage background="linear-gradient(135deg, var(--color-primary-green-dark) 0%, var(--color-primary-green-bright) 100%)">
    <Card elevation="high" padding="spacious" max-width="400px" centered>
      <div class="login-logo">
        <Logo size="large" />
      </div>
      <h1 class="login-title">TG Template</h1>

      <!-- Detecting network -->
      <template v-if="state === 'detecting'">
        <Spinner :diameter="32" message="Detecting network..." />
      </template>

      <!-- WIPO network: auto-redirect to EntraID -->
      <template v-if="state === 'wipo-network'">
        <p class="login-subtitle">
          Redirecting to <strong>WIPO Entra ID</strong>
          <a href="#" class="cancel-link" @click.prevent="cancelRedirect">Cancel</a>
        </p>
        <div class="progress-bar">
          <div class="progress-bar-fill" />
        </div>
      </template>

      <!-- Chooser: both providers -->
      <template v-if="state === 'chooser'">
        <p class="login-subtitle">Sign in with your account</p>
        <p class="idp-header">Log in with</p>
        <Button type="primary" size="medium" block @click="authStore.loginEntraID">
          Sign in with WIPO Entra ID
        </Button>
        <Button type="secondary" size="medium" block style="margin-top: 12px" @click="authStore.loginForgeRock">
          Sign in with WIPO Account
        </Button>
      </template>

      <!-- External: only ForgeRock -->
      <template v-if="state === 'external'">
        <p class="login-subtitle">Sign in with your account</p>
        <Button type="primary" size="medium" block @click="authStore.loginForgeRock">
          Sign in with WIPO Account
        </Button>
      </template>

      <!-- Dev mode bypass (all states except detecting) -->
      <div v-if="authStore.isDevMode && state !== 'detecting'" class="dev-mode">
        <hr class="divider" />
        <p class="dev-label">Development Mode</p>
        <Button type="tertiary" size="medium" block @click="handleDevLogin">
          Dev Login (bypass OAuth)
        </Button>
      </div>
    </Card>
  </CenteredPage>
</template>

<style scoped>
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
  animation: progress 3s ease-in-out forwards;
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
