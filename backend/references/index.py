"""API для управления справочниками: исполнители, конкуренты, типы продукции"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

TABLES = {
    'executors': ('full_name', 'executors'),
    'competitors': ('name', 'competitors'),
    'product_types': ('name', 'product_types'),
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    ref = params.get('ref', 'executors')

    if ref not in TABLES:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unknown ref'})}

    field, table = TABLES[ref]
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            cur.execute(f"SELECT * FROM {table} ORDER BY {field}")
            rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(rows, ensure_ascii=False, default=str)}

        elif method == 'POST':
            value = body.get(field)
            cur.execute(f"INSERT INTO {table} ({field}) VALUES (%s) RETURNING *", (value,))
            conn.commit()
            row = dict(cur.fetchone())
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps(row, ensure_ascii=False)}

        elif method == 'PUT':
            rid = params.get('id')
            value = body.get(field)
            cur.execute(f"UPDATE {table} SET {field}=%s WHERE id=%s RETURNING *", (value, rid))
            conn.commit()
            row = dict(cur.fetchone())
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(row, ensure_ascii=False)}

        elif method == 'DELETE':
            rid = params.get('id')
            cur.execute(f"DELETE FROM {table} WHERE id=%s", (rid,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
