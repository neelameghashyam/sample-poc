<script setup lang="ts">
import { ref, computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Button, Card, Select } from 'upov-ui';
import type { SelectOption } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';
import { useTinymce } from '@/composables/useTinymce';
import type { Explanation } from '@/types/editor';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';

const store = useEditorStore();
const { apiKey, init: tinymceInit } = useTinymce({ height: 250 });

const explanations = computed<Explanation[]>(() => store.chapters['08']?.explanations ?? []);
const characteristics = computed(() => store.chapters['07']?.characteristics ?? []);

// Map TOC_ID → explanation for quick lookup
const explByTocId = computed(() => {
  const map: Record<number, Explanation> = {};
  for (const e of explanations.value) {
    map[e.TOC_ID] = e;
  }
  return map;
});

// Characteristics that don't have an explanation yet
const charsWithoutExpl = computed(() =>
  characteristics.value.filter((c: any) => !explByTocId.value[c.TOC_ID]),
);


}

// ── Add explanation ──────────────────────────────────────────────────────────
const selectedTocIdStr = ref('');

const charSelectOptions = computed<SelectOption[]>(() =>
  charsWithoutExpl.value.map((c: any) => ({
    value: String(c.TOC_ID),
    label: `${c.CharacteristicOrder}. ${c.TOC_Name}`,
  })),
);

async function addExplanation() {
  if (!selectedTocIdStr.value) return;
  await editorApi.createExplanation(store.tgId!, {
    TOC_ID: Number(selectedTocIdStr.value),
    Explaination_Text: '',
  });
  selectedTocIdStr.value = '';
  await refreshExplanations();
}

// ── Delete explanation ───────────────────────────────────────────────────────
async function deleteExplanation(explId: number) {
  await editorApi.deleteExplanation(store.tgId!, explId);
  await refreshExplanations();
}

// ── Autosave explanation text ────────────────────────────────────────────────
const saveTimers: Record<number, ReturnType<typeof setTimeout>> = {};

function onExplanationChange(expl: Explanation, content: string) {
  expl.Explaination_Text = content;
  const id = expl.Explanation_ID;
  if (saveTimers[id]) clearTimeout(saveTimers[id]);
  saveTimers[id] = setTimeout(async () => {
    try {
      await editorApi.updateExplanation(store.tgId!, id, {
        Explaination_Text: content,
      });
    } catch (err) {
      console.error('Failed to save explanation:', err);
    }
  }, 500);
}

// ── Helper ───────────────────────────────────────────────────────────────────
function charName(tocId: number): string {
  const char = characteristics.value.find((c: any) => c.TOC_ID === tocId);
  return char ? `${char.CharacteristicOrder}. ${char.TOC_Name}` : `TOC_ID ${tocId}`;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <p v-if="characteristics.length === 0" style="font-size: 14px; color: var(--color-neutral-500)">
      No characteristics defined yet. Add characteristics in Chapter 7 first.
    </p>

    <template v-else>
      <!-- Existing explanations -->
      <Card v-for="expl in explanations" :key="expl.Explanation_ID" elevation="low" padding="compact">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f0f0f0">
          <h3 style="font-size: 15px; font-weight: 600; color: var(--color-primary-green-dark); margin: 0">Ad. {{ charName(expl.TOC_ID) }}</h3>
          <Button type="danger" size="small" icon-left="x-lg" @click="deleteExplanation(expl.Explanation_ID)" />
        </div>
        <div style="padding: 12px 16px 16px">
          <Editor
            :model-value="expl.Explaination_Text || ''"
            :api-key="apiKey"
            :init="tinymceInit"
            @update:model-value="onExplanationChange(expl, $event)"
          />
        </div>
      </Card>

      <!-- Add explanation -->
      <div v-if="charsWithoutExpl.length > 0" style="padding-top: 4px">
        <div style="display: flex; gap: 8px; align-items: center">
          <Select
            v-model="selectedTocIdStr"
            :options="charSelectOptions"
            placeholder="Add explanation for characteristic..."
            style="flex: 1; min-width: 0"
          />
          <Button type="primary" :disabled="!selectedTocIdStr" @click="addExplanation">+ Add</Button>
        </div>
      </div>

      <p v-if="explanations.length === 0 && charsWithoutExpl.length > 0" style="font-size: 14px; color: #999">
        No explanations added yet. Select a characteristic above to add an explanation.
      </p>
    </template>

    <!-- ── Chapter-level Preview (end of chapter) ── -->
    <ChapterPreview :chapter-number="8">
      <div style="display: flex; flex-direction: column; gap: 12px">
        <p style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.4px">8. Explanations</p>
        <p v-if="explanations.length === 0" style="color: var(--color-neutral-500); font-style: italic">No explanations added yet.</p>
        <div
          v-for="expl in explanations"
          :key="'prev-' + expl.Explanation_ID"
          style="border-bottom: 1px solid rgba(0,0,0,0.07); padding-bottom: 10px"
        >
          <p style="font-size: 13px; font-weight: 600; color: var(--color-neutral-700); margin-bottom: 4px">Ad. {{ charName(expl.TOC_ID) }}</p>
          <div v-if="expl.Explaination_Text" v-html="expl.Explaination_Text" style="font-size: 13px"></div>
          <em v-else style="color: var(--color-neutral-500); font-size: 13px">No explanation text yet</em>
        </div>
      </div>
    </ChapterPreview>

  </div>
</template>
