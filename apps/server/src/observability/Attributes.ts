import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";

export type MetricAttributeValue = string;
export type MetricAttributes = Readonly<Record<string, MetricAttributeValue>>;
export type ObservabilityOutcome = "success" | "failure" | "interrupt";

export function compactMetricAttributes(
  attributes: Readonly<Record<string, unknown>>,
): MetricAttributes {
  return Object.fromEntries(
    Object.entries(attributes).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return [];
      }
      if (typeof value === "string") {
        return [[key, value]];
      }
      if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
        return [[key, String(value)]];
      }
      return [];
    }),
  );
}

/**
 * Trace attributes identifying which ref lookup a request actually made.
 *
 * `rpc.method` alone cannot distinguish the canonical list for a repository
 * from one of many search- or pagination-derived variants, and those variants
 * are what multiply under a misbehaving client. Recording the shape makes that
 * fan-out visible directly instead of leaving it to be inferred from timing.
 *
 * The query is text someone typed, so only its presence and length are
 * recorded: enough to separate a search-derived call from a canonical one and
 * to watch a per-keystroke fan-out grow, without putting the text itself into
 * a trace file that gets copied around.
 */
export function vcsListRefsTraceAttributes(input: {
  readonly cwd: string;
  readonly query?: string | undefined;
  readonly cursor?: number | undefined;
  readonly refKind?: string | undefined;
  readonly limit?: number | undefined;
}): Readonly<Record<string, unknown>> {
  return {
    "vcs.cwd": input.cwd,
    "vcs.has_query": input.query !== undefined,
    ...(input.query === undefined ? {} : { "vcs.query_length": input.query.length }),
    ...(input.cursor === undefined ? {} : { "vcs.cursor": input.cursor }),
    ...(input.refKind === undefined ? {} : { "vcs.ref_kind": input.refKind }),
    ...(input.limit === undefined ? {} : { "vcs.limit": input.limit }),
  };
}

export function outcomeFromExit(exit: Exit.Exit<unknown, unknown>): ObservabilityOutcome {
  if (Exit.isSuccess(exit)) {
    return "success";
  }
  return Cause.hasInterruptsOnly(exit.cause) ? "interrupt" : "failure";
}

export function normalizeModelMetricLabel(model: string | null | undefined): string | undefined {
  const normalized = model?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized.includes("gpt")) {
    return "gpt";
  }
  if (normalized.includes("claude")) {
    return "claude";
  }
  if (normalized.includes("gemini")) {
    return "gemini";
  }
  return "other";
}
