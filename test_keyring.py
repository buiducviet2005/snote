import sys
sys.path.insert(0, r'C:\Program Files\PostgreSQL\18\pgAdmin 4\web')
sys.path.insert(0, r'C:\Program Files\PostgreSQL\18\pgAdmin 4\python\Lib\site-packages')
import keyring
from pgadmin.utils.crypto import decrypt

try:
    key = keyring.get_password('pgadmin4', 'pgadmin4@pgadmin.org')
    print('KEYRING KEY:', key)
except Exception as e:
    print('KEYRING ERR:', e)
