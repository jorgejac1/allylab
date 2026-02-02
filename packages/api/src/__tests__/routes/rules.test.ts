import type { FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { rulesRoutes, getEnabledRules } from "../../routes/rules";

// Mock storage to avoid filesystem writes
class MemoryStorage<T extends { id: string }> {
  data = new Map<string, T>();
  get(id: string) { return this.data.get(id); }
  getAll() { return Array.from(this.data.values()); }
  set(id: string, item: T) { this.data.set(id, item); }
  delete(id: string) { return this.data.delete(id); }
  import(items: T[], replace = false) {
    if (replace) this.data.clear();
    items.forEach(item => this.data.set(item.id, item));
    return items.length;
  }
  size() { return this.data.size; }
  has(id: string) { return this.data.has(id); }
  clear() { this.data.clear(); }
}

type RuleShape = {
  id: string;
  name: string;
  selector: string;
  type: string;
  severity: string;
  condition: { operator: string };
  enabled?: boolean;
  description?: string;
};

// Use var to avoid TDZ when mock factory is hoisted
var storage: MemoryStorage<RuleShape>; // eslint-disable-line no-var

vi.mock("../../utils/storage", () => {
  class InlineStorage<T extends { id: string }> {
    data = new Map<string, T>();
    constructor() {
      // assign shared instance for test access
      storage = this as unknown as MemoryStorage<RuleShape>;
    }
    get(id: string) { return this.data.get(id); }
    getAll() { return Array.from(this.data.values()); }
    set(id: string, item: T) { this.data.set(id, item); }
    delete(id: string) { return this.data.delete(id); }
    import(items: T[], replace = false) {
      if (replace) this.data.clear();
      items.forEach(item => this.data.set(item.id, item));
      return items.length;
    }
    size() { return this.data.size; }
    has(id: string) { return this.data.has(id); }
    clear() { this.data.clear(); }
  }
  return { JsonStorage: InlineStorage };
});

type RouteHandler = (
  req: { body?: Record<string, unknown>; params?: Record<string, string> },
  reply: ReplyMock
) => Promise<unknown> | unknown;

type FastifyMock = {
  get: (path: string, handler: RouteHandler) => FastifyMock;
  post: (path: string, handler: RouteHandler) => FastifyMock;
  put: (path: string, handler: RouteHandler) => FastifyMock;
  delete: (path: string, handler: RouteHandler) => FastifyMock;
  routes: Map<string, RouteHandler>;
  log: { error: (...args: unknown[]) => void; info: (...args: unknown[]) => void };
};

type ReplyMock = {
  statusCode: number;
  payload: unknown;
  status: (code: number) => ReplyMock;
  send: (payload: unknown) => unknown;
};

function createFastifyMock(): FastifyMock {
  const routes = new Map<string, RouteHandler>();
  const fastify: FastifyMock = {
    get: ((path: string, handler: RouteHandler) => {
      routes.set(`GET:${path}`, handler);
      return fastify;
    }) as FastifyMock["get"],
    post: ((path: string, handler: RouteHandler) => {
      routes.set(`POST:${path}`, handler);
      return fastify;
    }) as FastifyMock["post"],
    put: ((path: string, handler: RouteHandler) => {
      routes.set(`PUT:${path}`, handler);
      return fastify;
    }) as FastifyMock["put"],
    delete: ((path: string, handler: RouteHandler) => {
      routes.set(`DELETE:${path}`, handler);
      return fastify;
    }) as FastifyMock["delete"],
    routes,
    log: { error: vi.fn(), info: vi.fn() },
  };
  return fastify;
}

function createReply(): ReplyMock {
  const reply: ReplyMock = {
    statusCode: 200,
    payload: undefined,
    status: (code: number) => {
      reply.statusCode = code;
      return reply;
    },
    send: (payload: unknown) => {
      reply.payload = payload;
      return payload;
    },
  };
  return reply;
}

function getRoute(f: FastifyMock, method: string, path: string) {
  return f.routes.get(`${method}:${path}`)!;
}

const baseRule = {
  name: "Rule",
  selector: "button",
  type: "exists",
  severity: "high",
  condition: { operator: "exists" },
};

describe("routes/rules", () => {
  let fastify: FastifyMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    storage?.clear();
    fastify = createFastifyMock();
    await rulesRoutes(fastify as unknown as FastifyInstance);
  });

  it("lists rules", async () => {
    const handler = getRoute(fastify, "GET", "/rules");
    const reply = createReply();
    storage.set("id1", { ...baseRule, id: "id1", enabled: true });
    storage.set("id2", { ...baseRule, id: "id2", enabled: false });
    await handler({} as never, reply);
    const payload = reply.payload as { data: { rules: RuleShape[]; enabled: number; total: number } };
    expect(payload.data.rules.length).toBe(2);
    expect(payload.data.enabled).toBe(1);
    expect(payload.data.total).toBe(2);
  });

  it("returns 404 for missing rule", async () => {
    const handler = getRoute(fastify, "GET", "/rules/:id");
    const reply = createReply();
    await handler({ params: { id: "nope" } }, reply);
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ success: false, error: "Rule not found" });
  });

  it("validates required fields on create", async () => {
    const handler = getRoute(fastify, "POST", "/rules");
    const reply = createReply();
    await handler({ body: { name: "" } }, reply);
    expect(reply.statusCode).toBe(400);
  });

  it("returns 400 for invalid CSS selector", async () => {
    const handler = getRoute(fastify, "POST", "/rules");
    const reply = createReply();
    await handler({ body: { ...baseRule, selector: "   " } }, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, error: "Invalid CSS selector" });
  });

  it("creates, retrieves, updates, and deletes a rule", async () => {
    const createHandler = getRoute(fastify, "POST", "/rules");
    const getHandler = getRoute(fastify, "GET", "/rules/:id");
    const updateHandler = getRoute(fastify, "PUT", "/rules/:id");
    const deleteHandler = getRoute(fastify, "DELETE", "/rules/:id");

    const replyCreate = createReply();
    await createHandler({ body: baseRule }, replyCreate);
    const created = (replyCreate.payload as { data: { id: string } }).data;

    const replyGet = createReply();
    await getHandler({ params: { id: created.id } }, replyGet);
    expect(replyGet.payload).toMatchObject({ success: true });

    const replyUpdate = createReply();
    await updateHandler({ params: { id: created.id }, body: { name: "Updated" } }, replyUpdate);
    expect((replyUpdate.payload as { data: { name: string } }).data.name).toBe("Updated");

    const replyDelete = createReply();
    await deleteHandler({ params: { id: created.id } }, replyDelete);
    expect((replyDelete.payload as { success: boolean }).success).toBe(true);
  });

  it("returns 404 on update when rule missing", async () => {
    const handler = getRoute(fastify, "PUT", "/rules/:id");
    const reply = createReply();
    await handler({ params: { id: "missing" }, body: {} }, reply);
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ success: false, error: "Rule not found" });
  });

  it("returns 404 on delete when rule missing", async () => {
    const handler = getRoute(fastify, "DELETE", "/rules/:id");
    const reply = createReply();
    await handler({ params: { id: "missing" } }, reply);
    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ success: false, error: "Rule not found" });
  });

  it("defaults condition to empty object when not provided", async () => {
    const handler = getRoute(fastify, "POST", "/rules");
    const reply = createReply();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { condition: _omit, ...rest } = baseRule;

    await handler({ body: rest }, reply);

    const payload = reply.payload as { data: RuleShape };
    expect(payload.data.condition).toEqual({});
  });

  it("tests rule against HTML", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler({ body: { rule: { ...baseRule, condition: { operator: "not-exists" } }, html: "<div></div>" } }, reply);
    const payload = reply.payload as { data: { passed: boolean; violations: unknown[] } };
    expect(payload.data.passed).toBe(false);
    expect(payload.data.violations.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 400 when rule test body missing", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler({ body: { rule: null, html: "" } as unknown as { rule: unknown; html: string } }, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ success: false, error: "rule and html are required" });
  });

  it("adds violation when rule condition is exists and selector matches", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "div", condition: { operator: "exists" } }, html: "<div></div>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: Array<{ selector: string }> } };
    expect(payload.data.passed).toBe(false);
    expect(payload.data.violations[0].selector).toBe("div");
  });

  it("passes when exists condition does not find selector", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "span", condition: { operator: "exists" } }, html: "<div></div>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: Array<{ selector: string }> } };
    expect(payload.data.passed).toBe(true);
    expect(payload.data.violations.length).toBe(0);
  });

  it("uses default violation message on exists when match found", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "p", condition: { operator: "exists" }, message: undefined }, html: "<p></p>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: Array<{ message: string }> } };
    expect(payload.data.passed).toBe(false);
    expect(payload.data.violations[0].message).toBe("Violation found");
  });

  it("passes when condition operator is unrecognized (skips branches)", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "p", condition: { operator: "other" } }, html: "<p></p>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: unknown[] } };
    expect(payload.data.passed).toBe(true);
    expect(payload.data.violations.length).toBe(0);
  });

  it("returns 500 with Error message when test throws", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    // force regex construction to throw by giving an invalid pattern and mocking replace
    const badRule = { ...baseRule, selector: "\\", condition: { operator: "exists" } };
    const originalReplace = String.prototype.replace;
    String.prototype.replace = () => {
      throw new Error("regex explode");
    };
    await handler({ body: { rule: badRule, html: "<div></div>" } }, reply);
    String.prototype.replace = originalReplace;

    expect(reply.statusCode).toBe(500);
    expect(reply.payload).toEqual({ success: false, error: "regex explode" });
  });

  it("adds violation when not-exists condition and selector missing", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "span", condition: { operator: "not-exists" } }, html: "<div></div>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: Array<{ selector: string }> } };
    expect(payload.data.passed).toBe(false);
    expect(payload.data.violations[0].selector).toBe("span");
  });

  it("passes when not-exists condition and selector is present (else branch)", async () => {
    const handler = getRoute(fastify, "POST", "/rules/test");
    const reply = createReply();
    await handler(
      { body: { rule: { ...baseRule, selector: "div", condition: { operator: "not-exists" } }, html: "<div></div>" } },
      reply
    );
    const payload = reply.payload as { data: { passed: boolean; violations: Array<{ selector: string }> } };
    expect(payload.data.passed).toBe(true);
    expect(payload.data.violations.length).toBe(0);
  });

  it("imports rules with replace", async () => {
    const handler = getRoute(fastify, "POST", "/rules/import");
    const replyBad = createReply();
    await handler({ body: {} }, replyBad);
    expect(replyBad.statusCode).toBe(400);

    const replyOk = createReply();
    await handler({ body: { rules: [{ ...baseRule, id: "r1" }], replace: true } }, replyOk);
    expect((replyOk.payload as { data: { imported: number } }).data.imported).toBe(1);
  });

  it("exports rules and returns enabled rules", async () => {
    const createHandler = getRoute(fastify, "POST", "/rules");
    const exportHandler = getRoute(fastify, "GET", "/rules/export");
    const enabledHandler = getRoute(fastify, "GET", "/rules/enabled");

    await createHandler({ body: { ...baseRule, enabled: true } }, createReply());
    const replyExport = createReply();
    await exportHandler({} as never, replyExport);
    expect((replyExport.payload as { data: { rules: unknown[] } }).data.rules.length).toBe(1);

    const replyEnabled = createReply();
    await enabledHandler({} as never, replyEnabled);
    expect((replyEnabled.payload as { data: unknown[] }).data.length).toBe(1);
  });

  it("getEnabledRules returns only enabled rules", async () => {
    // Add via route handlers to use the same rulesStore instance
    const createHandler = getRoute(fastify, "POST", "/rules");
    await createHandler({ body: { ...baseRule, enabled: true } }, createReply());
    await createHandler({ body: { ...baseRule, id: "disabled-1", enabled: false } }, createReply());

    const enabled = await getEnabledRules();
    expect(enabled.length).toBe(1);
    expect(enabled[0].enabled).toBe(true);
  });

  describe("error handling", () => {
    const originalGetAll = () => storage.getAll;
    const originalGet = () => storage.get;
    const originalSet = () => storage.set;
    const originalImport = () => storage.import;
    const originalDelete = () => storage.delete;

    afterEach(() => {
      if (!storage) return;
      storage.getAll = originalGetAll();
      storage.get = originalGet();
      storage.set = originalSet();
      storage.import = originalImport();
      storage.delete = originalDelete();
    });

    it("returns 500 when list throws non-Error", async () => {
      storage.getAll = vi.fn(() => {
        throw "boom";
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 with Error message when list throws Error", async () => {
      storage.getAll = vi.fn(() => {
        throw new Error("list fail");
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "list fail" });
    });

    it("returns 500 when get throws", async () => {
      storage.get = vi.fn(() => {
        throw new Error("get fail");
      }) as unknown as typeof storage.get;
      const handler = getRoute(fastify, "GET", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: "x" } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "get fail" });
    });

    it("returns 500 with Unknown error when get throws non-Error", async () => {
      storage.get = vi.fn(() => {
        throw "get boom";
      }) as unknown as typeof storage.get;
      const handler = getRoute(fastify, "GET", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: "x" } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 when create throws non-Error", async () => {
      storage.set = vi.fn(() => {
        throw "set fail";
      }) as unknown as typeof storage.set;
      const handler = getRoute(fastify, "POST", "/rules");
      const reply = createReply();
      await handler({ body: baseRule }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 when create throws Error", async () => {
      storage.set = vi.fn(() => {
        throw new Error("create fail");
      }) as unknown as typeof storage.set;
      const handler = getRoute(fastify, "POST", "/rules");
      const reply = createReply();
      await handler({ body: baseRule }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "create fail" });
    });

    it("returns 500 when update throws", async () => {
      storage.set = vi.fn();
      const ruleId = "rule-xyz";
      storage.get = vi.fn(() => ({ ...baseRule, id: ruleId, enabled: true })) as unknown as typeof storage.get;
      storage.set = vi.fn(() => {
        throw new Error("update fail");
      }) as unknown as typeof storage.set;

      const handler = getRoute(fastify, "PUT", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: ruleId }, body: {} }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "update fail" });
    });

    it("returns 500 Unknown error when update throws non-Error", async () => {
      const ruleId = "rule-abc";
      storage.get = vi.fn(() => ({ ...baseRule, id: ruleId, enabled: true })) as unknown as typeof storage.get;
      storage.set = vi.fn(() => {
        throw "oops";
      }) as unknown as typeof storage.set;

      const handler = getRoute(fastify, "PUT", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: ruleId }, body: {} }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 when delete throws non-Error", async () => {
      storage.get = vi.fn(() => ({ ...baseRule, id: "id1", enabled: true })) as unknown as typeof storage.get;
      storage.delete = vi.fn(() => {
        throw "del fail";
      }) as unknown as typeof storage.delete;
      const handler = getRoute(fastify, "DELETE", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: "id1" } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 with Error message when delete throws Error", async () => {
      storage.get = vi.fn(() => ({ ...baseRule, id: "id1", enabled: true })) as unknown as typeof storage.get;
      storage.delete = vi.fn(() => {
        throw new Error("delete fail");
      }) as unknown as typeof storage.delete;
      const handler = getRoute(fastify, "DELETE", "/rules/:id");
      const reply = createReply();
      await handler({ params: { id: "id1" } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "delete fail" });
    });

    it("returns 500 when test throws non-Error", async () => {
      const handler = getRoute(fastify, "POST", "/rules/test");
      const reply = createReply();
      // Force regex construction to throw by mocking replace
      const badRule = { ...baseRule, selector: "[" };
      await handler({ body: { rule: badRule, html: "<div></div>" } }, reply);
      const originalReplace = String.prototype.replace;
      String.prototype.replace = () => {
        throw "regex fail";
      };
      const reply2 = createReply();
      await handler({ body: { rule: baseRule, html: "<div></div>" } }, reply2);
      String.prototype.replace = originalReplace;
      expect(reply2.statusCode).toBe(500);
      expect(reply2.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 when import throws", async () => {
      storage.import = vi.fn(() => {
        throw new Error("import fail");
      }) as unknown as typeof storage.import;
      const handler = getRoute(fastify, "POST", "/rules/import");
      const reply = createReply();
      await handler({ body: { rules: [baseRule] } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "import fail" });
    });

    it("returns 500 Unknown error when import throws non-Error", async () => {
      storage.import = vi.fn(() => {
        throw "import boom";
      }) as unknown as typeof storage.import;
      const handler = getRoute(fastify, "POST", "/rules/import");
      const reply = createReply();
      await handler({ body: { rules: [baseRule] } }, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 when export throws", async () => {
      storage.getAll = vi.fn(() => {
        throw "boom";
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules/export");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });

    it("returns 500 with Error message when export throws Error", async () => {
      storage.getAll = vi.fn(() => {
        throw new Error("export fail");
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules/export");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "export fail" });
    });

    it("returns 500 when enabled throws", async () => {
      storage.getAll = vi.fn(() => {
        throw new Error("enabled fail");
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules/enabled");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "enabled fail" });
    });

    it("returns 500 Unknown error when enabled throws non-Error", async () => {
      storage.getAll = vi.fn(() => {
        throw "enabled boom";
      }) as unknown as typeof storage.getAll;
      const handler = getRoute(fastify, "GET", "/rules/enabled");
      const reply = createReply();
      await handler({} as never, reply);
      expect(reply.statusCode).toBe(500);
      expect(reply.payload).toEqual({ success: false, error: "Unknown error" });
    });
  });
});
