#Import-Module oh-my-posh
oh-my-posh init pwsh --config ~/Posh/night-owl.omp.json | Invoke-Expression
#oh-my-posh init pwsh --config "jandedobbeleer" | Invoke-Expression
#Write-Host "Cursor -a $ PROFILE"

function y {
    $tmp = (New-TemporaryFile).FullName
    yazi $args --cwd-file="$tmp"
    $cwd = Get-Content -Path $tmp -Encoding UTF8
    if (-not [String]::IsNullOrEmpty($cwd) -and $cwd -ne $PWD.Path) {
        Set-Location -LiteralPath (Resolve-Path -LiteralPath $cwd).Path
    }
    Remove-Item -Path $tmp
}

Import-Module PnP.PowerShell -ErrorAction SilentlyContinue
Import-Module Az -ErrorAction SilentlyContinue

# Aliases for SharePoint / PnP
Set-Alias spConnect Connect-PnPOnline
Set-Alias spSite Get-PnPSite

# Helper: Quick connect with client ID
function Connect-SP {
    param(
        [string]$SiteUrl,
        [string]$ClientId
    )
    Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive
}

# New LS handler called LSD (brew install lsd)
function ls { lsd -1 $args }

# CD to offering-portal-api
function cdop {
    Set-Location -Path ~/axis-repos/m365-offering-portal/backend/OfferingPortal.Api
}
function cdr {
    Set-Location -Path ~/axis-repos/github
}

Set-Alias python python3
Set-Alias py python3