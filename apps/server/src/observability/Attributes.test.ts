import { assert, describe, it } from "@effect/vitest";

import { normalizeModelMetricLabel, vcsListRefsTraceAttributes } from "./Attributes.ts";

describe("Attributes", () => {
  it("groups GPT-family models under a shared metric label", () => {
    assert.strictEqual(normalizeModelMetricLabel("gpt-4o"), "gpt");
    assert.strictEqual(normalizeModelMetricLabel("gpt-5.4"), "gpt");
    assert.strictEqual(normalizeModelMetricLabel("claude-sonnet-4"), "claude");
  });

  describe("vcsListRefsTraceAttributes", () => {
    it("omits absent fields so a canonical list stays distinguishable", () => {
      assert.deepStrictEqual(vcsListRefsTraceAttributes({ cwd: "/repo" }), {
        "vcs.cwd": "/repo",
        "vcs.has_query": false,
      });
    });

    it("records the shape of a search- and pagination-derived lookup", () => {
      assert.deepStrictEqual(
        vcsListRefsTraceAttributes({
          cwd: "/repo",
          query: "feature",
          cursor: 100,
          refKind: "local",
          limit: 100,
        }),
        {
          "vcs.cwd": "/repo",
          "vcs.has_query": true,
          "vcs.query_length": 7,
          "vcs.cursor": 100,
          "vcs.ref_kind": "local",
          "vcs.limit": 100,
        },
      );
    });

    it("never records the query text itself", () => {
      const secret = "wip/rename-customer-acme";
      const serialized = JSON.stringify(
        vcsListRefsTraceAttributes({ cwd: "/repo", query: secret }),
      );
      assert.notInclude(serialized, secret);
      assert.include(serialized, '"vcs.query_length":24');
    });
  });
});
