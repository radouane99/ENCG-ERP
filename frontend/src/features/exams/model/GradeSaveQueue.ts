export class GradeSaveQueue<T extends { student_id: number }> {
  private pending = new Map<number, T>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | undefined;
  constructor(private save: (rows: T[]) => Promise<void>, private delay = 1000) {}
  get dirty() { return this.pending.size > 0 || !!this.running; }
  discard() {
    if (this.running) return false;
    clearTimeout(this.timer);
    this.pending.clear();
    return true;
  }
  enqueue(row: T) {
    this.pending.set(row.student_id, row);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush().catch(() => {}); }, this.delay);
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) return this.running.then(() => this.flush());
    if (!this.pending.size) return Promise.resolve();
    const batch = [...this.pending.values()];
    this.pending.clear();
    this.running = this.save(batch).catch(error => {
      for (const row of batch) if (!this.pending.has(row.student_id)) this.pending.set(row.student_id, row);
      throw error;
    }).finally(() => { this.running = undefined; });
    return this.running.then(() => this.pending.size ? this.flush() : undefined);
  }
}
