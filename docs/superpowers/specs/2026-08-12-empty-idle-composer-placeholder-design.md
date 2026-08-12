# Empty Idle Composer Placeholder

## Goal

Remove the suggested instructional text from an otherwise available, idle prompt box.

## Behavior

- The normal composer state renders no placeholder text.
- Contextual placeholders remain for approval requests, pending user-input answers, plan feedback, required project selection, missing providers, and disconnected environments.
- Prompt entry, file and folder mentions, skills, commands, accessibility state, and composer sizing remain unchanged.

## Implementation

Change only the final idle branch of the composer placeholder selection to an empty string. Keep the existing prompt editor placeholder rendering because other composer states still depend on it.

This is a shared web composer change, so desktop inherits it. Mobile uses a separate native composer and is out of scope.

## Verification

Add a pure placeholder-selection helper with focused tests proving that the idle state is empty while every contextual state retains its current guidance. Run the focused test, web typecheck, targeted lint, formatting, and diff checks. Browser verification is excluded unless separately authorized.
