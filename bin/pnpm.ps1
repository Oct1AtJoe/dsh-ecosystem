$node = 'C:\Users\Administrator\.local\bin\nodejs24\node.exe'
$pnpm = 'C:\Users\Administrator\AppData\Local\node\corepack\v1\pnpm\11.28.5\bin\pnpm.cjs'
& $node $pnpm $args
exit $LASTEXITCODE
