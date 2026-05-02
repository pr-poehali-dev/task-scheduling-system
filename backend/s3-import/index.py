"""
Импорт Excel-файлов из S3-хранилища (папка upload/).
GET  / — список файлов в upload/
POST / — запустить импорт файла по ключу
"""
import json
import os
import sys
import boto3
import psycopg2

# Подключаем парсеры из excel-import
sys.path.insert(0, '/function/code')

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

BUCKET = 'files'
PREFIX = 'upload/'

FILE_TYPE_MAP = {
    'штатные сотрудники': 'employees',
    'виды работ': 'work_types',
    'табель': 'timesheet',
    'наряд задание': 'orders',
    'наряд-задание': 'orders',
}


def s3_client():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(status: int, body) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def detect_type(filename: str) -> str:
    name = filename.lower().replace('.xlsx', '').replace('.xls', '').strip()
    for key, ftype in FILE_TYPE_MAP.items():
        if key in name:
            return ftype
    return 'unknown'


def handler(event: dict, context) -> dict:
    """Чтение и импорт Excel из S3 папки upload/"""
    if event.get('httpMethod') == 'OPTIONS':
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return list_files()

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'import')

        if action == 'list':
            return list_files()
        if action == 'import':
            key = body.get('key', '')
            file_type = body.get('file_type', '')
            return import_from_s3(key, file_type)
        if action == 'import_all':
            return import_all()

    return resp(404, {"error": "not found"})


def list_files() -> dict:
    """Список Excel-файлов в папке upload/"""
    s3 = s3_client()
    try:
        # Сначала upload/, если пусто — весь бакет
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
        all_objects = response.get('Contents', [])
        if not all_objects:
            response = s3.list_objects_v2(Bucket=BUCKET)
            all_objects = response.get('Contents', [])

        files = []
        for obj in all_objects:
            key = obj['Key']
            name = key.split('/')[-1]
            if not name or name.endswith('/'):
                continue
            if not (name.lower().endswith('.xlsx') or name.lower().endswith('.xls')):
                continue
            ftype = detect_type(name)
            files.append({
                'key': key,
                'name': name,
                'folder': '/'.join(key.split('/')[:-1]) or '(корень)',
                'size_kb': round(obj['Size'] / 1024, 1),
                'modified': str(obj['LastModified'])[:19],
                'file_type': ftype,
                'type_label': {
                    'employees': 'Штатные сотрудники',
                    'work_types': 'Виды работ',
                    'timesheet': 'Табель',
                    'orders': 'Наряд-задание',
                }.get(ftype, 'Неизвестный тип'),
            })
        return resp(200, {"ok": True, "files": files})
    except Exception as e:
        return resp(500, {"error": str(e)})


