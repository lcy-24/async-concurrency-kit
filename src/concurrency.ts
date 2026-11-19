/**
 * 并发限制器：限制同时执行的异步任务数量。
 * 超出的任务排队，前面的完成后依次补位。
 */
export type LimitFn = <T>(fn: () => Promise<T> | T) => Promise<T>

export function pLimit(concurrency: number): LimitFn {
  if (concurrency < 1) throw new Error('concurrency must be >= 1')
  let activeCount = 0
  const queue: Array<() => void> = []

  function next() {
    activeCount--
    if (queue.length > 0) queue.shift()!()
  }

  function run<T>(fn: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const runner = () => {
        activeCount++
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(next)
      }
      if (activeCount < concurrency) {
        runner()
      } else {
        queue.push(runner)
      }
    })
  }

  return run
}

/** 并发 map：对数组每一项执行 mapper，同时最多 concurrency 个在跑 */
export async function pMap<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R> | R,
  concurrency: number
): Promise<R[]> {
  const limit = pLimit(concurrency)
  const tasks = items.map((item, index) => limit(() => mapper(item, index)))
  return Promise.all(tasks)
}

/** 并发执行一组任务（工厂函数数组），结果顺序与输入一致 */
export async function pAll<T>(
  tasks: ReadonlyArray<() => Promise<T> | T>,
  concurrency: number
): Promise<T[]> {
  const limit = pLimit(concurrency)
  return Promise.all(tasks.map((task) => limit(task)))
}
