/**
 * Global Media Coordinator for Nexora
 * 
 * Rules:
 * 1. Only ONE media item (song, video, movie, series) can play at any time.
 * 2. Starting any new media item automatically stops/pauses any previously playing media.
 * 3. Page refreshes and opening existing/associated chats NEVER auto-play media.
 * 4. Paused media preserves state so the user can resume and continue anytime.
 */

type MediaListener = (activeId: string | null) => void;

class GlobalMediaManager {
  private activeId: string | null = null;
  private listeners: Set<MediaListener> = new Set();
  // Set of media IDs that were actively initiated during the live browser session
  private liveSessionInitiated: Set<string> = new Set();

  public getActiveId(): string | null {
    return this.activeId;
  }

  public subscribe(listener: MediaListener): () => void {
    this.listeners.add(listener);
    // Send current state on subscription
    listener(this.activeId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public play(id: string): void {
    if (!id) return;
    this.activeId = id;
    this.liveSessionInitiated.add(id);
    this.notify();
  }

  public pause(id: string): void {
    if (this.activeId === id) {
      this.activeId = null;
      this.notify();
    }
  }

  public stopAll(): void {
    this.activeId = null;
    this.notify();
  }

  public isPlaying(id: string): boolean {
    return Boolean(id && this.activeId === id);
  }

  public markLiveInitiated(id: string): void {
    this.liveSessionInitiated.add(id);
  }

  public isLiveInitiated(id: string): boolean {
    return this.liveSessionInitiated.has(id);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.activeId);
      } catch (err) {
        console.error('[MediaManager] Listener error:', err);
      }
    }
  }
}

export const mediaManager = new GlobalMediaManager();
