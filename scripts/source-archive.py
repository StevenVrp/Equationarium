"""Create the downloadable static release, documentation and regression sources."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
archive = root / 'dist' / 'equationarium-source.zip'
paths = [root / 'README.md', root / 'package.json']
for dirname in ('dist', 'scripts', 'tests'):
    paths.extend(sorted((root / dirname).rglob('*')))
with ZipFile(archive, 'w', ZIP_DEFLATED) as output:
    for path in paths:
        if path.is_file() and path != archive and '__pycache__' not in path.parts:
            output.write(path, Path('equationarium') / path.relative_to(root))
