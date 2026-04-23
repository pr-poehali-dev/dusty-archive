"""Авторизация: вход, выход, получение текущего пользователя, управление пользователями (только для admin)"""
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_session(cur, session_id: str):
    if not session_id:
        return None
    cur.execute("""
        SELECT u.id, u.username, u.full_name, u.role, u.is_active
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = %s AND s.expires_at > NOW() AND u.is_active = TRUE
    """, (session_id,))
    return cur.fetchone()

def resp(status, data, extra_headers=None):
    headers = {**CORS_HEADERS}
    if extra_headers:
        headers.update(extra_headers)
    return {'statusCode': status, 'headers': headers, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or params.get('session_id', '')
    action = params.get('action', '')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # POST /login
        if method == 'POST' and action == 'login':
            username = body.get('username', '').strip()
            password = body.get('password', '')
            pw_hash = hash_password(password)

            cur.execute("SELECT * FROM users WHERE username = %s AND is_active = TRUE", (username,))
            user = cur.fetchone()

            if not user:
                return resp(401, {'error': 'Неверный логин или пароль'})

            stored = user['password_hash']
            # Поддержка обоих форматов: sha256 и bcrypt (старый дефолтный)
            if stored.startswith('$2b$') or stored.startswith('$2a$'):
                try:
                    import bcrypt
                    ok = bcrypt.checkpw(password.encode(), stored.encode())
                except Exception:
                    ok = False
            else:
                ok = (stored == pw_hash)

            if not ok:
                return resp(401, {'error': 'Неверный логин или пароль'})

            sid = secrets.token_hex(32)
            expires = datetime.now() + timedelta(days=7)
            cur.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (sid, user['id'], expires))
            conn.commit()
            return resp(200, {
                'session_id': sid,
                'user': {'id': user['id'], 'username': user['username'], 'full_name': user['full_name'], 'role': user['role']}
            })

        # POST /logout
        if method == 'POST' and action == 'logout':
            if session_id:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            return resp(200, {'ok': True})

        # GET /me
        if method == 'GET' and action == 'me':
            user = get_user_by_session(cur, session_id)
            if not user:
                return resp(401, {'error': 'Не авторизован'})
            return resp(200, {'user': dict(user)})

        # === Управление пользователями (только admin) ===
        user = get_user_by_session(cur, session_id)

        # GET /users
        if method == 'GET' and action == 'users':
            if not user or user['role'] != 'admin':
                return resp(403, {'error': 'Нет доступа'})
            cur.execute("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at")
            users = [dict(r) for r in cur.fetchall()]
            return resp(200, {'users': users})

        # POST /users — создать пользователя
        if method == 'POST' and action == 'create_user':
            if not user or user['role'] != 'admin':
                return resp(403, {'error': 'Нет доступа'})
            uname = body.get('username', '').strip()
            pw = body.get('password', '')
            full_name = body.get('full_name', '').strip()
            role = body.get('role', 'viewer')
            if not uname or not pw:
                return resp(400, {'error': 'Укажите логин и пароль'})
            if role not in ('admin', 'editor', 'viewer'):
                return resp(400, {'error': 'Неверная роль'})
            pw_hash = hash_password(pw)
            cur.execute(
                "INSERT INTO users (username, password_hash, full_name, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (uname, pw_hash, full_name, role)
            )
            conn.commit()
            new_id = cur.fetchone()['id']
            return resp(201, {'id': new_id})

        # PUT /users — обновить пользователя
        if method == 'PUT' and action == 'update_user':
            if not user or user['role'] != 'admin':
                return resp(403, {'error': 'Нет доступа'})
            uid = params.get('id')
            updates = []
            values = []
            if 'full_name' in body:
                updates.append("full_name = %s"); values.append(body['full_name'])
            if 'role' in body:
                if body['role'] not in ('admin', 'editor', 'viewer'):
                    return resp(400, {'error': 'Неверная роль'})
                updates.append("role = %s"); values.append(body['role'])
            if 'is_active' in body:
                updates.append("is_active = %s"); values.append(body['is_active'])
            if 'password' in body and body['password']:
                updates.append("password_hash = %s"); values.append(hash_password(body['password']))
            if not updates:
                return resp(400, {'error': 'Нет данных для обновления'})
            values.append(uid)
            cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", values)
            conn.commit()
            return resp(200, {'ok': True})

    finally:
        cur.close()
        conn.close()

    return resp(405, {'error': 'Метод не поддерживается'})
