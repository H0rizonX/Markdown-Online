
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

type ChatMessage = {
  id: string;
  userId: number;
  name?: string;
  avatar?: string;
  text: string;
  timestamp: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  avatar: string;
};

const users: User[] = [
  { id: 1, name: "You", email: "you@example.com", avatar: "🟣" },
  { id: 2, name: "Alex", email: "alex@example.com", avatar: "🫧" },
];

// 从 localStorage 读取真实用户信息，如果没有则使用随机用户
const getUserFromStorage = (): {
  id: number;
  name: string;
  avatar: string;
} | null => {
  try {
    const userStr = localStorage.getItem("user-storage");
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    if (user && user.id && user.name) {
      return {
        id: user.id,
        name: user.name,
        avatar:
          user.avatar ||
          ["🟣", "🫧", "🦄", "🌟", "💫", "✨", "🔮", "🌠"][user.id % 8],
      };
    }
  } catch (e) {
    console.warn("Failed to parse user info from localStorage", e);
  }
  return null;
};

const storedUser = getUserFromStorage();
const fallbackUserId = Math.floor(Math.random() * 100000);
const currentUserId = storedUser?.id || fallbackUserId;
const currentUserName =
  storedUser?.name || `用户${fallbackUserId.toString().slice(-4)}`;
const currentUserAvatar =
  storedUser?.avatar ||
  ["🟣", "🫧", "🦄", "🌟", "💫", "✨", "🔮", "🌠"][currentUserId % 8];

const messages = ref<ChatMessage[]>([]);

// 初始欢迎语（仅本地展示一次）
const WELCOME_TEXT =
  "✨ 欢迎来到协同编辑聊天室～ 实时共创、即时聊天，一键开启协作吧！🎉";

const inputText = ref("");
const isHovered = ref(false);
const isFocused = ref(false);

// 语音：本地状态（MVP：仅本地UI与状态，不含设备/媒体）
const micEnabled = ref(false); // 是否开麦（发送）
const speakerEnabled = ref(true); // 是否开音（播放）
const deafened = ref(false); // 耳聋：一键不听且默认自己静音

const prevBeforeDeafen = ref<{ mic: boolean; speaker: boolean }>({
  mic: false,
  speaker: true,
});
const toggleMic = () => {
  if (deafened.value) return; // 耳聋态下不允许直接改麦克风，避免误触
  micEnabled.value = !micEnabled.value;
  (async () => {
    // 开麦：确保本地轨，并向所有 RTCPeerConnection 添加轨道
    if (micEnabled.value) {
      const stream = await ensureLocalStream();
      if (!stream) return;
      for (const [, pc] of peerConnections.value) {
        const hasAudio = pc
          .getSenders()
          .some((s) => s.track && s.track.kind === "audio");
        if (!hasAudio)
          for (const track of stream.getAudioTracks())
            pc.addTrack(track, stream);
      }
      // 启用轨道
      for (const track of stream.getAudioTracks()) track.enabled = true;
    } else {
      // 关麦：仅禁用轨道（不断开连接）
      const stream = localStream.value;
      if (stream)
        for (const track of stream.getAudioTracks()) track.enabled = false;
    }
  })();
};
const toggleSpeaker = () => {
  if (deafened.value) return;
  speakerEnabled.value = !speakerEnabled.value;
  // 同步所有远端 audio 播放
  for (const [, audio] of remoteAudios.value) {
    audio.muted = !speakerEnabled.value || deafened.value;
    audio.volume = speakerEnabled.value && !deafened.value ? 1 : 0;
  }
};
const toggleDeafened = () => {
  if (!deafened.value) {
    prevBeforeDeafen.value = {
      mic: micEnabled.value,
      speaker: speakerEnabled.value,
    };
    micEnabled.value = false;
    speakerEnabled.value = false;
    deafened.value = true;
    // 静音所有远端
    for (const [, audio] of remoteAudios.value) {
      audio.muted = true;
      audio.volume = 0;
    }
    const stream = localStream.value;
    if (stream)
      for (const track of stream.getAudioTracks()) track.enabled = false;
  } else {
    micEnabled.value = prevBeforeDeafen.value.mic;
    speakerEnabled.value = prevBeforeDeafen.value.speaker;
    deafened.value = false;
    // 恢复远端播放
    for (const [, audio] of remoteAudios.value) {
      audio.muted = !speakerEnabled.value;
      audio.volume = speakerEnabled.value ? 1 : 0;
    }
    // 恢复本地轨
    if (micEnabled.value) {
      const stream = localStream.value;
      if (stream)
        for (const track of stream.getAudioTracks()) track.enabled = true;
    }
  }
};

