export interface DebounceOptions {
  /** 是否在首次触发时立即执行，默认 false */
  leading?: boolean
  /** 是否在等待结束后执行最后一次，默认 true */
  trailing?: boolean
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** 取消待执行的调用 */
  cancel: () => void
  /** 立即执行当前积压的调用 */
  flush: () => void
}

/**
 * 防抖：wait 毫秒内没有再次调用才执行。
 * - 默认 trailing：连续触发只在停止后执行最后一次
 * - leading: true：首次触发立即执行，之后等待期内不再重复执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 0,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: unknown = null
  let lastInvokeTime = 0

  function invoke() {
    lastInvokeTime = Date.now()
    const args = lastArgs
    const ctx = lastThis
    lastArgs = null
    lastThis = null
    if (args) fn.apply(ctx, args)
  }

  function debounced(this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    lastArgs = args
    lastThis = this
    if (timer) clearTimeout(timer)

    if (leading && now - lastInvokeTime >= wait) {
      invoke()
    }

    if (trailing) {
      timer = setTimeout(() => {
        timer = null
        if (lastArgs !== null) invoke()
      }, wait)
    }
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
    lastThis = null
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (lastArgs !== null) invoke()
  }

  return debounced
}
