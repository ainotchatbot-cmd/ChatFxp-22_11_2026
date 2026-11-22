export interface WsEventMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

type WsListener = (msg: WsEventMessage) => void;

class PortalWsClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<WsListener>();
  private reconnectTimer: number | null = null;
  private authToken: string | null = null;
  private disposed = false;

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.disposed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        if (this.authToken) {
          socket.send(JSON.stringify({ type: 'auth', token: this.authToken }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as WsEventMessage;
          this.listeners.forEach((cb) => cb(parsed));
        } catch {
          // Ignore invalid payloads
        }
      };

      socket.onclose = () => {
        if (!this.disposed) {
          this.reconnectTimer = window.setTimeout(() => this.connect(), 3500);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch {
      // Graceful fallback
    }
  }

  public authenticate(token: string | null): void {
    this.authToken = token;
    if (token && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'auth', token }));
    }
  }

  public sendTyping(active: boolean, recipientId?: number, threadId?: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: active ? 'typing:start' : 'typing:stop',
          recipientId,
          threadId,
        })
      );
    }
  }

  public subscribe(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public disconnect(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

export const portalWs = new PortalWsClient();
