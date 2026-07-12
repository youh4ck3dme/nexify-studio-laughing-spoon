$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "data\demo"

New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item -Path (Join-Path $root "data\templates\rides.template.csv") -Destination (Join-Path $target "rides.csv") -Force
Copy-Item -Path (Join-Path $root "data\templates\leads.template.csv") -Destination (Join-Path $target "leads.csv") -Force

Write-Output "Demo data ready in $target"