def import_from_s3(key: str, file_type: str) -> dict:
    """Скачать файл из S3 и импортировать"""
    if not key:
        return resp(400, {"error": "key обязателен"})

    # Определяем тип автоматически если не передан
    if not file_type or file_type == 'unknown':
        file_type = detect_type(key.split('/')[-1])

    if file_type == 'unknown':
        return resp(400, {"error": f"Не удалось определить тип файла: {key}"})

    # Скачиваем из S3
    s3 = s3_client()
    try:
        obj = s3.get_object(Bucket=BUCKET, Key=key)
        file_bytes = obj['Body'].read()
    except Exception as e:
        return resp(500, {"error": f"Ошибка чтения из S3: {str(e)}"})

    # Импортируем
    from parsers import parse_employees, parse_work_types, parse_timesheet, parse_orders

    conn = get_conn()
    cur = conn.cursor()
    ok, err = 0, 0
    err_msgs = []

    try:
        if file_type == 'employees':
            records = parse_employees(file_bytes)
            for r in records:
                try:
                    cur.execute("""
                        INSERT INTO employees (tab_number, full_name, position, department, category, work_schedule, status)
                        VALUES (%s, %s, %s, %s, %s, %s, 'active')
                        ON CONFLICT (tab_number) DO UPDATE SET
                            full_name = EXCLUDED.full_name,
                            position = EXCLUDED.position,
                            category = EXCLUDED.category,
                            work_schedule = EXCLUDED.work_schedule,
                            updated_at = NOW()
                    """, (r['tab_number'], r['full_name'], r['position'], r.get('department',''), r['category'], r.get('work_schedule','')))
                    ok += 1
                except Exception as e:
                    err += 1; err_msgs.append(str(e)[:80])

        elif file_type == 'work_types':
            records = parse_work_types(file_bytes)
            cur.execute("TRUNCATE work_types RESTART IDENTITY")
            for r in records:
                try:
                    cur.execute("""
                        INSERT INTO work_types (code, name, group_name, unit, norm_per_hour)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (r['code'], r['name'], r['group_name'], r.get('unit',''), r.get('norm_per_hour')))
                    ok += 1
                except Exception as e:
                    err += 1; err_msgs.append(str(e)[:80])

        elif file_type == 'timesheet':
            records = parse_timesheet(file_bytes)
            for r in records:
                try:
                    emp_id = None
                    if r.get('tab_number'):
                        cur.execute("SELECT id FROM employees WHERE tab_number = %s LIMIT 1", (r['tab_number'],))
                        row = cur.fetchone()
                        if row: emp_id = row[0]
                    cur.execute("""
                        INSERT INTO timesheet (employee_id, employee_name, tab_number, year, month, day, mark, hours)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (tab_number, year, month, day) DO UPDATE SET
                            mark = EXCLUDED.mark, hours = EXCLUDED.hours,
                            employee_id = COALESCE(EXCLUDED.employee_id, timesheet.employee_id)
                    """, (emp_id, r['employee_name'], r['tab_number'], r['year'], r['month'], r['day'], r['mark'], r.get('hours')))
                    ok += 1
                except Exception as e:
                    err += 1; err_msgs.append(str(e)[:80])

        elif file_type == 'orders':
            orders, brigades, lines = parse_orders(file_bytes)
            order_id_map = {}
            brigade_id_map = {}

            for o in orders:
                try:
                    cur.execute("""
                        INSERT INTO orders (order_number, order_date, master_name, approver_name, approver_position, status)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (order_number) DO UPDATE SET
                            order_date = EXCLUDED.order_date, master_name = EXCLUDED.master_name,
                            updated_at = NOW()
                        RETURNING id
                    """, (o['order_number'], o.get('order_date'), o['master_name'],
                          o.get('approver_name',''), o.get('approver_position',''), o['status']))
                    oid = cur.fetchone()[0]
                    order_id_map[o['order_number']] = oid
                    ok += 1
                except Exception as e:
                    err += 1; err_msgs.append(str(e)[:80])

            for b in brigades:
                oid = order_id_map.get(b['order_number'])
                if not oid: continue
                try:
                    cur.execute("INSERT INTO order_brigades (order_id, brigade_number) VALUES (%s, %s) RETURNING id",
                                (oid, b['brigade_number']))
                    brigade_id_map[b['brigade_id_local']] = cur.fetchone()[0]
                except Exception: pass

            for line in lines:
                oid = order_id_map.get(line['order_number'])
                bid = brigade_id_map.get(line.get('brigade_id_local',''))
                if not oid: continue
                emp_id = None
                if line.get('employee_name'):
                    cur.execute("SELECT id FROM employees WHERE full_name ILIKE %s LIMIT 1",
                                (f"%{line['employee_name']}%",))
                    row = cur.fetchone()
                    if row: emp_id = row[0]
                try:
                    cur.execute("""
                        INSERT INTO order_lines (order_id, brigade_id, employee_id, employee_name, position,
                            shift1_start, shift1_end, shift2_start, shift2_end, hours_plan, hours_fact, is_ok)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,false)
                    """, (oid, bid, emp_id, line.get('employee_name'), line.get('position'),
                          line.get('shift1_start'), line.get('shift1_end'),
                          line.get('shift2_start'), line.get('shift2_end'),
                          line.get('hours_plan'), line.get('hours_fact')))
                    ok += 1
                except Exception as e:
                    err += 1; err_msgs.append(str(e)[:80])

        conn.commit()

        fname = key.split('/')[-1]
        cur.execute("INSERT INTO import_log (file_name, file_type, rows_imported, rows_error, status, error_msg) VALUES (%s,%s,%s,%s,%s,%s)",
                    (fname, file_type, ok, err, 'ok' if not err_msgs else 'partial', '; '.join(err_msgs[:3])))
        conn.commit()

    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return resp(500, {"error": str(e)})

    cur.close(); conn.close()
    return resp(200, {
        "ok": True, "key": key, "file_type": file_type,
        "imported": ok, "errors": err,
        "warnings": err_msgs[:3] if err_msgs else None,
    })


def import_all() -> dict:
    """Импортировать все файлы из upload/ в правильном порядке"""
    s3 = s3_client()
    try:
        response = s3.list_objects_v2(Bucket=BUCKET, Prefix=PREFIX)
    except Exception as e:
        return resp(500, {"error": str(e)})

    # Порядок важен: сначала сотрудники, потом остальное
    ORDER = ['employees', 'work_types', 'timesheet', 'orders']
    files_by_type = {}

    for obj in response.get('Contents', []):
        key = obj['Key']
        name = key.replace(PREFIX, '')
        if not name or not (name.lower().endswith('.xlsx') or name.lower().endswith('.xls')):
            continue
        ftype = detect_type(name)
        if ftype != 'unknown':
            files_by_type[ftype] = key

    results = []
    for ftype in ORDER:
        key = files_by_type.get(ftype)
        if not key:
            results.append({"file_type": ftype, "status": "not_found"})
            continue
        r = import_from_s3(key, ftype)
        body = json.loads(r['body'])
        results.append({
            "file_type": ftype,
            "key": key,
            "imported": body.get('imported', 0),
            "errors": body.get('errors', 0),
            "status": "ok" if body.get('ok') else "error",
            "error": body.get('error'),
        })

    return resp(200, {"ok": True, "results": results})