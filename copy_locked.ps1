$inPath = "c:\Users\ducvi\OneDrive\Desktop\snote\SNOTE.docx"
$outPath = "c:\Users\ducvi\OneDrive\Desktop\snote\SNOTE_temp_read.docx"
try {
    $stream = [System.IO.File]::Open($inPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $outStream = [System.IO.File]::Create($outPath)
    $stream.CopyTo($outStream)
    $stream.Close()
    $outStream.Close()
    Write-Host "Copied successfully! Size:" (Get-Item $outPath).Length
} catch {
    Write-Host "Error copying: $_"
}
