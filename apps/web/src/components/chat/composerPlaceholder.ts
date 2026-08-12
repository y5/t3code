export interface ComposerPlaceholderState {
  readonly approvalDetail: string | null;
  readonly isApprovalState: boolean;
  readonly hasPendingAnswer: boolean;
  readonly hasPlanFollowUp: boolean;
  readonly projectSelectionRequired: boolean;
  readonly noProviderAvailable: boolean;
  readonly isDisconnected: boolean;
}

export function resolveComposerPlaceholder(state: ComposerPlaceholderState): string {
  if (state.isApprovalState) {
    return state.approvalDetail ?? "Resolve this approval request to continue";
  }
  if (state.hasPendingAnswer) {
    return "Type your own answer, or leave this blank to use the selected option";
  }
  if (state.hasPlanFollowUp) {
    return "Add feedback to refine the plan, or leave this blank to implement it";
  }
  if (state.projectSelectionRequired) {
    return "Choose a project above to start a thread";
  }
  if (state.noProviderAvailable) {
    return "Enable a provider in Settings to send a message";
  }
  if (state.isDisconnected) {
    return "Ask for follow-up changes or attach images";
  }
  return "";
}
