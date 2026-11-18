# Collects real figures for the Pi OLED. No model, no secrets in the output, no
# placeholder values: a tile that cannot be read is written with ok=false and no
# numbers, and the Pi skips it.
#   pc.json      this PC's free space and CPU, memory, disk I/O, GPU use. Every run.
#   status.json  AiEDs totals and, with -GitHubOrg, GitHub Actions cost. At most every -SlowMinutes.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File collect.ps1 [-Force]
#     [-Push -PiHost user@pi-address] [-KeyFile path] [-GitHubOrg org] [-AiedsLocal path\aieds-local.mjs]
# Without -AiedsLocal the AiEDs tile reads the public totals file.
# -GitHubOrg needs `gh` signed in as an org admin who can read billing.
param(
  [switch]$Push,
  [switch]$Force,
  [string]$PiHost,
  [string]$KeyFile = "$env:USERPROFILE\.ssh\rk_pi_oled",
  [int]$SlowMinutes = 15,
  [string]$GitHubOrg,
  [string]$AiedsLocal
)
$ErrorActionPreference = 'Stop'
if ($Push -and -not $PiHost) { Write-Error '-Push needs -PiHost user@pi-address'; exit 2 }
$org = $GitHubOrg
$now = (Get-Date).ToUniversalTime()
$iso = { param($d) $d.ToString('yyyy-MM-ddTHH:mm:ssZ') }
$statusFile = Join-Path $PSScriptRoot 'status.json'
$pcFile = Join-Path $PSScriptRoot 'pc.json'

function Invoke-Gh([string[]]$GhArgs) {
  $o = & gh @GhArgs 2>$null
  if ($LASTEXITCODE -ne 0) { throw "gh failed: $($GhArgs -join ' ')" }
  return ($o -join "`n")
}
function Tile([string]$Source, [scriptblock]$Read) {
  try {
    $v = & $Read
    $v['ok'] = $true; $v['source'] = $Source
    if (-not $v.ContainsKey('asOf')) { $v['asOf'] = (& $iso $now) }
    return $v
  } catch {
    $m = "$($_.Exception.Message)"
    return @{ ok = $false; source = $Source; asOf = (& $iso $now); error = $m.Substring(0, [Math]::Min(160, $m.Length)) }
  }
}
function Save([string]$Path, $Doc) {
  $tmp = "$Path.tmp"
  [IO.File]::WriteAllText($tmp, ($Doc | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false)))
  Move-Item -Force $tmp $Path
}
function Send([string]$Path) {
  # One connection, byte-exact, atomic on the Pi.
  $name = Split-Path $Path -Leaf
  cmd /c "ssh -i `"$KeyFile`" -o BatchMode=yes -o ConnectTimeout=10 $PiHost `"cat > rk/$name.tmp && mv rk/$name.tmp rk/$name`" < `"$Path`""
  if ($LASTEXITCODE -ne 0) { throw "push of $name failed" }
}

# ---- fast: this PC
$pc = Tile 'Windows performance counters, 2 s sample' {
  $s = (Get-Counter -Counter '\Processor(_Total)\% Processor Time', '\PhysicalDisk(_Total)\% Idle Time', '\GPU Engine(*engtype_3D)\Utilization Percentage' -SampleInterval 1 -MaxSamples 2).CounterSamples
  $avg = { param($like) (($s | Where-Object Path -like $like).CookedValue | Measure-Object -Average).Average }
  $gpu = (($s | Where-Object Path -like '*gpu engine*').CookedValue | Measure-Object -Sum).Sum / 2
  $os = Get-CimInstance Win32_OperatingSystem
  $free = [ordered]@{}
  Get-Volume | Where-Object { $_.DriveLetter -and $_.DriveType -eq 'Fixed' } | Sort-Object DriveLetter | ForEach-Object { $free["$($_.DriveLetter)"] = [int][math]::Floor($_.SizeRemaining / 1GB) }
  $clamp = { param($x) [int][math]::Max(0, [math]::Min(100, [math]::Round($x))) }
  @{ freeGb = $free; cpuPct = (& $clamp (& $avg '*processor time')); ioPct = (& $clamp (100 - (& $avg '*idle time')))
     gpuPct = (& $clamp $gpu); memPct = (& $clamp (100 * (1 - $os.FreePhysicalMemory / $os.TotalVisibleMemorySize))) }
}
Save $pcFile ([ordered]@{ schema = 1; generatedAt = (& $iso $now); pc = $pc })

