<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { Card, Links } from 'upov-ui';
import ChapterPreview from '@/components/editor/shared/ChapterPreview.vue';
import { useEditorStore } from '@/stores/editor';
import { useChapterPreview } from '@/composables/useChapterPreview';
import { useTinymce } from '@/composables/useTinymce';

const store = useEditorStore();
const { apiKey, init } = useTinymce({ height: 400 });
const { previewHtml, previewLoading, previewError, needsRefresh, markDirty, handleRefresh } =
  useChapterPreview('09');

// Null-safe: DB returns null for unset LiteratureReferences
const data = computed(() => store.chapters['09'] ?? {});

function onContentChange(value: string) {
  // DB field: LiteratureReferences (ALLOWED_FIELDS in chapter-09.repo.js)
  store.autosave('09', 'LiteratureReferences', value);
  markDirty();
}
</script>

<template>
  <ChapterPreview
    v-if="data"
    :loading="previewLoading"
    :needs-refresh="needsRefresh"
    @refresh="handleRefresh"
  >
    <template #edit>
      <Card elevation="low">
        <div style="display: flex; flex-direction: column; gap: 12px">

          <!--
            legacy: <h4>9. Literature</h4>
            Matches the tab label and section heading in legacy JSP
          -->
          <h2 style="font-size: 18px; font-weight: 700; color: var(--color-neutral-800); line-height: 22px">
            9. Literature
          </h2>

          <!--
            legacy right-hand sidebar link:
            <a href="JavaScript:display('GN30');">Literature (GN 30)</a>
          -->
          <Links :links="[{ text: 'Literature (GN 30)' }]" />

          <!--
            legacy: <form:label path="literatureReferences">Literature References:</form:label>
            Appears directly above the TinyMCE editor
          -->
          <label style="font-size: 14px; font-weight: 400; color: var(--color-neutral-800); line-height: 20px">
            Literature References:
          </label>

          <!--
            legacy: form:textarea id="literatureReferences" wrapped with TinyMCE
            DB field: LiteratureReferences  →  ALLOWED_FIELDS: LiteratureReferences
            Null-safe: ?? '' prevents null crashing TinyMCE on initial load
          -->
          <Editor
            :model-value="(data as any).LiteratureReferences ?? ''"
            :api-key="apiKey"
            :init="init"
            @update:model-value="onContentChange"
          />

          <!--
            legacy: <label> below the textarea showing the format hint
            "(Literature should be presented as follows: for ex [Surname 1], [Initials 1].,
             [Surname 2], [Initials 2] etc., [Year]: [Title]. [Publication]. [Town],
             [City / Region], [Country*], [pp. n1 to n2 or x pp.] )"
          -->
          <p style="font-size: 13px; font-weight: 400; color: var(--color-neutral-600); line-height: 18px; margin: 0">
            (<strong>Literature should be presented as follows:</strong> for ex [Surname 1], [Initials 1].,
            [Surname 2], [Initials 2] etc.,<br />
            [Year]:&nbsp; [Title].&nbsp; [Publication].&nbsp; [Town], [City / Region], [Country*],
            [pp. n1 to n2&nbsp; or&nbsp; x pp.] )
          </p>

        </div>
      </Card>
    </template>

    <div v-if="previewError" style="color: #D32F2F; font-size: 13px">⚠ {{ previewError }}</div>
    <div v-else-if="previewHtml" v-html="previewHtml" />
  </ChapterPreview>
</template>