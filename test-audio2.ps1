$r = Invoke-RestMethod -Uri 'http://localhost:3000/api/audio/5/1'
Write-Host "Audio files count: $($r.audio_files.Count)"
if ($r.audio_files.Count -gt 0) {
    Write-Host "First audio file:"
    $r.audio_files[0] | ConvertTo-Json
}