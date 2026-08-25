$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "  Adventure Party Local Server Running!         " -ForegroundColor Green
    Write-Host "  Open: http://localhost:$port in your browser  " -ForegroundColor Yellow
    Write-Host "=================================================" -ForegroundColor Cyan
    
    $repoDir = $PSScriptRoot
    if (-not $repoDir) { $repoDir = (Get-Location).Path }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ($localPath -eq "" -or $localPath -eq "/") { $localPath = "index.html" }
        $cleanPath = $localPath.Split('?')[0]
        $filePath = [System.IO.Path]::Combine($repoDir, $cleanPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
        
        if ([System.IO.File]::Exists($filePath)) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($filePath.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($filePath.EndsWith(".json")) { $response.ContentType = "application/json" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
