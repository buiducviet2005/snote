import sys
sys.path.insert(0, r'C:\Program Files\PostgreSQL\18\pgAdmin 4\web')
sys.path.insert(0, r'C:\Program Files\PostgreSQL\18\pgAdmin 4\python\Lib\site-packages')
from pgadmin.utils.crypto import decrypt
import base64

raw_hex = '3059527a7264696c4843377431595271636e394755613067477574786c773d3d'
b64_str = bytes.fromhex(raw_hex).decode('ascii')
print('b64_str:', b64_str)

keys = [
    '22052005',
    '-sha512.DR3FFUpbUK3cvlEuvzmb5VYbpRMXs8yVV.ChZUAxVUkEQgtz7/.5R9Odq4/MSKjGLdgYB5H7PGb8g',
    'pgadmin4@pgadmin.org',
    'postgres',
    'admin'
]

for k in keys:
    try:
        dec = decrypt(b64_str, k)
        print('KEY:', k[:15], '--> DECRYPTED:', dec)
    except Exception as e:
        print('KEY:', k[:15], '--> ERR:', e)
