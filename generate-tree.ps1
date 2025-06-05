# Run .\generate-tree.ps1 in powershell

function Show-Tree($Path, $Indent='', $ExcludePattern='node_modules|\.git|\.next') {
    $items = Get-ChildItem -Path $Path -Force | Where-Object { $_.FullName -notmatch $ExcludePattern }
    foreach ($item in $items) {
        $line = "$Indent$($item.Name)"
        $line
        if (Test-Path -Path $item.FullName -PathType Container) {
            Show-Tree -Path $item.FullName -Indent "    $Indent" -ExcludePattern $ExcludePattern
        }
    }
}

Show-Tree -Path . | Out-File -FilePath tree.txt