const isOpen = computed(() => isHovered.value || isFocused.value);
// 在线成员集合（包含自己）；由 presence 信令维护
const onlineUserIds = ref<Set<number>>(new Set([currentUserId]));
// 成员数量：实时在线人数
const memberCount = computed(() => onlineUserIds.value.size);

// 成员面板：开关与数据
const showMembers = ref(false);
const toggleMembers = () => {
  showMembers.value = !showMembers.value;
};
const pickAvatarById = (uid: number) => {
  // 如果是当前用户，使用真实头像
  if (uid === currentUserId) {
    // 如果是 URL，返回 URL；否则返回 emoji
    return currentUserAvatar.startsWith("http")
      ? currentUserAvatar
      : currentUserAvatar;
  }
  // 其他用户使用默认 emoji
  return ["🟣", "🫧", "🦄", "🌟", "💫", "✨", "🔮", "🌠"][uid % 8];
};
const displayNameById = (uid: number) =>
  uid === currentUserId ? currentUserName : `用户${uid.toString().slice(-4)}`;
type OnlineUser = { id: number; name: string; avatar: string };
// 表情：开关与数据
const showEmoji = ref(false);
const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value;
};
const emojis = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤔",
  "🙌",
  "👍",
  "👏",
  "🔥",
  "🎉",
  "✨",
  "💯",
  "🥳",
  "🤝",
  "🙈",
  "🙉",
  "🙊",
  "💬",
  "🫶",
  "🤗",
  "😇",
];
const pickEmoji = (emoji: string) => {
  inputText.value += emoji;
};
const onlineUsers = computed<OnlineUser[]>(() => {
  const arr: OnlineUser[] = [];
  for (const uid of onlineUserIds.value) {
    arr.push({
      id: uid,
      name: displayNameById(uid),
      avatar: pickAvatarById(uid),
    });
  }
  return arr.sort((a, b) =>
    a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : a.id - b.id
  );
});

const formattedTime = (t: number) => new Date(t).toLocaleTimeString();
const formattedTimeLabel = (t: number) => {
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const chatContainer = ref<HTMLDivElement | null>(null);
const scrollToBottom = () => {
  requestAnimationFrame(() => {
    const el = chatContainer.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
};

// WebSocket 连接
const ws = ref<WebSocket | null>(null);
// WebRTC 基础
const localStream = ref<MediaStream | null>(null);
const peerConnections = ref<Map<number, RTCPeerConnection>>(new Map());
const remoteAudios = ref<Map<number, HTMLAudioElement>>(new Map());
// 连接/重连状态守卫
const destroyed = ref(false);
const connecting = ref(false);
let reconnectTimer: number | null = null;

const cleanupAllPeers = () => {
  // 关闭所有 RTCPeerConnection
  for (const [, pc] of peerConnections.value) {
    try {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onnegotiationneeded = null;
      pc.onconnectionstatechange = null;
    } catch {}
    try {
      pc.close();
    } catch {}
  }
  peerConnections.value.clear();
  // 移除远端音频
  for (const [, audio] of remoteAudios.value) {
    try {
      audio.srcObject = null;
    } catch {}
  }
  remoteAudios.value.clear();
};

const ensureLocalStream = async () => {
  if (localStream.value) return localStream.value;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStream.value = stream;
    return stream;
  } catch (e) {
    console.warn("getUserMedia failed", e);
    return null;
  }
};

const createPeer = async (peerId: number): Promise<RTCPeerConnection> => {
  let pc = peerConnections.value.get(peerId);
  // 检查现有连接是否仍然有效
  if (pc) {
    const state = pc.connectionState;
    if (state === "connected" || state === "connecting" || state === "new") {
      return pc;
    }
    // 连接已关闭或失败，清理并重新创建
    try {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onnegotiationneeded = null;
      pc.onconnectionstatechange = null;
      pc.close();
    } catch {}
    peerConnections.value.delete(peerId);
    const audio = remoteAudios.value.get(peerId);
    if (audio) {
      try {
        audio.srcObject = null;
      } catch {}
      remoteAudios.value.delete(peerId);
    }
  }

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      try {
        ws.value?.send(
          JSON.stringify({
            type: "rtc:candidate",
            from: currentUserId,
            to: peerId,
            candidate: ev.candidate,
          })
        );
      } catch {}
    }
  };
  pc.ontrack = (ev) => {
    let audio = remoteAudios.value.get(peerId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      try {
        (audio as any).playsInline = true;
      } catch {}
      remoteAudios.value.set(peerId, audio);
    }
    audio.srcObject = ev.streams[0];
    audio.muted = !speakerEnabled.value || deafened.value;
    audio.volume = speakerEnabled.value && !deafened.value ? 1 : 0;
    // 主动尝试播放，规避部分浏览器的自动播放限制
    try {
      audio.play?.();
    } catch {}
  };

  // 监听连接状态变化，自动清理失效的连接
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    if (state === "closed" || state === "failed" || state === "disconnected") {
      // 延迟清理，避免在重连过程中过早清理
      setTimeout(() => {
        if (
          pc.connectionState === "closed" ||
          pc.connectionState === "failed"
        ) {
          try {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.onnegotiationneeded = null;
            pc.onconnectionstatechange = null;
            pc.close();
          } catch {}
          peerConnections.value.delete(peerId);
          const audio = remoteAudios.value.get(peerId);
          if (audio) {
            try {
              audio.srcObject = null;
            } catch {}
            remoteAudios.value.delete(peerId);
          }
        }
      }, 2000);
    }
  };

  // 当我们添加/移除轨道后，触发重新协商；为避免 glare，仅由较小 ID 的一端发起
  pc.onnegotiationneeded = async () => {
    try {
      if (currentUserId < peerId) {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        try {
          ws.value?.send(
            JSON.stringify({
              type: "rtc:offer",
              from: currentUserId,
              to: peerId,
              sdp: offer,
            })
          );
        } catch {}
      }
    } catch {}
  };

  // 如果已开麦，则添加本地轨
  if (micEnabled.value) {
    const stream = await ensureLocalStream();
    if (stream) {
      for (const track of stream.getAudioTracks()) {
        pc.addTrack(track, stream);
      }
    }
  }

  peerConnections.value.set(peerId, pc);
  return pc;
};

