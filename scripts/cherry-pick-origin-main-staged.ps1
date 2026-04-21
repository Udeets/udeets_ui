<#
.SYNOPSIS
  Port origin/main onto the current branch in small, testable stages using
  `git cherry-pick -n` (apply without committing) so you can run the app and
  commit only when satisfied.

.DESCRIPTION
  Your offshoot branch already contains heavy work on posts, discover, and
  home. origin/main mixes those areas with marketing/about, invites, cover
  offset, idle timeout, etc. Some main commits are intentionally SKIPPED or
  DEFERRED to avoid undoing your enhancements.

  Before running: commit or stash a clean tree on offshoot-design (or a
  throwaway integration branch).

.PARAMETER Stage
  Which stage to apply (1-8). Omit to list stages only.

.PARAMETER List
  Print stage definitions and exit.

.PARAMETER DryRun
  Print the git commands that would run, without executing.

.EXAMPLE
  ./scripts/cherry-pick-origin-main-staged.ps1 -List

.EXAMPLE
  git checkout -b integration/main-port offshoot-design
  ./scripts/cherry-pick-origin-main-staged.ps1 -Stage 1
  # test, then:
  git commit -m "chore(main-port): marketing about page (staged 1)"

.EXAMPLE
  ./scripts/cherry-pick-origin-main-staged.ps1 -Stage 3
#>

param(
  [ValidateRange(1, 8)]
  [int] $Stage = 0,
  [switch] $List,
  [switch] $DryRun
)

$ErrorActionPreference = "Stop"

# Oldest -> newest within each stage (order matters for cherry-pick).
$Stages = @(
  @{
    Id   = 1
    Name = "Marketing /about page (low overlap)"
    Commits = @("02240a3", "967b743") # About page update + final tweak
    Notes = "apps/web/app/about/page.tsx, PROJECT_CONTEXT.md"
  },
  @{
    Id   = 2
    Name = "Hub cover offset, hero controls, Connect toast, About description UX"
    Commits = @("8d6564c") # bug fix batch 3
    Notes = "Touches HubClient lightly; resolve conflicts keeping YOUR composer/feed sections."
  },
  @{
    Id   = 3
    Name = "Invites, join page, idle timeout, AuthGuard, profile search, deps"
    Commits = @("a68c66f") # bug fix final batch
    Notes = "Adds qrcode.react path; run npm install in apps/web after stage commit if needed."
  },
  @{
    Id   = 4
    Name = "Discover location + content tweaks"
    Commits = @("47cce96")
    Notes = "DiscoverPageContent + discover/location; merge with your top-bar work."
  },
  @{
    Id   = 5
    Name = "Navigation + hub notification wiring"
    Commits = @("0edb486", "1d1f3bb", "a05fc70")
    Notes = "udeets-navigation + small HubClient/useHubSectionState; preserve signed-in logo / home behavior."
  },
  @{
    Id   = 6
    Name = "Profile modal stack (layout, dashboard touches)"
    Commits = @("2b04037", "2f17c11", "34d1c4b")
    Notes = "Touches DeetsSection/MembersSection/dashboard; keep YOUR post/feed behavior when resolving."
  },
  @{
    Id   = 7
    Name = "Local page + nav + join page refinements"
    Commits = @("62ba788", "62bcb89")
    Notes = "Touches HubClient + CreateDeetModal + join; review post modal diffs carefully."
  },
  @{
    Id   = 8
    Name = "DEFERRED: do not cherry-pick as-is (post overlap with offshoot)"
    Commits = @()
    Notes = @"
Commits intentionally NOT in this script (resolve manually or take file-level patches from origin/main):

  - 62c8682 profile updates: mixes geo APIs, profile, HubClient, composer, list-deets, migrations.
  - f058914 bug fixes: mostly deets/composer/interactions.
  - 09bcc90 buf fix second batch: HubClient, DeetsSection, CreateDeetModal, poll-votes, attachments migrations.

  - 8fbdd34 posts section: REMOVES DeetComposerCard lines on main; SKIP entirely (would fight your branch).

If you still need a file from those commits (e.g. a migration), use:
  git show origin/main:path/to/file > tmp.patch   # or
  git checkout origin/main -- path/to/file         # then merge by hand
"@
  }
)

function Run-Git {
  param([string[]] $GitArguments)
  if ($DryRun) {
    Write-Host ("RUN: git " + ($GitArguments -join " ")) -ForegroundColor Cyan
    return
  }
  & git @GitArguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($GitArguments -join ' ') failed (exit $LASTEXITCODE)"
  }
}

if ($List -or $Stage -eq 0) {
  Write-Host "`nStaged cherry-pick plan (origin/main -> current branch)`n" -ForegroundColor Green
  foreach ($s in $Stages) {
    if ($s.Id -eq 8) {
      Write-Host "--- Stage $($s.Id): $($s.Name) ---" -ForegroundColor Yellow
      Write-Host $s.Notes
      continue
    }
    $c = $s.Commits -join ", "
    Write-Host "--- Stage $($s.Id): $($s.Name) ---" -ForegroundColor Green
    Write-Host "  Commits: $c"
    Write-Host "  $($s.Notes)"
  }
  Write-Host "`nUsage: ./scripts/cherry-pick-origin-main-staged.ps1 -Stage <1-7>`n" -ForegroundColor Green
  Write-Host "Each stage runs: git fetch origin; git cherry-pick -n <commits...>" -ForegroundColor Gray
  Write-Host 'Then: run app/tests, git status, git commit -m "chore(main-port): stage N ..."' -ForegroundColor Gray
  Write-Host "If a cherry-pick fails: fix conflicts, git add -A, git cherry-pick --continue (or --abort)`n" -ForegroundColor Gray
  exit 0
}

$target = $Stages | Where-Object { $_.Id -eq $Stage } | Select-Object -First 1
if (-not $target -or $target.Id -eq 8) {
  Write-Error "Stage $Stage is not an applicable cherry-pick stage (use 1-7). Use -List for stage 8 / deferred notes."
}

$commits = $target.Commits
if ($commits.Count -eq 0) {
  Write-Error "Stage $Stage has no commits to apply."
}

Write-Host "`n=== Stage $($target.Id): $($target.Name) ===" -ForegroundColor Green
Write-Host "Commits: $($commits -join ' ')`n"

Run-Git @("fetch", "origin")

foreach ($c in $commits) {
  Write-Host "Cherry-picking (no commit) $c ..." -ForegroundColor Cyan
  Run-Git @("cherry-pick", "-n", $c)
}

Write-Host "`nDone. Index has changes but no commit yet." -ForegroundColor Green
Write-Host "1. Run: npm run dev:web (from repo root or apps/web per your setup)" -ForegroundColor Yellow
Write-Host "2. Fix any issues; git add / restore as needed" -ForegroundColor Yellow
Write-Host "3. Commit when ready, e.g.:" -ForegroundColor Yellow
Write-Host ('   git commit -m "chore(main-port): stage ' + $Stage + ' ' + $target.Name + '"') -ForegroundColor White
Write-Host "`nNext: ./scripts/cherry-pick-origin-main-staged.ps1 -Stage $($Stage + 1)   (after committing)`n" -ForegroundColor Gray
