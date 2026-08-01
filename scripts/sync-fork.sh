#!/usr/bin/env bash
#
# Sync this fork with upstream and merge the refreshed main into a branch.
#
#   1. fetch upstream + origin
#   2. fast-forward local main to upstream/main
#   3. push main to origin (the fork)
#   4. merge main into the working branch
#
# Usage: scripts/sync-fork.sh [options]
#
#   --branch <name>   branch to merge main into (default: current branch)
#   --main <name>     main branch name (default: main)
#   --upstream <name> upstream remote name (default: upstream)
#   --origin <name>   fork remote name (default: origin)
#   --no-push         don't push main to the fork
#   --push-branch     also push the working branch after a clean merge
#   -h, --help        show this help

set -euo pipefail

MAIN_BRANCH="main"
UPSTREAM_REMOTE="upstream"
ORIGIN_REMOTE="origin"
TARGET_BRANCH=""
PUSH_MAIN=1
PUSH_BRANCH=0

usage() {
  sed -n '3,/^$/p' "$0" | sed 's/^#\{1,\} \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch) TARGET_BRANCH="${2:?--branch needs a value}"; shift 2 ;;
    --main) MAIN_BRANCH="${2:?--main needs a value}"; shift 2 ;;
    --upstream) UPSTREAM_REMOTE="${2:?--upstream needs a value}"; shift 2 ;;
    --origin) ORIGIN_REMOTE="${2:?--origin needs a value}"; shift 2 ;;
    --no-push) PUSH_MAIN=0; shift ;;
    --push-branch) PUSH_BRANCH=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarn:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

git rev-parse --git-dir >/dev/null 2>&1 || die "not inside a git repository"
cd "$(git rev-parse --show-toplevel)"

git remote get-url "$UPSTREAM_REMOTE" >/dev/null 2>&1 \
  || die "no '$UPSTREAM_REMOTE' remote; add it with: git remote add $UPSTREAM_REMOTE <upstream-url>"
git remote get-url "$ORIGIN_REMOTE" >/dev/null 2>&1 \
  || die "no '$ORIGIN_REMOTE' remote"

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
[[ -n "$CURRENT_BRANCH" ]] || die "HEAD is detached; check out a branch first"
[[ -n "$TARGET_BRANCH" ]] || TARGET_BRANCH="$CURRENT_BRANCH"

if [[ -n "$(git status --porcelain)" ]]; then
  die "working tree is dirty; commit or stash your changes first"
fi

info "Fetching $UPSTREAM_REMOTE and $ORIGIN_REMOTE"
git fetch --prune "$UPSTREAM_REMOTE"
git fetch --prune "$ORIGIN_REMOTE"

git rev-parse --verify --quiet "$UPSTREAM_REMOTE/$MAIN_BRANCH" >/dev/null \
  || die "$UPSTREAM_REMOTE/$MAIN_BRANCH does not exist"

# Update local main. When main isn't checked out here, a refspec fetch
# fast-forwards it without touching the working tree.
info "Updating $MAIN_BRANCH from $UPSTREAM_REMOTE/$MAIN_BRANCH"
if [[ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]]; then
  git merge --ff-only "$UPSTREAM_REMOTE/$MAIN_BRANCH" \
    || die "$MAIN_BRANCH has diverged from $UPSTREAM_REMOTE/$MAIN_BRANCH; resolve it manually"
else
  git fetch "$UPSTREAM_REMOTE" "$MAIN_BRANCH:$MAIN_BRANCH" \
    || die "$MAIN_BRANCH has diverged from $UPSTREAM_REMOTE/$MAIN_BRANCH (or is checked out in another worktree); resolve it manually"
fi
info "$MAIN_BRANCH is now at $(git rev-parse --short "$MAIN_BRANCH") ($(git log -1 --format=%s "$MAIN_BRANCH"))"

if (( PUSH_MAIN )); then
  if git rev-parse --verify --quiet "$ORIGIN_REMOTE/$MAIN_BRANCH" >/dev/null \
     && [[ "$(git rev-parse "$ORIGIN_REMOTE/$MAIN_BRANCH")" == "$(git rev-parse "$MAIN_BRANCH")" ]]; then
    info "$ORIGIN_REMOTE/$MAIN_BRANCH already up to date"
  else
    info "Pushing $MAIN_BRANCH to $ORIGIN_REMOTE"
    git push "$ORIGIN_REMOTE" "$MAIN_BRANCH:$MAIN_BRANCH"
  fi
else
  warn "skipping push to $ORIGIN_REMOTE (--no-push)"
fi

if [[ "$TARGET_BRANCH" == "$MAIN_BRANCH" ]]; then
  info "Target branch is $MAIN_BRANCH; nothing to merge."
  exit 0
fi

if [[ "$TARGET_BRANCH" != "$CURRENT_BRANCH" ]]; then
  info "Checking out $TARGET_BRANCH"
  git checkout "$TARGET_BRANCH"
fi

if git merge-base --is-ancestor "$MAIN_BRANCH" HEAD; then
  info "$TARGET_BRANCH already contains $MAIN_BRANCH; nothing to merge."
  exit 0
fi

info "Merging $MAIN_BRANCH into $TARGET_BRANCH"
if ! git merge --no-edit "$MAIN_BRANCH"; then
  warn "merge stopped with conflicts. Resolve them, then:"
  warn "  git add <files> && git commit"
  warn "or abort with: git merge --abort"
  exit 1
fi

info "Merged. $TARGET_BRANCH is at $(git rev-parse --short HEAD)"

if (( PUSH_BRANCH )); then
  info "Pushing $TARGET_BRANCH to $ORIGIN_REMOTE"
  git push "$ORIGIN_REMOTE" "$TARGET_BRANCH"
else
  info "Push when ready: git push $ORIGIN_REMOTE $TARGET_BRANCH"
fi
