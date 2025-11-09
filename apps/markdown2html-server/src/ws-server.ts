/**
 * 简易 WebSocket 聊天服务：接收消息并广播给所有客户端
 * 可在单进程内启动：由 app.ts 调用 startWsServer 即可
 */

import { WebSocketServer, WebSocket } from 'ws'

type WssWithMap = WebSocketServer & {
  clientsByUserId: Map<number, WebSocket>
}

export function startWsServer(port?: number) {
  const PORT: number = typeof port === 'number' ? port : (process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001)

  const wss: WssWithMap = Object.assign(new WebSocketServer({ port: PORT }), {
    clientsByUserId: new Map<number, WebSocket>()
  })

  function broadcast(data: unknown, excludeSocket?: WebSocket) {
    const json = JSON.stringify(data)
    for (const client of wss.clients) {
      if ((client as WebSocket).readyState === 1 /* OPEN */ && client !== excludeSocket) {
        try { 
          (client as WebSocket).send(json) 
        } catch {
          // 忽略发送错误
        }
      }
    }
  }

  wss.on('connection', (ws: WebSocket & { userId?: number }) => {
    ws.on('message', (raw: WebSocket.RawData) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>
      } catch {
        return
      }

      if (msg && msg.type === 'message' && typeof msg.text === 'string') {
        const payload = {
          type: 'message',
          id: msg.id,
          userId: msg.userId,
          name: msg.name,
          avatar: msg.avatar,
          text: msg.text,
          timestamp: msg.timestamp || Date.now(),
        }
        try { 
          ws.send(JSON.stringify(payload)) 
        } catch {
          // 忽略发送错误
        }
        broadcast(payload, ws)
      }

      if (msg && msg.type === 'presence' && typeof msg.userId === 'number') {
        ws.userId = msg.userId
        wss.clientsByUserId.set(ws.userId, ws)
        const online = Array.from(wss.clientsByUserId.keys())
        try { 
          ws.send(JSON.stringify({ type: 'presence:list', users: online })) 
        } catch {
          // 忽略发送错误
        }
        broadcast({ type: 'presence:join', userId: ws.userId }, ws)
      }

      if (msg && (msg.type === 'rtc:offer' || msg.type === 'rtc:answer' || msg.type === 'rtc:candidate')) {
        const to = msg.to
        if (to && typeof to === 'number') {
          const target = wss.clientsByUserId.get(to)
          if (target && target.readyState === 1) {
            try { 
              // 直接发送原始消息对象，保留所有字段
              target.send(JSON.stringify(msg)) 
            } catch {
              // 忽略发送错误
            }
          }
        }
      }
    })

    try { 
      ws.send(JSON.stringify({ type: 'ready', serverTime: Date.now() })) 
    } catch {
      // 忽略发送错误
    }

    ws.on('close', () => {
      if (ws.userId != null) {
        wss.clientsByUserId.delete(ws.userId)
        broadcast({ type: 'presence:leave', userId: ws.userId }, ws)
      }
    })
  })

  console.log(`[ws] WebSocket 服务已启动：ws://localhost:${PORT}`)

  return wss
}


