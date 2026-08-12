import { describe, expect, it } from "vite-plus/test";

import { resolveComposerPlaceholder, type ComposerPlaceholderState } from "./composerPlaceholder";

const IDLE_STATE: ComposerPlaceholderState = {
  approvalDetail: null,
  isApprovalState: false,
  hasPendingAnswer: false,
  hasPlanFollowUp: false,
  projectSelectionRequired: false,
  noProviderAvailable: false,
  isDisconnected: false,
};

describe("resolveComposerPlaceholder", () => {
  it("leaves the ordinary idle composer empty", () => {
    expect(resolveComposerPlaceholder(IDLE_STATE)).toBe("");
  });

  it.each([
    [
      "pending answer",
      { hasPendingAnswer: true },
      "Type your own answer, or leave this blank to use the selected option",
    ],
    [
      "plan follow-up",
      { hasPlanFollowUp: true },
      "Add feedback to refine the plan, or leave this blank to implement it",
    ],
    [
      "required project",
      { projectSelectionRequired: true },
      "Choose a project above to start a thread",
    ],
    [
      "missing provider",
      { noProviderAvailable: true },
      "Enable a provider in Settings to send a message",
    ],
    [
      "disconnected environment",
      { isDisconnected: true },
      "Ask for follow-up changes or attach images",
    ],
  ] satisfies ReadonlyArray<readonly [string, Partial<ComposerPlaceholderState>, string]>)(
    "preserves the %s guidance",
    (_label, overrides, expected) => {
      expect(resolveComposerPlaceholder({ ...IDLE_STATE, ...overrides })).toBe(expected);
    },
  );

  it("preserves approval detail and its fallback", () => {
    expect(
      resolveComposerPlaceholder({
        ...IDLE_STATE,
        isApprovalState: true,
        approvalDetail: "Allow this command?",
      }),
    ).toBe("Allow this command?");
    expect(resolveComposerPlaceholder({ ...IDLE_STATE, isApprovalState: true })).toBe(
      "Resolve this approval request to continue",
    );
  });
});