# ---- slow: AiEDs totals and Actions cost
$slowDue = $Force -or -not (Test-Path $statusFile) -or ((Get-Date) - (Get-Item $statusFile).LastWriteTime).TotalMinutes -ge ($SlowMinutes - 0.5)
if ($slowDue) {
  $tiles = [ordered]@{}
  # AiEDs: computed fresh from this laptop's ledgers (aieds-local.mjs). The public
  # file is the fallback, because it only changes when the publish is rerun by hand.
  $pick = { param($x) if (-not $x -or -not "$($x.value)") { throw 'display field missing' }; @{ value = "$($x.value)"; unit = "$($x.unit)" } }
  $shape = { param($c, $asOf, $method)
    $w = & $pick $c.water; $w['low'] = "$($c.water.low)"; $w['high'] = "$($c.water.high)"
    if (-not $w['low'] -or -not $w['high']) { throw 'water range missing' }
    @{ asOf = "$asOf"; methodology = "$method"; tokens = (& $pick $c.tokens); energy = (& $pick $c.energy)
       carbon = (& $pick $c.carbon); treeTime = (& $pick $c.treeTime); water = $w } }
  if ($AiedsLocal) {
    $tiles.aieds = Tile 'laptop AiEDs ledgers (aieds-local.mjs)' {
      $raw = & node $AiedsLocal 2>$null
      if ($LASTEXITCODE -ne 0 -or -not $raw) { throw 'aieds-local.mjs failed' }
      $c = ($raw -join '') | ConvertFrom-Json
      & $shape $c $c.asOf $c.methodology
    }
  }
  if (-not $tiles.aieds -or -not $tiles.aieds.ok) {
    $tiles.aieds = Tile 'aieds-totals.json (public file)' {
      $t = Invoke-RestMethod 'https://storage.googleapis.com/randomknights-xyz.firebasestorage.app/aieds/aieds-totals.json' -TimeoutSec 30
      & $shape $t.display.company $t.asOf $t.methodology.version
    }
  }
  if ($org) { $tiles.actionsCost = Tile 'gh org billing usage, month to date' {
    $u = (Invoke-Gh @('api', "organizations/$org/settings/billing/usage?year=$($now.Year)&month=$($now.Month)")) | ConvertFrom-Json
    $items = @($u.usageItems | Where-Object { $_.product -eq 'actions' })
    if (-not $items.Count) { throw 'no actions usage items' }
    $mins = @($items | Where-Object { $_.unitType -eq 'Minutes' })
    $daily = @(0) * $now.Day
    foreach ($i in $mins) { $d = ([datetime]$i.date).ToUniversalTime().Day; if ($d -le $daily.Count) { $daily[$d - 1] += $i.quantity } }
    $latest = ($items | Sort-Object date | Select-Object -Last 1).date
    @{ asOf = (& $iso ([datetime]$latest).ToUniversalTime()); month = $now.ToString('yyyy-MM'); minutes = [int][math]::Round(($mins | Measure-Object quantity -Sum).Sum)
       netUsd = [math]::Round(($items | Measure-Object netAmount -Sum).Sum, 2); dailyMinutes = @($daily | ForEach-Object { [int][math]::Round($_) }) }
  } }
  Save $statusFile ([ordered]@{ schema = 2; generatedAt = (& $iso $now); tiles = $tiles })
}

if ($Push) {
  try { Send $pcFile; if ($slowDue) { Send $statusFile } } catch { Write-Error "$_"; exit 2 }
}
