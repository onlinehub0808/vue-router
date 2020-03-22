import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  ref,
  ComponentPublicInstance,
} from 'vue'
import { RouteLocationMatched } from '../types'
import {
  matchedRouteKey,
  viewDepthKey,
  routeLocationKey,
} from '../utils/injectionSymbols'

export const View = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
  },

  setup(props, { attrs }) {
    const route = inject(routeLocationKey)!
    const depth: number = inject(viewDepthKey, 0)
    provide(viewDepthKey, depth + 1)

    const matchedRoute = computed(
      () => route.value.matched[depth] as RouteLocationMatched | undefined
    )
    const ViewComponent = computed(
      () => matchedRoute.value && matchedRoute.value.components[props.name]
    )

    const propsData = computed(() => {
      // propsData only gets called if ViewComponent.value exists and it depends on matchedRoute.value
      const { props } = matchedRoute.value!
      if (!props) return {}
      if (props === true) return route.value.params

      return typeof props === 'object' ? props : props(route.value)
    })

    provide(matchedRouteKey, matchedRoute)

    const viewRef = ref<ComponentPublicInstance>()

    function onVnodeMounted() {
      // if we mount, there is a matched record
      matchedRoute.value!.instances[props.name] = viewRef.value
      // TODO: trigger beforeRouteEnter hooks
    }

    return () => {
      return ViewComponent.value
        ? h(ViewComponent.value as any, {
            ...propsData.value,
            ...attrs,
            onVnodeMounted,
            ref: viewRef,
          })
        : null
    }
  },
})
