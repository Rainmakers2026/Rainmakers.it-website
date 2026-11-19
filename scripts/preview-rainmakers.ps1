<#
.SYNOPSIS
  preview-rainmakers: commit -> push to GitHub (branch preview/rainmakers) -> Vercel PREVIEW deploy. Never production.

.DESCRIPTION
  Every step is checked and the script stops at the first inconsistency:
    1. Git top-level folder and `origin` = Rainmakers2026/Rainmakers.it-website (GitHub repository id 1407333087)
    2. Local Git identity = Rainmakers2026 <email in $env:RAINMAKERS_GIT_EMAIL> (read only: credentials never changed)
    3. .vercel/project.json = project prj_5uJR8Lq9RhhNYf41lHJ5eDroe5lg, team team_uil1PIU0oTpaorKXwLJJyQCD (rainmakers3);
       VERCEL_ORG_ID / VERCEL_PROJECT_ID / VERCEL_TOKEN in the environment must not point elsewhere
    4. Vercel CLI logged in, member of the expected team
    5. Dedicated branch preview/rainmakers (never main); an existing branch is only entered with a clean tree
    6. Commit only of the files you choose; sensitive files (.env, keys, certificates, .vercel) and secret-looking
       content block the commit
    7. Summary (repository, branch, files, message) and explicit confirmation before commit/push/deploy
    8. Push only to refs/heads/preview/rainmakers; `vercel deploy` WITHOUT --prod, target checked to be "preview"
    9. Afterwards: preview URL reachable without authentication, remote main and production deployment unchanged

  The expected commit e-mail is not stored in this file: set it once per session, e.g.
    $env:RAINMAKERS_GIT_EMAIL = '<the team address>'

.PARAMETER Message
  Commit message (required when there is something to commit).

.PARAMETER Paths
  Files/folders to include in the commit. Default: every changed file (sensitive files are always refused).

.PARAMETER DryRun
  Runs all checks and shows the summary, then stops: no commit, no push, no deploy.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\preview-rainmakers.ps1 -Message "Giveback popups" -Paths content\it\what.ts,content\en\what.ts
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\preview-rainmakers.ps1 -DryRun
#>
[CmdletBinding()]
param(
  [string]$Message,
  [string[]]$Paths,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2

# ---- Expected values (do not edit unless the project really moves) ------------------------------------------------
$ExpectedRepo      = 'Rainmakers2026/Rainmakers.it-website'
$ExpectedRepoId    = 1407333087
$ExpectedProjectId = 'prj_5uJR8Lq9RhhNYf41lHJ5eDroe5lg'
$ExpectedOrgId     = 'team_uil1PIU0oTpaorKXwLJJyQCD'
$ExpectedTeamSlug  = 'rainmakers3'
$ExpectedGitName   = 'Rainmakers2026'
# this terminal first, then the value saved for the Windows user (setx), which VS Code terminals only see after a restart
$ExpectedGitEmail  = $env:RAINMAKERS_GIT_EMAIL
if (-not $ExpectedGitEmail) { $ExpectedGitEmail = [Environment]::GetEnvironmentVariable('RAINMAKERS_GIT_EMAIL', 'User') }
$PreviewBranch     = 'preview/rainmakers'
$ProtectedBranches = @('main', 'master', 'production')

# Files that must never be committed, and content that looks like a secret
$SensitivePath = '(^|/)(\.env($|\.)|\.vercel/|\.ssh/|id_(rsa|ed25519|ecdsa)|.*\.(pem|key|p12|pfx|keystore)$|.*secret.*|.*credential.*|\.npmrc$)'
$SecretContent = 'BEGIN [A-Z ]*PRIVATE KEY|xkeysib-[0-9a-f]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{30,}|AKIA[0-9A-Z]{16}|"role"\s*:\s*"service_role"|(SUPABASE_SERVICE_ROLE_KEY|BREVO_API_KEY|AIRTABLE_API_KEY|CRON_SECRET|NEWSLETTER_LINK_SECRET|VERCEL_TOKEN)\s*=\s*\S{8,}'

# ---- Helpers ------------------------------------------------------------------------------------------------------
function Fail([string]$why) {
  Write-Host ''
  Write-Host "STOP: $why" -ForegroundColor Red
  Write-Host 'Nothing else was done after this point.' -ForegroundColor Red
  exit 1
}
function Ok([string]$what) { Write-Host "  OK  $what" -ForegroundColor Green }
function Step([string]$what) { Write-Host ''; Write-Host "== $what" -ForegroundColor Cyan }
# Windows PowerShell 5.1 turns any stderr line of a native tool into an error under 'Stop' (git and the Vercel CLI
# write progress there), so native calls run with 'Continue' and are judged by their exit code only.
$VercelExe = (Get-Command vercel.cmd -ErrorAction SilentlyContinue).Source
if (-not $VercelExe) { $VercelExe = 'vercel' }
function Native([string]$exe, [string[]]$argv, [switch]$MergeStderr) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    if ($MergeStderr) { $out = & $exe @argv 2>&1 | ForEach-Object { "$_" } } else { $out = & $exe @argv 2>$null }
  } finally { $ErrorActionPreference = $prev }
  return $out
}
function RunGit {
  $out = Native 'git' $args
  if ($LASTEXITCODE -ne 0) { Fail "git $($args -join ' ') failed (exit $LASTEXITCODE)" }
  return $out
}
function RunVercel {
  $out = Native $VercelExe $args
  if ($LASTEXITCODE -ne 0) { Fail "vercel $($args -join ' ') failed (exit $LASTEXITCODE)" }
  return $out
}
function RemoteSha([string]$branch) {
  $line = Native "git" @("ls-remote", "--heads", "origin", $branch)
  if ($LASTEXITCODE -ne 0) { Fail "cannot read remote branch $branch" }
  if (-not $line) { return '(absent)' }
  return ($line -split '\s+')[0]
}
function ProdDeployment {
  $rows = RunVercel ls --environment production
  $first = $rows | Where-Object { $_ -match 'https://\S+\.vercel\.app' } | Select-Object -First 1
  if ($first -match '(https://\S+\.vercel\.app)') { return $Matches[1] }
  return '(none)'
}

