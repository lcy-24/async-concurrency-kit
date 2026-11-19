/** 暂停指定毫秒 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 给 Promise 加超时，超时抛出错误 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

export interface RetryOptions {
  /** 最大重试次数（不含首次），默认 3 */
  retries?: number
  /** 首次重试延迟（毫秒），默认 300 */
  delay?: number
  /** 退避倍数，默认 2（指数退避） */
  backoff?: number
  /** 单次延迟上限（毫秒），默认无上限 */
  maxDelay?: number
  /** 判断某次错误是否值得重试。默认排除 4xx（客户端错误），网络错误 / 5xx / 普通异常才重试 */
  shouldRetry?: (error: unknown, attempt: number) => boolean
  /** 每次重试前的回调 */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

/** 从错误对象提取 HTTP 状态码（兼容 axios 的 response.status 和 fetch 的 status） */
function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const e = error as { status?: unknown; response?: { status?: unknown } }
    if (typeof e.status === 'number') return e.status
    if (e.response && typeof e.response.status === 'number') return e.response.status
  }
  return undefined
}

/** 默认重试策略：4xx（客户端错误）不重试，网络错误 / 5xx / 普通异常才重试 */
function defaultShouldRetry(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status === undefined) return true
  return status < 400 || status >= 500
}

/**
 * 指数退避重试：fn 失败后按 delay * backoff^attempt 的延迟重试。
 */
export async function retry<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 300,
    backoff = 2,
    maxDelay = Infinity,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === retries || !shouldRetry(err, attempt)) throw err
      const waitMs = Math.min(delay * Math.pow(backoff, attempt), maxDelay)
      onRetry?.(err, attempt, waitMs)
      await sleep(waitMs)
    }
  }

  throw lastError
}
