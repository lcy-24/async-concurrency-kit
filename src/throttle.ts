export interface ThrottleOptions {
  /** 是否立即执行第一次，默认 true */
  leading?: boolean
  /** 是否在节流期结束时执行最后一次，默认 true */
  trailing?: boolean
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  /** 取消待执行的调用 */
  cancel: () => void
  /** 立即执行当前积压的调用 */
  flush: () => void
}

/**
 * 节流：在 wait 毫秒内最多执行一次。
 * - 默认 leading：第一次立即执行，之后每 wait 毫秒最多一次
 * - trailing: true：节流期内的最后一次调用会在结束时执行
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait = 0,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: unknown = null
  let previous = 0

  function invoke(time: number) {
    previous = time
    const args = lastArgs
    const ctx = lastThis
    lastArgs = null
    lastThis = null
    if (args) fn.apply(ctx, args)
  }

  function throttled(this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    lastArgs = args
    lastThis = this

    if (leading && now - previous >= wait) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      invoke(now)
      return
    }

    if (trailing && !timer) {
      timer = setTimeout(() => {
        timer = null
        invoke(Date.now())
      }, wait)
    }
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
    lastThis = null
  }

  throttled.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      invoke(Date.now())
    }
  }

  return throttled
}