# ---- 1. Repository ------------------------------------------------------------------------------------------------
Step '1. Repository'
foreach ($tool in 'git', 'vercel') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Fail "$tool is not installed or not on PATH" }
}
$top = (RunGit rev-parse --show-toplevel).Trim()
Set-Location $top
Ok "Git folder: $top"
$originUrl = (RunGit remote get-url origin).Trim()
$pattern = '^(https://github\.com/|git@github\.com:|ssh://git@github\.com/)' + [regex]::Escape($ExpectedRepo) + '(\.git)?/?$'
if ($originUrl -notmatch $pattern) { Fail "origin is '$originUrl', expected $ExpectedRepo" }
Ok "origin: $originUrl"
try {
  $repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$ExpectedRepo" -Headers @{ 'User-Agent' = 'git-preview-check' } -TimeoutSec 20
} catch { Fail "cannot read $ExpectedRepo from the GitHub API: $($_.Exception.Message)" }
if ($repo.id -ne $ExpectedRepoId) { Fail "GitHub repository id is $($repo.id), expected $ExpectedRepoId" }
Ok "GitHub repository id: $($repo.id)"

# ---- 2. Git identity (read only) ----------------------------------------------------------------------------------
Step '2. Git identity'
if (-not $ExpectedGitEmail) { Fail 'set the expected commit e-mail first: $env:RAINMAKERS_GIT_EMAIL = ''<address>''' }
$name = (& git config user.name); $email = (& git config user.email)
if ($name -ne $ExpectedGitName) { Fail "git user.name is '$name', expected '$ExpectedGitName' (for this repo only: git config user.name `"$ExpectedGitName`")" }
if ($email -ne $ExpectedGitEmail) { Fail "git user.email is '$email', expected the address in RAINMAKERS_GIT_EMAIL (for this repo only: git config user.email `"<address>`")" }
Ok "author: $name <$email>"
if ($originUrl -like 'git@*' -or $originUrl -like 'ssh://*') {
  $ssh = (Native "ssh" @("-o", "BatchMode=yes", "-T", "git@github.com") -MergeStderr | Out-String)
  if ($ssh -notmatch "Hi $ExpectedGitName!") { Fail "SSH key is not authenticated as $ExpectedGitName ($($ssh.Trim()))" }
  Ok "SSH authenticated as $ExpectedGitName"
} else {
  Write-Host '  --  origin uses HTTPS: the push uses the Windows credential manager (write access is checked by the push dry run)' -ForegroundColor Yellow
}

