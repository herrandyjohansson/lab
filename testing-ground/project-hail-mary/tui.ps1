# Project Hail Mary TUI - PowerShell
# Usage: ./tui.ps1  or  pwsh -File tui.ps1
# Optional: ./tui.ps1 -Refresh 15  (refresh every 15 seconds)

param(
    [int]$Refresh = 30
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Ensure rich is installed
$py = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }
& $py -m pip install rich -q 2>$null

# Run TUI
& $py check.py --tui --refresh $Refresh
