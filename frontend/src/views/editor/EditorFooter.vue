<script setup lang="ts">
import { FooterAtom } from 'upov-ui';
import { useEditorStore } from '@/stores/editor';

const store = useEditorStore();
</script>

<template>
  <FooterAtom
    :has-previous-chapter="store.activeChapterIndex > 0"
    :has-next-chapter="store.activeChapterIndex < 10"
    export-label="Export"
    @previous-chapter="store.goPrevious()"
    @next-chapter="store.goNext()"
  />
</template>
