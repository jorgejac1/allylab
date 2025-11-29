import { describe, it, expect, vi } from 'vitest';
import { sendSSE, endSSE } from '../../utils/sse';
import type { FastifyReply } from 'fastify';

/**
 * Create a mock FastifyReply with raw stream
 */
function createMockReply() {
  return {
    raw: {
      write: vi.fn(),
      end: vi.fn(),
    },
  } as unknown as FastifyReply;
}

describe('utils/sse', () => {
  describe('sendSSE', () => {
    it('writes event and data in SSE format', () => {
      const reply = createMockReply();
      const data = { message: 'hello' };

      sendSSE(reply, 'test-event', data);

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: test-event\ndata: {"message":"hello"}\n\n'
      );
    });

    it('serializes string data as JSON', () => {
      const reply = createMockReply();

      sendSSE(reply, 'message', 'simple string');

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: message\ndata: "simple string"\n\n'
      );
    });

    it('serializes number data as JSON', () => {
      const reply = createMockReply();

      sendSSE(reply, 'count', 42);

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: count\ndata: 42\n\n'
      );
    });

    it('serializes boolean data as JSON', () => {
      const reply = createMockReply();

      sendSSE(reply, 'status', true);

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: status\ndata: true\n\n'
      );
    });

    it('serializes null data as JSON', () => {
      const reply = createMockReply();

      sendSSE(reply, 'empty', null);

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: empty\ndata: null\n\n'
      );
    });

    it('serializes array data as JSON', () => {
      const reply = createMockReply();
      const data = [1, 2, 3];

      sendSSE(reply, 'list', data);

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: list\ndata: [1,2,3]\n\n'
      );
    });

    it('serializes complex nested object', () => {
      const reply = createMockReply();
      const data = {
        scan: {
          url: 'https://example.com',
          score: 85,
          issues: [
            { id: '1', severity: 'critical' },
            { id: '2', severity: 'minor' },
          ],
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      sendSSE(reply, 'scan-result', data);

      const expectedData = JSON.stringify(data);
      expect(reply.raw.write).toHaveBeenCalledWith(
        `event: scan-result\ndata: ${expectedData}\n\n`
      );
    });

    it('handles special characters in event name', () => {
      const reply = createMockReply();

      sendSSE(reply, 'scan:progress', { percent: 50 });

      expect(reply.raw.write).toHaveBeenCalledWith(
        'event: scan:progress\ndata: {"percent":50}\n\n'
      );
    });

    it('can be called multiple times', () => {
      const reply = createMockReply();

      sendSSE(reply, 'event1', { step: 1 });
      sendSSE(reply, 'event2', { step: 2 });
      sendSSE(reply, 'event3', { step: 3 });

      expect(reply.raw.write).toHaveBeenCalledTimes(3);
    });
  });

  describe('endSSE', () => {
    it('calls end on raw response', () => {
      const reply = createMockReply();

      endSSE(reply);

      expect(reply.raw.end).toHaveBeenCalled();
    });

    it('calls end exactly once', () => {
      const reply = createMockReply();

      endSSE(reply);

      expect(reply.raw.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration: full SSE stream', () => {
    it('simulates a complete scan progress stream', () => {
      const reply = createMockReply();

      // Simulate scan progress events
      sendSSE(reply, 'scan:start', { url: 'https://example.com' });
      sendSSE(reply, 'scan:progress', { percent: 25, phase: 'loading' });
      sendSSE(reply, 'scan:progress', { percent: 50, phase: 'analyzing' });
      sendSSE(reply, 'scan:progress', { percent: 75, phase: 'generating' });
      sendSSE(reply, 'scan:complete', { score: 85, issues: 10 });
      endSSE(reply);

      expect(reply.raw.write).toHaveBeenCalledTimes(5);
      expect(reply.raw.end).toHaveBeenCalledTimes(1);

      // Verify order of calls
      const writeCalls = (reply.raw.write as ReturnType<typeof vi.fn>).mock.calls;
      expect(writeCalls[0][0]).toContain('scan:start');
      expect(writeCalls[4][0]).toContain('scan:complete');
    });
  });
});