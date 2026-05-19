$r = Invoke-RestMethod -Uri 'http://localhost:3000/api/verses?verse_keys=51:56,2:30,67:2&translation=203&reciter=5'
Write-Host "Verses count: $($r.verses.Count)"
foreach ($v in $r.verses) {
    Write-Host "Verse: $($v.verseKey)"
    Write-Host "  Has audioUrl: $([bool]$v.audioUrl)"
    if ($v.audioUrl) {
        Write-Host "  audioUrl: $($v.audioUrl)"
    }
}