const makeOfferTo = async (peerId: number) => {
  const pc = await createPeer(peerId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  try {
    ws.value?.send(
      JSON.stringify({
        type: "rtc:offer",
        from: currentUserId,
        to: peerId,
        sdp: offer,
      })
    );
  } catch {}
};

const connect = () => {
  if (destroyed.value) return;
  if (connecting.value) return;
  // 防止重复 WS 连接
  if (
    ws.value &&
    (ws.value.readyState === WebSocket.CONNECTING ||
      ws.value.readyState === WebSocket.OPEN)
  )
    return;

  // WebSocket重连前，清理所有旧的Peer连接（避免信令混乱）
  cleanupAllPeers();
  onlineUserIds.value = new Set([currentUserId]);

  connecting.value = true;
  // 优先使用 window.VITE_WS_URL（由 index.html 注入 .env 值），最后回退到同主机 3001
  const envWsUrl = window && (window as any).VITE_WS_URL;
  const defaultWs =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    (location.hostname + ":3001");
  const url = envWsUrl || defaultWs;
  const socket = new WebSocket(url);
  ws.value = socket;

  socket.addEventListener("open", () => {
    // 可在连接建立时发送一个握手消息（可选）
    connecting.value = false;
  });

  socket.addEventListener("message", (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.type === "message") {
        messages.value.push({
          id: data.id,
          userId: data.userId,
          name: data.name,
          avatar: data.avatar,
          text: data.text,
          timestamp: data.timestamp,
        });
        scrollToBottom();
      }
      // presence 列表
      if (data.type === "presence:list" && Array.isArray(data.users)) {
        const next = new Set<number>([currentUserId]);
        for (const uid of data.users as number[]) {
          if (typeof uid === "number") next.add(uid);
        }
        // 清理不在列表中的用户连接
        for (const [uid, pc] of peerConnections.value.entries()) {
          if (!next.has(uid) && uid !== currentUserId) {
            try {
              pc.onicecandidate = null;
              pc.ontrack = null;
              pc.onnegotiationneeded = null;
              pc.onconnectionstatechange = null;
              pc.close();
            } catch {}
            peerConnections.value.delete(uid);
            const audio = remoteAudios.value.get(uid);
            if (audio) {
              try {
                audio.srcObject = null;
              } catch {}
              remoteAudios.value.delete(uid);
            }
          }
        }
        onlineUserIds.value = next;
        for (const uid of next) {
          if (uid !== currentUserId) {
            // 约定由较小 userId 发起 offer，避免重复
            if (currentUserId < uid) makeOfferTo(uid);
            else createPeer(uid);
          }
        }
      }
      // 新人加入
      if (data.type === "presence:join" && typeof data.userId === "number") {
        const uid = data.userId;
        if (uid !== currentUserId) {
          onlineUserIds.value.add(uid);
          if (currentUserId < uid) makeOfferTo(uid);
          else createPeer(uid);
        }
      }
      // 离开
      if (data.type === "presence:leave" && typeof data.userId === "number") {
        const pc = peerConnections.value.get(data.userId);
        if (pc) {
          try {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.onnegotiationneeded = null;
            pc.onconnectionstatechange = null;
            pc.close();
          } catch {}
          peerConnections.value.delete(data.userId);
        }
        const audio = remoteAudios.value.get(data.userId);
        if (audio) {
          try {
            audio.srcObject = null;
          } catch {}
          remoteAudios.value.delete(data.userId);
        }
        onlineUserIds.value.delete(data.userId);
      }
      // RTC 信令
      if (data.type === "rtc:offer") {
        const from = data.from as number;
        (async () => {
          const pc = await createPeer(from);
          const isPolite = currentUserId > from;
          const offer = data.sdp;

          try {
            const offerCollision = pc.signalingState !== "stable";
            if (offerCollision) {
              if (!isPolite) {
                // 非礼貌端在冲突时忽略对方的 offer
                return;
              }
              // 礼貌端回滚本地未完成的协商，然后接受对方的 offer
              try {
                await pc.setLocalDescription({ type: "rollback" } as any);
              } catch {}
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // 确保我们也有本地轨（若已开麦）
            if (micEnabled.value) {
              const stream = await ensureLocalStream();
              if (stream) {
                const senders = pc.getSenders();
                if (!senders.some((s) => s.track && s.track.kind === "audio")) {
                  for (const track of stream.getAudioTracks())
                    pc.addTrack(track, stream);
                }
              }
            }

            // 仅在 have-remote-offer 态创建应答
            if (pc.signalingState === "have-remote-offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              try {
                ws.value?.send(
                  JSON.stringify({
                    type: "rtc:answer",
                    from: currentUserId,
                    to: from,
                    sdp: answer,
                  })
                );
              } catch {}
            }
          } catch {}
        })();
      }
      if (data.type === "rtc:answer") {
        const from = data.from as number;
        const pc = peerConnections.value.get(from);
        if (pc) {
          // 仅在我们处于 have-local-offer 时才接受对方的 answer，避免 stable 态报错
          if (pc.signalingState === "have-local-offer") {
            pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).catch(
              () => {}
            );
          } else {
            // 忽略意外的/重复的 answer
          }
        }
      }
      if (data.type === "rtc:candidate") {
        const from = data.from as number;
        const pc = peerConnections.value.get(from);
        if (pc) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch {}
        }
      }
    } catch {}
  });

  socket.addEventListener("close", () => {
    connecting.value = false;
    // 简单重连策略（仅在未销毁时，且去重）
    if (!destroyed.value) {
      if (reconnectTimer != null) {
        try {
          clearTimeout(reconnectTimer);
        } catch {}
        reconnectTimer = null;
      }
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 1000);
    }
  });

  socket.addEventListener("error", () => {
    // 统一交由 close 处理重连，避免重复触发
    try {
      socket.close();
    } catch {}
  });
};

