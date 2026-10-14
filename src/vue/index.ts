import { defineComponent, h, onMounted, onBeforeUnmount, ref, shallowRef, watch, useId, type PropType } from 'vue';
import { hasData } from '../resource';
import { isLayoutSnapshot, type QualityReport } from '../quality/compare';
import type { CheckerOptions } from '../quality/checker';
import type { Animation, LayoutSnapshot, Resource, ScanOptions } from '../types';
import { observeLayout, observeQuality } from '../web/observe';

export * from '../core';

export const Skeleton = defineComponent({
  name: 'SkeloSkeleton',
  props: {
    layout: Object as PropType<LayoutSnapshot>,
    animation: { type: String as PropType<Animation>, default: 'pulse' },
    scan: Object as PropType<ScanOptions>,
    minHeight: { type: [Number, String], default: 24 },
  },
  setup(props, { slots }) {
    const root = ref<HTMLElement>();
    const measured = shallowRef<LayoutSnapshot>();
    let stop: (() => void) | undefined;
    const restart = () => {
      stop?.();
      measured.value = undefined;
      if (!props.layout && root.value) stop = observeLayout(root.value, props.scan ?? {}, next => {
        if (JSON.stringify(measured.value) !== JSON.stringify(next)) measured.value = next;
      });
    };
    onMounted(restart);
    watch([root, () => props.layout, () => JSON.stringify(props.scan)], restart, { flush: 'post' });
    onBeforeUnmount(() => stop?.());
    return () => {
      if (props.layout && !isLayoutSnapshot(props.layout)) throw new Error('Skeleton layout must be a valid version 1 snapshot.');
      const layout = props.layout ?? measured.value;
      const usable = layout && layout.complete && layout.width > 0 && layout.height > 0 && layout.bones.length > 0;
      return h('div', { class: 'lr-skeleton', 'aria-hidden': 'true',
        'data-loading-capture': layout && !layout.complete ? 'incomplete' : usable ? 'measured' : slots.template || props.layout ? 'unmeasured' : 'fallback',
        'data-loading-capture-reason': layout?.reason,
        style: { minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight, ...(props.layout ? { height: `${props.layout.height}px` } : {}) },
      }, [slots.template && !props.layout ? h('div', { ref: root, class: 'lr-template', inert: true, 'data-loading-template': '' }, slots.template()) : null,
        usable ? h('div', { class: 'lr-overlay', 'data-loading-overlay': '' }, layout.bones.map(bone => h('span', {
          key: bone.key, class: `lr-bone lr-${props.animation}`, 'data-loading-key': bone.key, 'data-skeleton-shape': bone.kind,
          style: { left: `${bone.x / layout.width * 100}%`, top: `${bone.y}px`, width: `${bone.width / layout.width * 100}%`,
            height: `${bone.height}px`, borderRadius: bone.kind === 'circle' ? '50%' : `${bone.radius}px` },
        }))) : h('div', { class: `lr-bone lr-fallback lr-${props.animation}`, 'data-loading-key': 'fallback' })]);
    };
  },
});

export const LoadingRegion = defineComponent({
  name: 'SkeloLoadingRegion',
  props: {
    resource: { type: Object as PropType<Resource<unknown>>, required: true },
    id: String,
    layout: Object as PropType<LayoutSnapshot>,
    scan: Object as PropType<ScanOptions>,
    animation: { type: String as PropType<Animation>, default: 'pulse' },
    minHeight: { type: [Number, String], default: 24 },
    onRetry: Function as PropType<() => void>,
    label: { type: String, default: 'Loading content' },
    refreshLabel: { type: String, default: 'Updating content' },
    errorLabel: { type: String, default: 'Could not load this content' },
    retryLabel: { type: String, default: 'Try again' },
  },
  setup(props, { slots }) {
    const generatedId = useId();
    return () => {
      const state = props.resource;
      const available = hasData(state);
      const busy = state.status === 'pending' || state.status === 'refreshing';
      const error = () => slots.error ? slots.error({ error: state.status === 'error' ? state.error : undefined }) :
        h('div', { class: 'lr-error' }, [h('span', props.errorLabel), props.onRetry ? h('button', { type: 'button', onClick: props.onRetry }, props.retryLabel) : null]);
      return h('div', { 'data-skelo-wrapper': '' }, [h('div', { 'data-loading-region': props.id ?? generatedId,
        'data-loading-state': state.status, 'aria-busy': busy }, [
        h('div', { 'data-loading-content': '' }, available ? slots.default?.({ data: state.data }) : state.status === 'error' ? error() :
          slots.fallback ? slots.fallback() : h(Skeleton, { ...(props.layout ? { layout: props.layout } : {}), ...(props.scan ? { scan: props.scan } : {}), minHeight: props.minHeight, animation: props.animation }, slots.template ? { template: slots.template } : {})),
        available && state.status === 'error' ? h('div', { role: 'alert', 'data-skeleton-ignore': '' }, error()) : null,
        !available && state.status === 'error' ? h('span', { class: 'lr-sr-only', role: 'alert', 'data-skeleton-ignore': '' }, props.errorLabel) : null,
      ]), h('span', { class: 'lr-sr-only', role: 'status', 'aria-live': 'polite', 'data-skeleton-ignore': '' }, busy ? state.status === 'refreshing' ? props.refreshLabel : props.label : '')]);
    };
  },
});

export const QualityBoundary = defineComponent({
  name: 'SkeloQualityBoundary',
  props: {
    onReport: { type: Function as PropType<(report: QualityReport) => void>, required: true },
    options: Object as PropType<CheckerOptions>,
    enabled: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const root = ref<HTMLElement>();
    let stop: (() => void) | undefined;
    const restart = () => {
      stop?.();
      if (props.enabled && root.value) stop = observeQuality(root.value, props.options ?? {}, report => props.onReport(report));
    };
    onMounted(restart);
    watch([() => props.enabled, () => JSON.stringify(props.options)], restart, { flush: 'post' });
    onBeforeUnmount(() => stop?.());
    return () => h('div', { ref: root, 'data-loading-quality': '' }, slots.default?.());
  },
});
