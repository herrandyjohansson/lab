Clear-Host
. "$PSScriptRoot/stoopid.ps1"

$file = Get-ChildItem -Path "/Users/andyj/learn" -Recurse | Where-Object { $_.Name -like "*svt*" }

foreach ($f in $file) {
    Write-Host $f.FullName
}

if ($file) { 
    Write-Host "File found" 
}
else {
    Write-Host "File not found"
}

$personObjects = @(
    New-Person -Name "Andy" -Age 30 -City "Stockholm" -Occupation "Developer"
    New-Person -Name "Örjan" -Age 35 -City "Göteborg" -Occupation "Designer"
    New-Person -Name "Nisse" -Age 28 -City "Malmö" -Occupation "Manager"
)

# $sorted = $persons | Sort-Object -Property Name
# $sorted | ForEach-Object {
#     "$($_.Name) - $($_.Age) - $($_.City) - $($_.Occupation)"
# }

Format-Object-Pretty -Object $personObjects

# Test a API call
Get-Https-Response -Url "https://api.github.com/users/herrandyjohansson"

#Find-Files -Path "/Users/andyj/Downloads" -Name "stonk"
#Find-Folders -Path "/Users/andyj/axis-repos" -Name "node_modules"
#Find-Folders -Path "/Users/andyj/axis-repos/github" -Name "node_modules"