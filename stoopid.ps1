function Test-Stoopid {
    return "yes"
}

function New-Person {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        
        [Parameter(Mandatory = $true)]
        [int]$Age,
        
        [Parameter(Mandatory = $true)]
        [string]$City,
        
        [Parameter(Mandatory = $true)]
        [string]$Occupation
    )
    
    [PSCustomObject]@{
        Name       = $Name
        Age        = $Age
        City       = $City
        Occupation = $Occupation
    }
}

function Find-Files() {
    param( 
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Name
    )


    Get-ChildItem -Path $Path -Recurse | Where-Object { $_.Name -like "*$Name*" } | ForEach-Object {
        Write-Host "$($_.Name)"
    }
}

function Find-Folders {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    # Only get directories, not files
    # Get top-level directories (repos), then search one level deep for the folder
    $topLevelDirs = Get-ChildItem -Path $Path -Directory -ErrorAction SilentlyContinue
    $folders = @()
    
    foreach ($dir in $topLevelDirs) {
        $found = Get-ChildItem -Path $dir.FullName -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq $Name }
        if ($found) {
            $folders += $found
        }
    }
    if ($folders.Count -eq 0) {
        Write-Host "No folders named '$Name' found in $Path."
    }
    else {
        Write-Host "Found $($folders.Count) folder(s) named '$Name' in $Path"
        $folders | ForEach-Object {
            $sizeMB = Get-Size-Of-Folder -Path $_.FullName
            Write-Host "  $($_.FullName) Size: $sizeMB MB"
        }
    }
}

function Get-Size-Of-Folder {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2)
    return $sizeMB
}

function Get-Https-Response {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $response = Invoke-RestMethod -Uri $Url
    Write-Host $response.full_name
}

function Format-Object-Pretty {
    param(
        [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
        [object[]]$Object
    )

    $Object | ForEach-Object {
        Write-Host "$($_.Name) - $($_.Age) - $($_.City) - $($_.Occupation)"
    }
}