# ---- 3. Vercel link and environment -------------------------------------------------------------------------------
Step '3. Vercel project link'
$linkFile = Join-Path $top '.vercel\project.json'
if (-not (Test-Path $linkFile)) { Fail '.vercel/project.json missing: the folder is not linked to the Vercel project' }
$link = Get-Content $linkFile -Raw | ConvertFrom-Json
if ($link.projectId -ne $ExpectedProjectId) { Fail "linked project is $($link.projectId), expected $ExpectedProjectId" }
if ($link.orgId -ne $ExpectedOrgId) { Fail "linked team is $($link.orgId), expected $ExpectedOrgId" }
Ok "project $($link.projectId) ($($link.projectName)), team $($link.orgId)"
if ($env:VERCEL_PROJECT_ID -and $env:VERCEL_PROJECT_ID -ne $ExpectedProjectId) { Fail "VERCEL_PROJECT_ID in the environment points to $env:VERCEL_PROJECT_ID" }
if ($env:VERCEL_ORG_ID -and $env:VERCEL_ORG_ID -ne $ExpectedOrgId) { Fail "VERCEL_ORG_ID in the environment points to $env:VERCEL_ORG_ID" }
if ($env:VERCEL_TOKEN) { Fail 'VERCEL_TOKEN is set in the environment: it may belong to another account. Remove it and use the CLI login.' }
foreach ($f in Get-ChildItem -Path $top -Filter '.env*' -File -Force -ErrorAction SilentlyContinue) {
  $hit = Select-String -Path $f.FullName -Pattern '^\s*VERCEL_(ORG_ID|PROJECT_ID)\s*=\s*(\S+)' -ErrorAction SilentlyContinue
  foreach ($h in $hit) {
    $v = $h.Matches[0].Groups[2].Value.Trim('"', "'")
    if ($v -ne $ExpectedProjectId -and $v -ne $ExpectedOrgId) { Fail "$($f.Name) sets $($h.Matches[0].Groups[1].Value) to another project/team" }
  }
}
Ok 'no Vercel variables pointing to another project'

Step '4. Vercel account'
$who = (RunVercel whoami | Select-Object -Last 1).Trim()
if (-not $who) { Fail 'Vercel CLI not logged in (run: vercel login)' }
$teamsJson = (Native $VercelExe @("teams", "ls", "--format", "json")) -join "`n"
if ($LASTEXITCODE -ne 0) { Fail 'cannot list Vercel teams' }
$teams = ($teamsJson | ConvertFrom-Json).teams
$team = $teams | Where-Object { $_.id -eq $ExpectedOrgId }
if (-not $team) { Fail "Vercel account '$who' is not a member of team $ExpectedOrgId" }
if ($team.slug -ne $ExpectedTeamSlug) { Fail "team $ExpectedOrgId has slug '$($team.slug)', expected '$ExpectedTeamSlug'" }
Ok "Vercel account: $who, team $($team.slug) ($($team.id))"

# ---- Baseline for the final check ---------------------------------------------------------------------------------
$mainBefore = @{}
foreach ($b in $ProtectedBranches) { $mainBefore[$b] = RemoteSha $b }
$prodBefore = ProdDeployment
Ok "production deployment now: $prodBefore"

