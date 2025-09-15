import { Injectable } from '@nestjs/common';

interface QueueItem {
  resolve: (release: () => void) => void;
}

@Injectable()
export class PerUserMutex {
  private queues: Map<string, QueueItem[]> = new Map();
  private locks: Set<string> = new Set();

  async acquire(userId: string): Promise<() => void> {
    return new Promise<() => void>((outerResolve) => {
      const queue = this.queues.get(userId) ?? [];
      this.queues.set(userId, queue);

      const acquireFn = () => {
        this.locks.add(userId);
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          const q = this.queues.get(userId)!;
          if (q.length > 0) {
            // Next in line
            const next = q.shift()!;
            next.resolve(acquireFn as any);
          } else {
            this.locks.delete(userId);
          }
        };
        outerResolve(release);
      };

      if (!this.locks.has(userId)) {
        acquireFn();
      } else {
        queue.push({ resolve: (fn) => fn() });
      }
    });
  }
}
