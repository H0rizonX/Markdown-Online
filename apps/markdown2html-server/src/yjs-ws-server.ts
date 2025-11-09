/**
 * Yjs WebSocket 服务器：使用官方 y-websocket 实现
 * 兼容路径或查询参数选择文档：
 *   - ws://host:3002/mydoc
 *   - ws://host:3002/?doc=mydoc
 */

import { WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import http from 'http'
// 官方服务器工具（y-websocket 1.5.3）入口
import { setupWSConnection } from 'y-websocket/bin/utils'

export function startYjsWsServer(port?: number) {
  const PORT = typeof port === 'number' ? port : (process.env.YJS_WS_PORT ? Number(process.env.YJS_WS_PORT) : 3004)

  // 用 HTTP 服务器承载，普通 GET 返回 200；Upgrade 交由 ws 处理
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Yjs WebSocket server is running. Use WebSocket to connect.\n')
  })

  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    try { console.log('[yjs-ws] upgrade', req.url) } catch { /* noop */ }
    wss.handleUpgrade(req, socket as unknown as NodeJS.Socket, head, (ws) => {
      try {
        const base = `http://localhost:${PORT}`
        const url = new URL(req.url || '/', base)
        const fromQuery = url.searchParams.get('doc') || ''
        const fromPath = (url.pathname || '/').replace(/^\//, '')
        const docName = fromQuery || fromPath || 'default'
        setupWSConnection(ws, req, { docName })
        try { console.log('[yjs-ws] connected ->', docName) } catch { /* noop */ }
      } catch (e) {
        try { console.error('[yjs-ws] setup error', e) } catch { /* noop */ }
        try { ws.close() } catch { /* noop */ }
      }
    })
  })

  server.listen(PORT, () => {
    console.log(`[yjs-ws] Yjs WebSocket 服务已启动：ws://localhost:${PORT}`)
  })

  return wss
}