# ---- 5. Branch ----------------------------------------------------------------------------------------------------
Step '5. Branch'
$current = (RunGit rev-parse --abbrev-ref HEAD).Trim()
$dirty = @(RunGit status --porcelain)
if ($current -in $ProtectedBranches) {
  Write-Host "  --  you are on '$current': the work moves to $PreviewBranch, $current is never committed to" -ForegroundColor Yellow
}
if ($current -ne $PreviewBranch) {
  & git show-ref --verify --quiet "refs/heads/$PreviewBranch"
  $exists = ($LASTEXITCODE -eq 0)
  if ($exists -and $dirty.Count) {
    Fail "$PreviewBranch already exists and there are uncommitted changes on '$current': commit or stash them first, nothing was switched"
  }
  if ($DryRun) {
    Write-Host "  --  dry run: would $(if ($exists) { 'switch to' } else { 'create' }) $PreviewBranch from '$current'" -ForegroundColor Yellow
  } elseif ($exists) {
    RunGit switch $PreviewBranch | Out-Null
    Ok "switched to existing $PreviewBranch"
  } else {
    RunGit switch -c $PreviewBranch | Out-Null   # uncommitted changes come along unchanged
    Ok "created $PreviewBranch from '$current' (uncommitted changes carried over)"
  }
} else { Ok "on $PreviewBranch" }

# ---- 6. Files for the commit --------------------------------------------------------------------------------------
Step '6. Files'
$changed = @(RunGit status --porcelain --untracked-files=all | ForEach-Object { ($_.Substring(3) -replace '^.* -> ', '').Trim('"') -replace '\\', '/' })
if ($Paths) {
  $wanted = @($Paths | ForEach-Object { ($_ -replace '\\', '/').TrimEnd('/') })
  $files = @($changed | Where-Object { $f = $_; $wanted | Where-Object { $f -eq $_ -or $f.StartsWith("$_/") } })
  $missing = @($wanted | Where-Object { $w = $_; -not ($changed | Where-Object { $_ -eq $w -or $_.StartsWith("$w/") }) })
  if ($missing.Count) { Write-Host "  --  no changes in: $($missing -join ', ')" -ForegroundColor Yellow }
} else { $files = $changed }
$blocked = @($files | Where-Object { $_ -match $SensitivePath })
if ($blocked.Count) { Fail "sensitive files in the selection: $($blocked -join ', ')" }
foreach ($f in $files) {
  if ((Test-Path $f -PathType Leaf) -and ((Get-Item $f).Length -lt 5MB)) {
    $hit = Select-String -Path $f -Pattern $SecretContent -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($hit) { Fail "$f line $($hit.LineNumber) looks like a secret or key" }
  }
}
$unpushed = @()
& git rev-parse --verify --quiet "origin/$PreviewBranch" | Out-Null
$base = if ($LASTEXITCODE -eq 0) { "origin/$PreviewBranch" } else { $null }
if ($base) { $unpushed = @(RunGit log --oneline "$base..HEAD") }
if (-not $files.Count -and -not $base) { Write-Host '  --  nothing to commit: the current commit is pushed as is' -ForegroundColor Yellow }
elseif (-not $files.Count -and -not $unpushed.Count) { Write-Host '  --  nothing to commit and nothing new to push: only the preview is redeployed' -ForegroundColor Yellow }
if ($files.Count -and -not $Message -and -not $DryRun) { Fail 'there are files to commit: pass -Message "..."' }
Ok "$($files.Count) file(s) selected, secret scan clean"

# ---- 7. Summary and confirmation ----------------------------------------------------------------------------------
Step '7. Summary'
Write-Host "  Repository : $ExpectedRepo (id $ExpectedRepoId)"
Write-Host "  Branch     : $PreviewBranch  (push to origin, never main)"
Write-Host "  Author     : $name <$email>"
Write-Host "  Vercel     : $($team.slug) / $($link.projectName) ($ExpectedProjectId) - PREVIEW only"
Write-Host "  Message    : $(if ($files.Count) { $Message } else { '(no new commit)' })"
Write-Host '  Files      :'
if ($files.Count) { $files | ForEach-Object { Write-Host "    $_" } } else { Write-Host '    (none)' }
if ($unpushed.Count) { Write-Host '  Commits not yet on GitHub:'; $unpushed | ForEach-Object { Write-Host "    $_" } }
if ($DryRun) { Write-Host ''; Write-Host 'Dry run: stopping here, nothing committed, pushed or deployed.' -ForegroundColor Yellow; exit 0 }
Write-Host ''
$answer = Read-Host "Type YES to commit, push to $PreviewBranch and create the Vercel preview"
if ($answer -cne 'YES') { Fail 'not confirmed' }

