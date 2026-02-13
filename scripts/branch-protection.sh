#!/bin/bash
# Branch Protection Automation Script for SpecSafe
# This script configures branch protection rules via GitHub API
# Usage: ./scripts/branch-protection.sh [github_token] [repo_owner] [repo_name]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_TOKEN="${1:-${GITHUB_TOKEN:-}}"
REPO_OWNER="${2:-${REPO_OWNER:-$(git remote get-url origin 2>/dev/null | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')}}}"
REPO_NAME="${3:-${REPO_NAME:-$(git remote get-url origin 2>/dev/null | sed -n 's/.*github.com[:/][^/]*\/\([^/.]*\).*/\1/p')}}}"
BRANCH="${4:-main}"

print_help() {
    cat << EOF
Usage: $0 [GITHUB_TOKEN] [REPO_OWNER] [REPO_NAME] [BRANCH]

Configure branch protection rules for SpecSafe repository.

Arguments:
    GITHUB_TOKEN    GitHub personal access token (or set GITHUB_TOKEN env var)
    REPO_OWNER      Repository owner/organization (auto-detected from git remote)
    REPO_NAME       Repository name (auto-detected from git remote)
    BRANCH          Branch to protect (default: main)

Environment Variables:
    GITHUB_TOKEN    GitHub personal access token
    REPO_OWNER      Repository owner
    REPO_NAME       Repository name

Examples:
    $0 ghp_xxxxxxxxxxxx
    $0 ghp_xxxx luci-efe specsafe main
    GITHUB_TOKEN=ghp_xxxx REPO_OWNER=luci-efe REPO_NAME=specsafe $0

Required Token Scopes:
    - repo (full control of private repositories)
    - or public_repo (for public repositories)
EOF
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help|help)
        print_help
        exit 0
        ;;
esac

# Validate required inputs
if [ -z "$GITHUB_TOKEN" ]; then
    log_error "GitHub token is required"
    print_help
    exit 1
fi

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    log_error "Could not detect repository owner/name from git remote"
    log_info "Please provide them as arguments or set environment variables"
    print_help
    exit 1
fi

log_info "Configuring branch protection for $REPO_OWNER/$REPO_NAME:$BRANCH"

# Branch protection configuration
# Docs: https://docs.github.com/en/rest/branches/branch-protection
PROTECTION_CONFIG='{
    "required_status_checks": {
        "strict": true,
        "contexts": ["build-and-test"]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": false,
        "require_last_push_approval": false
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": false,
    "required_linear_history": false,
    "required_signatures": false
}'

# Apply branch protection
API_URL="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection"

log_info "Sending protection rules to GitHub API..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$API_URL" \
    -d "$PROTECTION_CONFIG")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Branch protection configured successfully!"
    echo ""
    log_info "Protection rules applied:"
    echo "  ✓ Required status checks: build-and-test"
    echo "  ✓ Required reviews: 1 approving review"
    echo "  ✓ Dismiss stale reviews: enabled"
    echo "  ✓ Force pushes: disabled"
    echo "  ✓ Branch deletion: disabled"
    echo "  ✓ Strict status checks: enabled"
    exit 0
else
    log_error "Failed to configure branch protection (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi
