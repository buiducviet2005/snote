try {
    $word = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
    Write-Host "Word application found!"
    for ($i = 1; $i -le $word.Documents.Count; $i++) {
        $d = $word.Documents.Item($i)
        $name = $d.FullName
        Write-Host "Document $i : $name"
    }
} catch {
    Write-Host "Error: $_"
}