# ---- 8. Commit, push, preview deploy ------------------------------------------------------------------------------
Step '8. Commit and push'
if ($files.Count) {
  RunGit add -- $files | Out-Null
  $staged = @(RunGit diff --cached --name-only | ForEach-Object { $_ -replace '\\', '/' })
  $extra = @($staged | Where-Object { $_ -notin $files })
  if ($extra.Count) { Fail "files staged before the script ran are not in the selection: $($extra -join ', ') (unstage them with git restore --staged)" }
  RunGit commit -m $Message | Out-Null
  Ok "commit $((RunGit rev-parse --short HEAD).Trim())"
}
if ((RunGit rev-parse --abbrev-ref HEAD).Trim() -ne $PreviewBranch) { Fail "not on $PreviewBranch any more" }
RunGit push --dry-run origin "HEAD:refs/heads/$PreviewBranch" | Out-Null
RunGit push -u origin "HEAD:refs/heads/$PreviewBranch" | Out-Null
Ok "pushed to origin/$PreviewBranch"

Step '9. Vercel preview'
$deployOut = Native $VercelExe @("deploy", "--yes", "--target", "preview")
if ($LASTEXITCODE -ne 0) { Fail 'vercel deploy failed (a deployment "Blocked" by Vercel means the commit author is not recognised by the team)' }
# Outside an interactive terminal the CLI answers in JSON ({ status, deployment: { url, readyState, target, ... } });
# in a terminal it prints the URL on its own line
$raw = ($deployOut -join "`n").Trim()
$url = $null
if ($raw.StartsWith('{')) {
  $res = $raw | ConvertFrom-Json
  if ($res.status -ne 'ok') { Fail "vercel deploy did not succeed: $raw" }
  if ($res.deployment.productionUrl -or $res.deployment.target -eq 'production') { Fail "deployment $($res.deployment.url) is a PRODUCTION deployment" }
  $url = $res.deployment.url
} else {
  $url = ($deployOut | Where-Object { $_ -match '^https://\S+\.vercel\.app' } | Select-Object -Last 1)
}
if (-not $url) { Fail "could not read the preview URL from: $raw" }
$url = "$url".Trim()
$inspect = (Native $VercelExe @("inspect", $url) -MergeStderr | Out-String)
if ($inspect -notmatch 'target\s+preview') { Fail "deployment $url is not a preview: check it in the Vercel dashboard" }
if ($inspect -notmatch 'Ready') { Fail "deployment $url is not Ready:`n$inspect" }
Ok "preview ready: $url"
try {
  # "/" redirects to "/it" (307): follow it; a protected deployment answers 401/403 or lands on the Vercel login
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 30 -ErrorAction Stop
  $final = "$($r.BaseResponse.ResponseUri)"
  $public = ($r.StatusCode -eq 200 -and $final -notmatch 'vercel\.com/(login|sso)')
} catch { $public = $false }

# ---- 10. Production and main untouched ----------------------------------------------------------------------------
Step '10. Production check'
foreach ($b in $ProtectedBranches) {
  $after = RemoteSha $b
  if ($after -ne $mainBefore[$b]) { Fail "remote branch $b changed ($($mainBefore[$b]) -> $after)" }
}
Ok "remote $($ProtectedBranches -join '/') unchanged"
$prodAfter = ProdDeployment
if ($prodAfter -ne $prodBefore) { Fail "production deployment changed ($prodBefore -> $prodAfter)" }
Ok "production deployment unchanged: $prodAfter"

Write-Host ''
Write-Host "Preview URL: $url" -ForegroundColor Green
if ($public) {
  Write-Host 'It opens without logging in (Vercel Deployment Protection is off for previews): share the link as is.' -ForegroundColor Green
} else {
  Write-Host 'It asks for a Vercel login (Deployment Protection is on). To share it, a team owner can create a "Shareable Link"' -ForegroundColor Yellow
  Write-Host 'from the deployment page in the Vercel dashboard (Share), without changing project or production settings.' -ForegroundColor Yellow
}