const send = () => {
  const text = inputText.value.trim();
  if (!text) return;
  const msg = {
    type: "message",
    id: crypto.randomUUID(),
    userId: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar,
    text,
    timestamp: Date.now(),
  };
  inputText.value = "";
  try {
    ws.value?.send(JSON.stringify(msg));
  } catch {}
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
};

onMounted(() => {
  // 本地欢迎消息（仅在当前会话首次渲染时显示）
  if (messages.value.length === 0) {
    messages.value.push({
      id: "welcome-msg",
      userId: 0,
      name: "系统",
      avatar: "✨",
      text: WELCOME_TEXT,
      timestamp: Date.now(),
    });
  }
  connect();
  scrollToBottom();
  // 首次用户手势时，统一解锁远端音频播放
  const unlock = () => {
    for (const [, a] of remoteAudios.value) {
      try {
        a.muted = !speakerEnabled.value || deafened.value;
        a.volume = speakerEnabled.value && !deafened.value ? 1 : 0;
        a.play?.();
      } catch {}
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  // 上线广播 presence
  const sendPresence = () => {
    try {
      ws.value?.send(
        JSON.stringify({ type: "presence", userId: currentUserId })
      );
    } catch {}
  };
  const id = setInterval(sendPresence, 1500);
  // 初次尝试发送一次
  setTimeout(sendPresence, 300);
  // 清理
  onBeforeUnmount(() => clearInterval(id));
});
onBeforeUnmount(() => {
  destroyed.value = true;
  if (reconnectTimer != null) {
    try {
      clearTimeout(reconnectTimer);
    } catch {}
    reconnectTimer = null;
  }
  try {
    ws.value?.close();
  } catch {}
  // 停止本地音频轨并释放
  const stream = localStream.value;
  if (stream) {
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {}
    }
  }
  localStream.value = null;
  // 关闭并清理所有 Peer 与远端音频
  cleanupAllPeers();
});

// 计算带时间分隔的消息流（每相隔 >= 5 分钟插入一次分隔条）
type TimelineItem =
  | {
      kind: "msg";
      id: string;
      userId: number;
      name?: string;
      avatar?: string;
      text: string;
      timestamp: number;
    }
  | { kind: "sep"; at: number; key: string };
const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = [];
  let lastNonSystemTs = 0;
  const FIVE_MIN = 5 * 60 * 1000;
  for (const m of messages.value) {
    const isSystem = m.userId === 0 || m.id === "welcome-msg";
    if (
      !lastNonSystemTs ||
      (!isSystem && m.timestamp - lastNonSystemTs >= FIVE_MIN)
    ) {
      items.push({ kind: "sep", at: m.timestamp, key: `sep-${m.timestamp}` });
    }
    items.push({ kind: "msg", ...m });
    if (!isSystem) {
      lastNonSystemTs = m.timestamp;
    }
  }
  return items;
});
</script>

