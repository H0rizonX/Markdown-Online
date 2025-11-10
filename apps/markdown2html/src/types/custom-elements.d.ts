import type React from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'chat-sidebar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { room?: string }
    }
  }
}

export {}


