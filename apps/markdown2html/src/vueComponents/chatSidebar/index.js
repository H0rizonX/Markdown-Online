import { createApp } from 'vue'
import ChatSidebar from './ChatSidebar.vue'

class ChatSidebarElement extends HTMLElement {
  constructor() {
    super()
    this.__app = null
  }
  connectedCallback() {
    if (!this.__app) {
      const room = this.getAttribute('room') || ''
      this.__app = createApp(ChatSidebar, { room })
      this.__app.mount(this)
    }
  }
  disconnectedCallback() {
    if (this.__app) {
      try { this.__app.unmount() } catch {}
      this.__app = null
    }
  }
}

if (!customElements.get('chat-sidebar')) {
  customElements.define('chat-sidebar', ChatSidebarElement)
}

export default ChatSidebarElement