<template>
  <teleport to="body">
    <aside
      class="chat-sidebar"
      :class="{ open: isOpen }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="grabber" aria-hidden="true"></div>

      <header class="chat-header">
        <div class="title">
          <span class="dot"></span>
          <span>协同聊天室</span>
        </div>
        <div class="peers">
          <div class="peer" v-for="u in users" :key="u.id" :title="u.name">
            {{ u.avatar }}
          </div>
        </div>
      </header>

      <div class="chat-body" ref="chatContainer">
        <template v-for="item in timeline">
          <div v-if="item.kind === 'sep'" class="time-sep" :key="item.key">
            <span class="line"></span>
            <span class="label">{{ formattedTimeLabel(item.at) }}</span>
            <span class="line"></span>
          </div>
          <div
            v-else
            class="msg"
            :class="item.userId === currentUserId ? 'mine' : 'theirs'"
            :key="item.id"
          >
            <div class="msg-header" v-if="item.userId !== currentUserId">
              <span class="msg-avatar">
                <img
                  v-if="item.avatar && item.avatar.startsWith('http')"
                  :src="item.avatar"
                  :alt="item.name || '用户'"
                  class="avatar-img"
                />
                <span v-else>{{ item.avatar || "👤" }}</span>
              </span>
              <span class="msg-name">{{
                item.name || `用户${item.userId}`
              }}</span>
            </div>
            <div class="bubble">
              <p class="text">{{ item.text }}</p>
              <!-- <span class="time">{{ formattedTime(item.timestamp) }}</span> -->
            </div>
          </div>
        </template>
      </div>

      <div class="voice-controls">
        <button
          class="vc-btn"
          :class="{ active: micEnabled, disabled: deafened }"
          @click="toggleMic"
          :aria-pressed="micEnabled"
          :title="
            deafened
              ? '已耳聋，无法开麦'
              : micEnabled
              ? '关闭麦克风'
              : '打开麦克风'
          "
        >
          <span class="icon">🎤</span>
          <span class="label">{{
            micEnabled ? "麦克风已开" : "麦克风已关"
          }}</span>
        </button>
        <button
          class="vc-btn"
          :class="{ active: speakerEnabled, disabled: deafened }"
          @click="toggleSpeaker"
          :aria-pressed="speakerEnabled"
          :title="
            deafened
              ? '已耳聋，无法开音'
              : speakerEnabled
              ? '关闭音频'
              : '打开音频'
          "
        >
          <span class="icon">🔊</span>
          <span class="label">{{
            speakerEnabled ? "音频已开" : "音频已关"
          }}</span>
        </button>
        <div class="vc-divider" aria-hidden="true"></div>
        <button
          class="vc-btn"
          :class="{ active: deafened }"
          @click="toggleDeafened"
          :aria-pressed="deafened"
          :title="deafened ? '恢复听/说' : '进入耳聋（不听且静音）'"
        >
          <span class="icon">🙉</span>
          <span class="label">耳聋</span>
        </button>
        <button
          class="vc-btn"
          :class="{ active: showMembers }"
          @click="toggleMembers"
          :aria-pressed="showMembers"
          title="查看在线成员"
        >
          <span class="icon">👥</span>
          <span class="label">成员({{ memberCount }})</span>
        </button>
        <button
          class="vc-btn"
          :class="{ active: showEmoji }"
          @click="toggleEmoji"
          :aria-pressed="showEmoji"
          title="插入表情"
        >
          <span class="icon">😊</span>
          <span class="label">表情</span>
        </button>
      </div>

      <footer class="chat-input">
        <input
          class="input"
          v-model="inputText"
          placeholder="写点什么…"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown="onKeydown"
        />
        <button class="send" :disabled="!inputText.trim()" @click="send">
          发送
        </button>
      </footer>
      <!-- 成员面板 -->
      <div class="members-panel" v-if="showMembers">
        <div class="members-header">
          <span>在线成员（{{ memberCount }}）</span>
          <button class="close-btn" @click="toggleMembers" aria-label="关闭">
            ✖
          </button>
        </div>
        <div class="members-list">
          <div class="member-item" v-for="u in onlineUsers" :key="u.id">
            <span class="m-avatar">
              <img
                v-if="u.avatar && u.avatar.startsWith('http')"
                :src="u.avatar"
                :alt="u.name"
                class="avatar-img"
              />
              <span v-else>{{ u.avatar }}</span>
            </span>
            <span class="m-name">{{ u.name }}</span>
            <span class="m-tag" v-if="u.id === currentUserId">你</span>
          </div>
        </div>
      </div>
      <!-- 表情面板 -->
      <div class="emoji-panel" v-if="showEmoji">
        <div class="emoji-header">
          <span>选择表情</span>
          <button class="close-btn" @click="toggleEmoji" aria-label="关闭">
            ✖
          </button>
        </div>
        <div class="emoji-grid">
          <button
            class="emoji-btn"
            v-for="e in emojis"
            :key="e"
            @click="pickEmoji(e)"
          >
            {{ e }}
          </button>
        </div>
      </div>
    </aside>
  </teleport>
