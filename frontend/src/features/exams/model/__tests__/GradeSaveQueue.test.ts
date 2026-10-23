import { afterEach, expect, it, vi } from 'vitest';
import { GradeSaveQueue } from '../GradeSaveQueue';
afterEach(() => vi.useRealTimers());
it('saves rapid edits for two students in the same batch', async () => {
  vi.useFakeTimers();
  const save = vi.fn().mockResolvedValue(undefined);
  const queue = new GradeSaveQueue<{student_id: number; cc: number}>(save);
  queue.enqueue({ student_id: 1, cc: 8 });
  queue.enqueue({ student_id: 2, cc: 13 });
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledWith([{ student_id: 1, cc: 8 }, { student_id: 2, cc: 13 }]);
  expect(queue.dirty).toBe(false);
});
it('retains the latest edits after a failed request and retries explicitly', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  const queue = new GradeSaveQueue<{student_id: number; cc: number}>(save);
  queue.enqueue({ student_id: 1, cc: 8 });
  await expect(queue.flush()).rejects.toThrow('offline');
  expect(queue.dirty).toBe(true);
  queue.enqueue({ student_id: 1, cc: 14 });
  await queue.flush();
  expect(save).toHaveBeenLastCalledWith([{ student_id: 1, cc: 14 }]);
  expect(queue.dirty).toBe(false);
});
it('serializes changes made while the first request is still running', async () => {
  let complete!: () => void;
  const save = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { complete = resolve; })).mockResolvedValue(undefined);
  const queue = new GradeSaveQueue<{student_id: number; cc: number}>(save);
  queue.enqueue({ student_id: 1, cc: 8 });
  const saving = queue.flush();
  queue.enqueue({ student_id: 2, cc: 13 });
  complete();
  await saving;
  expect(save).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenLastCalledWith([{ student_id: 2, cc: 13 }]);
});
