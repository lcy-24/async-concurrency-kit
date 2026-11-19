# async-concurrency-kit

异步工具库：**并发控制、重试、超时、防抖节流**，零依赖、全 TypeScript。把前端最常用的几个异步能力收在一个库里，也是面试手写题的「标准答案」合集。

## 特性

- 🔀 **并发控制**：`pLimit` / `pMap` / `pAll`，限制同时执行的异步任务数
- 🔁 **指数退避重试**：`retry`，失败自动重试，延迟按倍数递增，默认排除 4xx
- ⏱ **超时**：`timeout`，给任意 Promise 加超时
- 🛑 **防抖节流**：`debounce` / `throttle`，支持 leading/trailing、cancel、flush
- ✅ 零依赖、全 TS，Node 和浏览器通用

## 安装

```bash
npm install async-concurrency-kit
```

## 快速开始

```ts
import { pLimit, pMap, retry, timeout, debounce, throttle } from 'async-concurrency-kit'

// 1. 并发控制：批量上传限制同时最多 3 个
const limit = pLimit(3)
await Promise.all(urls.map((url) => limit(() => upload(url))))

// 2. 并发 map：处理 100 条数据，同时最多 5 个
const results = await pMap(items, async (item) => process(item), 5)

// 3. 重试：接口抖动自动重试，最多 3 次，指数退避
const data = await retry(() => fetchData(), { retries: 3, delay: 300, backoff: 2 })

// 4. 超时：3 秒没返回就抛错
const res = await timeout(fetch('/api'), 3000)

// 5. 防抖：输入框搜索，停止 300ms 后才请求
const onSearch = debounce((kw) => search(kw), 300)

// 6. 节流：滚动监听，每 100ms 最多一次
const onScroll = throttle(() => handleScroll(), 100)
```

## API

### 并发控制

| 函数 | 说明 |
| --- | --- |
| `pLimit(concurrency)` | 返回 `limit(fn)`，限制同时执行数 |
| `pMap(items, mapper, concurrency)` | 并发执行 map，结果顺序与输入一致 |
| `pAll(tasks, concurrency)` | 并发执行一组任务工厂 |

### 重试与超时

| 函数 | 说明 |
| --- | --- |
| `retry(fn, options?)` | 指数退避重试，`retries/delay/backoff/maxDelay/shouldRetry/onRetry`；默认排除 4xx（客户端错误），网络错误 / 5xx / 普通异常才重试 |
| `timeout(promise, ms, message?)` | 超时抛错 |
| `sleep(ms)` | 暂停 |

### 防抖节流

| 函数 | 说明 |
| --- | --- |
| `debounce(fn, wait, { leading, trailing })` | 停止 wait 后执行，带 `cancel`/`flush` |
| `throttle(fn, wait, { leading, trailing })` | wait 内最多一次，带 `cancel`/`flush` |

## 与常见需求对应

| 场景 | 用哪个 |
| --- | --- |
| 批量上传/下载，控制并发 | `pLimit` / `pMap` |
| 接口抖动/网络不稳，自动重试 | `retry` |
| 防止接口长时间无响应卡住 | `timeout` |
| 输入框搜索、窗口 resize | `debounce` |
| 滚动、鼠标移动、按钮防连点 | `throttle` |

## License

MIT
