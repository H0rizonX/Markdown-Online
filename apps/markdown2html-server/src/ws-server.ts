/**
 * 简易 WebSocket 聊天服务：接收消息并广播给所有客户端
 * 可在单进程内启动：由 app.ts 调用 startWsServer 即可
 */

import { WebSocketServer, WebSocket } from 'ws'

type RoomId = string
type WssWithMap = WebSocketServer & {
  clientsByUserId: Map<number, WebSocket> // legacy (global)
  rooms: Map<RoomId, { clientsByUserId: Map<number, WebSocket>, clients: Set<WebSocket & { userId?: number, roomId?: RoomId }> }>
}

export function startWsServer(port?: number) {
  const PORT: number = typeof port === 'number' ? port : (process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001)

  const wss: WssWithMap = Object.assign(new WebSocketServer({ port: PORT }), {
    clientsByUserId: new Map<number, WebSocket>(),
    rooms: new Map<RoomId, { clientsByUserId: Map<number, WebSocket>, clients: Set<WebSocket & { userId?: number, roomId?: RoomId }> }>()
  })

  function getRoom(roomId?: RoomId) {
    const id = roomId || 'default'
    let room = wss.rooms.get(id)
    if (!room) {
      room = { clientsByUserId: new Map(), clients: new Set() }
      wss.rooms.set(id, room)
    }
    return room
  }

  function broadcastToAll(data: unknown, excludeSocket?: WebSocket) {
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

  function broadcastToRoom(roomId: RoomId, data: unknown, excludeSocket?: WebSocket) {
    const json = JSON.stringify(data)
    const room = getRoom(roomId)
    for (const client of room.clients) {
      if ((client as WebSocket).readyState === 1 /* OPEN */ && client !== excludeSocket) {
        try { (client as WebSocket).send(json) } catch {}
      }
    }
  }

  wss.on('connection', (ws: WebSocket & { userId?: number, roomId?: RoomId }) => {
    ws.on('message', (raw: WebSocket.RawData) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>
      } catch {
        return
      }

      if (msg && msg.type === 'message' && typeof msg.text === 'string') {
        const roomId = (typeof msg.roomId === 'string' && msg.roomId) || ws.roomId || 'default'
        const payload = {
          type: 'message',
          id: msg.id,
          userId: msg.userId,
          name: msg.name,
          avatar: msg.avatar,
          text: msg.text,
          timestamp: msg.timestamp || Date.now(),
          roomId
        }
        try { 
          ws.send(JSON.stringify(payload)) 
        } catch {
          // 忽略发送错误
        }
        broadcastToRoom(roomId, payload, ws)
      }

      if (msg && msg.type === 'presence' && typeof msg.userId === 'number') {
        const roomId = (typeof msg.roomId === 'string' && msg.roomId) || 'default'
        ws.userId = msg.userId
        ws.roomId = roomId
        const room = getRoom(roomId)
        room.clients.add(ws)
        room.clientsByUserId.set(ws.userId, ws)
        // legacy global map (kept for rtc fallback)
        wss.clientsByUserId.set(ws.userId, ws)
        const online = Array.from(room.clientsByUserId.keys())
        try { 
          ws.send(JSON.stringify({ type: 'presence:list', users: online, roomId })) 
        } catch {
          // 忽略发送错误
        }
        broadcastToRoom(roomId, { type: 'presence:join', userId: ws.userId, roomId }, ws)
      }

      if (msg && (msg.type === 'rtc:offer' || msg.type === 'rtc:answer' || msg.type === 'rtc:candidate')) {
        const to = msg.to
        const roomId = (typeof msg.roomId === 'string' && msg.roomId) || ws.roomId || 'default'
        const room = getRoom(roomId)
        if (to && typeof to === 'number') {
          const target = room.clientsByUserId.get(to) || wss.clientsByUserId.get(to)
          if (target && target.readyState === 1) {
            try { 
              // 直接发送原始消息对象，保留所有字段
              target.send(JSON.stringify({ ...msg, roomId })) 
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
        const rid = ws.roomId || 'default'
        const room = getRoom(rid)
        room.clientsByUserId.delete(ws.userId)
        room.clients.delete(ws)
        broadcastToRoom(rid, { type: 'presence:leave', userId: ws.userId, roomId: rid }, ws)
      }
    })
  })

  console.log(`[ws] WebSocket 服务已启动：ws://localhost:${PORT}`)

  return wss
}


