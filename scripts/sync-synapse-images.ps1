$src = "C:\Users\User\OneDrive\Desktop\Synapse"
$dst = "C:\Users\User\OneDrive\Desktop\hardware-supplies-app\hardware-supplies-app\apps\api\catalog-images"
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$pairs = @(
  @("p1", "PVC-Conduits 99mm.jpg", ""),
  @("p2", "19mm round box.jpg", ""),
  @("p3", "19mm pvc couplings.jpg", ""),
  @("p4", "NIPPLES20PVC.jpg", ""),
  @("p5", "3x6 flash boxes.jpg", ""),
  @("p6", "3x3 flash boxes.jpg", ""),
  @("p7", "24 way DB box", ".jpg"),
  @("p8", "25mm pvc conduit pipe", ".jpg"),
  @("p9", "25mm pvc nipples.jpg", ""),
  @("p10", "25mm pvc couplings", ".jpg"),
  @("p11", "1.5mm red cable single coll.jpg", ""),
  @("p13", "2.5mm red cable single coll.jpg", ""),
  @("p14", "2.5mm black cable.jpg", ""),
  @("p15", "2.5mm earth cable.png", ""),
  @("p16", "6mm red cable.png", ""),
  @("p17", "6mm black cable.png", ""),
  @("p18", "6mm earth cable.png", ""),
  @("p19", "13A double socket.jpg", ""),
  @("p20", "15A double socket.png", ""),
  @("p21", "Single Socket outlet.png", ""),
  @("p22", "Double waterproof socket.jpg", ""),
  @("p24", "2 gang 2 way switch.png", ""),
  @("p25", "3 gang 2 way switch.jpg", ""),
  @("p26", "cooker control unit.jpg", "")
)

foreach ($pair in $pairs) {
  $id = $pair[0]
  $name = $pair[1]
  $forceExt = $pair[2]
  $candidates = @(
    (Join-Path $src $name),
    (Join-Path $src "$name.jpg"),
    (Join-Path $src "$name.png")
  )
  $found = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $found) {
    Write-Host "MISSING: $id $name"
    continue
  }
  $ext = if ($forceExt) { $forceExt } elseif ([IO.Path]::GetExtension($found)) { [IO.Path]::GetExtension($found) } else { ".jpg" }
  $dest = Join-Path $dst "product_$id$ext"
  Copy-Item $found $dest -Force
  Write-Host "Copied: $dest"
}

Write-Host "Total:" (Get-ChildItem $dst -File).Count
