Add-Type -AssemblyName System.Drawing

function New-DengeIcon([int]$size, [string]$path) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::FromArgb(36, 28, 47))
    $violet = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(134, 81, 214))
    $light = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(201, 164, 255))
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $line = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(245, 239, 255), [Math]::Max(4, $size / 42))
    $graphics.FillEllipse($light, $size * .41, $size * .16, $size * .18, $size * .18)
    $points = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new($size * .50, $size * .36), [System.Drawing.PointF]::new($size * .32, $size * .56),
        [System.Drawing.PointF]::new($size * .42, $size * .56), [System.Drawing.PointF]::new($size * .30, $size * .78),
        [System.Drawing.PointF]::new($size * .50, $size * .66), [System.Drawing.PointF]::new($size * .70, $size * .78),
        [System.Drawing.PointF]::new($size * .58, $size * .56), [System.Drawing.PointF]::new($size * .68, $size * .56)
    )
    $graphics.FillPolygon($violet, $points)
    $graphics.DrawLine($line, $size * .20, $size * .64, $size * .80, $size * .64)
    if ($size -ge 192) {
        $font = [System.Drawing.Font]::new('Arial', $size * .10, [System.Drawing.FontStyle]::Bold)
        $format = [System.Drawing.StringFormat]::new(); $format.Alignment = [System.Drawing.StringAlignment]::Center
        $graphics.DrawString('DENGE', $font, $white, $size / 2, $size * .84, $format)
        $font.Dispose(); $format.Dispose()
    }
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $line.Dispose(); $violet.Dispose(); $light.Dispose(); $white.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

$iconDirectory = Join-Path $PSScriptRoot '..\public\icons'
New-DengeIcon 180 (Join-Path $iconDirectory 'apple-touch-icon.png')
New-DengeIcon 192 (Join-Path $iconDirectory 'icon-192.png')
New-DengeIcon 512 (Join-Path $iconDirectory 'icon-512.png')
