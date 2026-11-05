"""Move MP4 indexes without re-encoding; verify copied stream SHA-256 before replacement."""
import pathlib
import struct
import subprocess
import sys
ffmpeg = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
root = pathlib.Path(__file__).resolve().parents[1]
def atoms(path):
    result = []
    with path.open('rb') as f:
        while header := f.read(8):
            size, kind = struct.unpack('>I4s', header)
            if size < 8:
                raise ValueError('Unsupported MP4 atom size')
            result.append(kind)
            f.seek(size - 8, 1)
    return result
def fingerprint(path):
    return subprocess.check_output([ffmpeg, '-v', 'error', '-i', str(path), '-map', '0', '-c', 'copy', '-f', 'streamhash', '-hash', 'sha256', '-'])
for path in sorted((root / 'media').glob('clip-*.mp4')):
    order = atoms(path)
    if order.index(b'moov') < order.index(b'mdat'):
        print(path.name, 'already faststart; unchanged')
        continue
    before = fingerprint(path)
    temp = path.with_suffix('.faststart.mp4')
    try:
        subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(path), '-map', '0', '-c', 'copy', '-movflags', '+faststart', str(temp)], check=True)
        assert fingerprint(temp) == before, 'Stream data changed'
        order = atoms(temp)
        assert order.index(b'moov') < order.index(b'mdat')
        temp.replace(path)
        print(path.name, 'index moved; all stream SHA-256 hashes identical')
    finally:
        temp.unlink(missing_ok=True)