</template>

<style>
/* 容器：默认极窄，鼠标悬停或输入框聚焦时从右侧滑出展开 */
.chat-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 16px; /* 折叠态宽度：仅显示拖拽把手 */
  transition: width 420ms cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px; /* 让语音选项与输入框更靠近 */
  padding: 10px 10px 12px 10px;
  overflow: hidden; /* 防止展开过渡时内部内容被压缩或提前露出 */
  /* 局部排版标准化，避免受外层 Tailwind/全局样式影响导致字号变大等 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji",
    "Noto Color Emoji";
  font-size: 13px;
  line-height: 1.4;

  /* 素雅中性背景 + 轻毛玻璃 */
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.82) 100%
  );
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);

  border-left: 1px solid rgba(15, 23, 42, 0.06) !important;
  box-shadow: -6px 0 16px rgba(15, 23, 42, 0.06) !important;
}
.chat-sidebar.open {
  width: 380px; /* 展开态宽度 */
}
.grabber {
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 84px;
  border-radius: 8px;
  background: linear-gradient(180deg, #f6f7f9, #eef1f4);
  box-shadow: inset 0 0 0 1px #ffffff, 0 0 0 3px rgba(15, 23, 42, 0.04),
    -6px 0 12px rgba(15, 23, 42, 0.06);
}
.chat-sidebar:not(.open) {
  padding: 0; /* 去除内边距，保证把手位置居中 */
}
.chat-sidebar > *:not(.grabber) {
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 220ms ease, transform 220ms ease;
  pointer-events: none;
}
.chat-sidebar.open > *:not(.grabber) {
  opacity: 1;
  transform: none;
  transition-delay: 140ms; /* 内容淡入稍晚于宽度展开开始 */
  pointer-events: auto;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
}
.title .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #8ea0ff; /* 轻微点缀色 */
  box-shadow: 0 0 6px rgba(142, 160, 255, 0.35);
}
.peers {
  display: flex;
  gap: 6px;
}
.peer {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f5f6f8;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #6b7280;
}
.chat-body {
  flex: 1;
  overflow: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
.msg.mine {
  align-items: flex-end;
}
.bubble {
  max-width: 78%;
  padding: 10px 12px 8px 12px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  color: #111827;
  position: relative;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.msg.mine .bubble {
  background: #f5f7ff; /* 轻靛蓝底很淡 */
  border-color: rgba(99, 102, 241, 0.18);
}
.msg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}
.msg-avatar {
  font-size: 16px;
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
}
.msg-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.msg-name {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  opacity: 0.9;
}
.text {
  margin: 0 0 6px 0;
  line-height: 1.35;
  font-size: 13.5px;
  font-weight: 330;
}
.time {
  font-size: 11px;
  color: #6b7280;
  opacity: 0.75;
}
.time-sep {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  opacity: 0.8;
  font-size: 11.5px;
  justify-content: center;
}
.time-sep .line {
  height: 1px;
  background: rgba(15, 23, 42, 0.08);
  flex: 1;
}
.time-sep .label {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.chat-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.08);
  margin-bottom: 16px; /* 让输入区域更贴近底部 */
}
.input {
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  outline: none;
  padding: 0 10px;
  background: #ffffff;
  color: #1f2937;
  font-size: 13px;
}
.input:focus {
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.send {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: #f6f7fb;
  color: #1f2937;
  font-weight: 600;
  font-size: 13px; /* 发送按钮文字更小一点 */
  transition: background 0.15s ease, border-color 0.15s ease;
}
.send:hover:not(:disabled) {
  background: #eef2ff;
  border-color: rgba(99, 102, 241, 0.5);
}
.send:disabled {
  opacity: 0.55;
  filter: grayscale(0.2);
  cursor: not-allowed;
}
@media (max-width: 520px) {
  .chat-sidebar.open {
    width: 88vw;
  }
}

/* 语音控制条 */
.voice-controls {
  display: grid;
  grid-template-columns: auto auto 1px auto auto auto; /* 去掉 1fr 占位，避免把最后按钮挤出视口 */
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}
.vc-btn {
  display: inline-flex;
  flex-direction: column; /* 图标在上，文字在下 */
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  width: 64px; /* 更紧凑，保证在 380px 宽度下完整显示 */
  box-sizing: border-box;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #ffffff;
  color: #1f2937;
  font-size: 13px;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.vc-btn .icon {
  font-size: 16px;
  line-height: 1;
}
.vc-btn .label {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}
.vc-btn:hover {
  background: #f7f8fb;
  border-color: rgba(99, 102, 241, 0.25);
}
.vc-btn.active {
  background: #f5f7ff;
  border-color: rgba(99, 102, 241, 0.35);
  color: #111827;
}
.vc-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.vc-btn.ghost {
  background: transparent;
}
.vc-divider {
  width: 1px;
  height: 18px;
  background: rgba(15, 23, 42, 0.12);
}
.vc-spacer {
  flex: 1;
}

/* 成员面板 */
.members-panel {
  position: absolute;
  right: 14px;
  bottom: 64px;
  width: 280px;
  max-height: 46vh;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}
.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #1f2937;
}
.close-btn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  border-radius: 8px;
  height: 26px;
  width: 26px;
  cursor: pointer;
}
.members-list {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.member-item {
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #fff;
}
.member-item:hover {
  background: #f8fafc;
}
.m-avatar {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f5f6f8;
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
}
.m-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-name {
  font-size: 13px;
  color: #111827;
}
.m-tag {
  font-size: 11px;
  color: #6b7280;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 2px 6px;
}

/* 表情面板 */
.emoji-panel {
  position: absolute;
  right: 14px;
  bottom: 64px;
  width: 280px;
  max-height: 46vh;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}
.emoji-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #1f2937;
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  overflow: auto;
}
.emoji-btn {
  height: 32px;
  width: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  cursor: pointer;
}
.emoji-btn:hover {
  background: #f8fafc;
}
</style>
