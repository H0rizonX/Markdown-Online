
/**
 * 
 * 这个是后端我先放到这里了
 * 
 */







// 简易 WebSocket 聊天服务：接收消息并广播给所有客户端
// 启动方式：npm run ws-server

import { WebSocketServer } from 'ws'

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001

const wss = new WebSocketServer({ port: PORT })

/**
 * 广播 JSON 给所有连接的客户端，可选择排除发送者
 */
function broadcast(data, excludeSocket) {
  const json = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === 1 /* 连接已打开 */ && client !== excludeSocket) {
      client.send(json)
    }
  }
}

wss.clientsByUserId = new Map()

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    // 仅处理聊天消息
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
      // 回显给发送者，同时广播给其他人
      try { ws.send(JSON.stringify(payload)) } catch {}
      broadcast(payload, ws)
    }

    // 语音：在线状态登记（简单 presence）
    if (msg && msg.type === 'presence' && typeof msg.userId === 'number') {
      ws.userId = msg.userId
      wss.clientsByUserId.set(ws.userId, ws)
      // 向当前连接回发在线列表
      const online = Array.from(wss.clientsByUserId.keys())
      try { ws.send(JSON.stringify({ type: 'presence:list', users: online })) } catch {}
      // 通知其他人有人加入
      broadcast({ type: 'presence:join', userId: ws.userId }, ws)
    }

    // WebRTC 信令转发（点对点）
    if (msg && (msg.type === 'rtc:offer' || msg.type === 'rtc:answer' || msg.type === 'rtc:candidate')) {
      const to = msg.to
      const target = wss.clientsByUserId.get(to)
      if (target && target.readyState === 1) {
        try { target.send(JSON.stringify(msg)) } catch {}
      }
    }
  })

  // 可选：连接建立通知（客户端如未实现可忽略）
  try { ws.send(JSON.stringify({ type: 'ready', serverTime: Date.now() })) } catch {}

  ws.on('close', () => {
    if (ws.userId != null) {
      wss.clientsByUserId.delete(ws.userId)
      broadcast({ type: 'presence:leave', userId: ws.userId }, ws)
    }
  })
})

console.log(`[ws] WebSocket 服务已启动：ws://localhost:${PORT}`)


