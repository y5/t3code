# Focused Ctrl+K Thread Switcher

## Goal

Make Ctrl+K a focused thread switcher. Its root view and search results show only the contextual **New thread** action and threads that are currently open. Inactive thread history and unrelated commands do not appear.

## User-visible behavior

- Opening Ctrl+K shows the contextual **New thread** action followed by every open thread.
- Typing searches only the open threads and the **New thread** action.
- Settled, snoozed, and archived threads never appear, including through message-content search.
- Project results and unrelated actions such as settings, theme editing, and file search do not appear in Ctrl+K.
- Dedicated shortcuts and explicit entry points for file search, project search, add-project, settings, and the **New thread in...** picker continue to work.
- The thread section is labeled **Open Threads**, and the input copy describes open-thread search rather than general command/project search.

## Open-thread definition

The palette follows the sidebar lifecycle order:

1. Archived threads are excluded.
2. Effectively snoozed threads are excluded when the environment supports snoozing.
3. Pinned threads are included after the snooze check.
4. Effectively settled threads are excluded when the environment supports settlement, using the configured auto-settle window and the same minute-based clock as the sidebar.
5. Remaining threads are open.

This keeps older-server behavior safe: when an environment lacks the relevant lifecycle capability, the palette does not hide threads based on unsupported state. Pull-request-driven settlement remains server-backed for the palette; merged or closed pull-request threads disappear when that settlement is reflected in the thread shell.

## Implementation

Add a pure command-palette lifecycle selector with explicit time, settings, and capability inputs. Use its result as the only thread collection passed to both the root list and typed search.

Keep the existing action construction needed by explicit palette entry points, but build the Ctrl+K root groups from only the contextual **New thread** item and the open-thread items. Disable project-result injection for root search. Remove the recent-thread limit because the requested surface contains every open thread, not a recent sample.

No wire contract, server, provider, desktop-shell, or mobile change is required. Desktop inherits the web palette behavior. Mobile has no Ctrl+K surface.

## Verification

Focused unit tests will prove that:

- active and pinned threads remain visible;
- archived, effectively snoozed, explicitly settled, and auto-settled threads are excluded;
- root groups contain only **New thread** and open threads;
- typed queries cannot inject project or inactive-thread results;
- explicit submenu entry points remain unaffected by the root-view restriction.

Run the command-palette logic tests plus targeted web typechecking or linting for the touched files. Browser verification is excluded unless separately authorized.
