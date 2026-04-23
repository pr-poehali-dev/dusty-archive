"""API для управления закупками: список, создание, редактирование, удаление"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            action = params.get('action', 'list')

            if action == 'refs':
                cur.execute("SELECT id, name FROM product_types ORDER BY name")
                product_types = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT id, name FROM competitors ORDER BY name")
                competitors = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT id, full_name FROM executors ORDER BY full_name")
                executors = [dict(r) for r in cur.fetchall()]
                return {
                    'statusCode': 200, 'headers': CORS_HEADERS,
                    'body': json.dumps({'product_types': product_types, 'competitors': competitors, 'executors': executors}, ensure_ascii=False, default=str)
                }

            # list purchases
            search = params.get('search', '')
            type_id = params.get('product_type_id', '')
            conditions = []
            values = []
            if search:
                conditions.append("p.name ILIKE %s")
                values.append(f'%{search}%')
            if type_id:
                conditions.append("p.product_type_id = %s")
                values.append(type_id)
            where = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''
            cur.execute(f"""
                SELECT p.*, pt.name as product_type_name, c.name as competitor_name, e.full_name as executor_name
                FROM purchases p
                LEFT JOIN product_types pt ON pt.id = p.product_type_id
                LEFT JOIN competitors c ON c.id = p.competitor_id
                LEFT JOIN executors e ON e.id = p.executor_id
                {where}
                ORDER BY p.created_at DESC
            """, values)
            purchases = [dict(r) for r in cur.fetchall()]
            cur.execute(f"SELECT COUNT(*) as total FROM purchases p {where}", values)
            total = cur.fetchone()['total']
            return {
                'statusCode': 200, 'headers': CORS_HEADERS,
                'body': json.dumps({'purchases': purchases, 'total': total}, ensure_ascii=False, default=str)
            }

        elif method == 'POST':
            cur.execute("""
                INSERT INTO purchases (name, product_type_id, competitor_id, submission_date, quantity,
                    competitor_price, our_price, percent, our_coefficient, note, executor_id,
                    purchase_link, is_important, is_rejected,
                    competitor_price_with_vat, our_price_with_vat, vat_rate)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (
                body.get('name'), body.get('product_type_id') or None, body.get('competitor_id') or None,
                body.get('submission_date') or None, body.get('quantity') or None,
                body.get('competitor_price') or None, body.get('our_price') or None,
                body.get('percent') or None, body.get('our_coefficient') or None,
                body.get('note'), body.get('executor_id') or None, body.get('purchase_link'),
                body.get('is_important', False), body.get('is_rejected', False),
                body.get('competitor_price_with_vat') or None, body.get('our_price_with_vat') or None,
                body.get('vat_rate') or 20
            ))
            conn.commit()
            new_id = cur.fetchone()['id']
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id})}

        elif method == 'PUT':
            pid = params.get('id')
            cur.execute("""
                UPDATE purchases SET name=%s, product_type_id=%s, competitor_id=%s, submission_date=%s,
                    quantity=%s, competitor_price=%s, our_price=%s, percent=%s, our_coefficient=%s,
                    note=%s, executor_id=%s, purchase_link=%s, is_important=%s, is_rejected=%s,
                    competitor_price_with_vat=%s, our_price_with_vat=%s, vat_rate=%s, updated_at=NOW()
                WHERE id=%s
            """, (
                body.get('name'), body.get('product_type_id') or None, body.get('competitor_id') or None,
                body.get('submission_date') or None, body.get('quantity') or None,
                body.get('competitor_price') or None, body.get('our_price') or None,
                body.get('percent') or None, body.get('our_coefficient') or None,
                body.get('note'), body.get('executor_id') or None, body.get('purchase_link'),
                body.get('is_important', False), body.get('is_rejected', False),
                body.get('competitor_price_with_vat') or None, body.get('our_price_with_vat') or None,
                body.get('vat_rate') or 20, pid
            ))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

        elif method == 'DELETE':
            pid = params.get('id')
            cur.execute("DELETE FROM purchases WHERE id=%s", (pid,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}