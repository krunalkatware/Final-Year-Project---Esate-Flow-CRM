import sys
sys.path.insert(0, '.')
from httpx import Client
from server.main import app

with Client(app=app, base_url='http://test') as c:
    r = c.post('/api/admin/auth/login', json={'email': 'admin@estateflow.com', 'password': 'Admin@123'})
    print("Login:", r.status_code)
    token = r.json().get('access_token', '')
    headers = {'Authorization': f'Bearer {token}'}
    
    r2 = c.get('/api/admin/dashboard/charts', headers=headers)
    print('charts status:', r2.status_code)
    if r2.status_code != 200:
        print('charts error:', r2.text[:500])
    
    r3 = c.get('/api/admin/dashboard/summary', headers=headers)
    print('summary status:', r3.status_code)
    if r3.status_code != 200:
        print('summary error:', r3.text[:500])
