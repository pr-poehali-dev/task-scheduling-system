"""
Локальный импорт Excel-файлов АПХ Абакан.
Запускать: python upload/import_local.py
Читает файлы из папки upload/, парсит и сохраняет в БД.
"""
import os
import sys
import base64
import json

# Добавляем путь к бэкенду
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend', 'excel-import'))

UPLOAD_DIR = os.path.dirname(__file__)

# Соответствие имён файлов → тип импорта
FILE_MAP = {
    'штатные сотрудники.xlsx': 'employees',
    'виды работ.xlsx': 'work_types',
    'табель.xlsx': 'timesheet',
    'наряд задание.xlsx': 'orders',
}

def find_file(name_pattern: str):
    """Ищет файл в папке upload/ без учёта регистра"""
    for fname in os.listdir(UPLOAD_DIR):
        if fname.lower() == name_pattern.lower() and fname.endswith('.xlsx'):
            return os.path.join(UPLOAD_DIR, fname)
    return None

def import_file(file_path: str, file_type: str):
    from parsers import parse_employees, parse_work_types, parse_timesheet, parse_orders
    import psycopg2

    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print(f"  ✗ DATABASE_URL не задан")
        return

    with open(file_path, 'rb') as f:
        file_bytes = f.read()

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    ok, err = 0, 0

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
                    """, (r['tab_number'], r['full_name'], r['position'], r['department'], r['category'], r['work_schedule']))
                    ok += 1
                except Exception as e:
                    err += 1

        elif file_type == 'work_types':
            records = parse_work_types(file_bytes)
            # Очищаем перед импортом чтобы не дублировать
            cur.execute("DELETE FROM work_types")
            for r in records:
                try:
                    cur.execute("""
                        INSERT INTO work_types (code, name, group_name, unit, norm_per_hour)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (r['code'], r['name'], r['group_name'], r['unit'], r['norm_per_hour']))
                    ok += 1
                except Exception as e:
                    err += 1

        elif file_type == 'timesheet':
            records = parse_timesheet(file_bytes)
            for r in records:
                try:
                    emp_id = None
                    if r['tab_number']:
                        cur.execute("SELECT id FROM employees WHERE tab_number = %s LIMIT 1", (r['tab_number'],))
                        row = cur.fetchone()
                        if row:
                            emp_id = row[0]
                    cur.execute("""
                        INSERT INTO timesheet (employee_id, employee_name, tab_number, year, month, day, mark, hours)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (tab_number, year, month, day) DO UPDATE SET
                            mark = EXCLUDED.mark, hours = EXCLUDED.hours,
                            employee_id = COALESCE(EXCLUDED.employee_id, timesheet.employee_id)
                    """, (emp_id, r['employee_name'], r['tab_number'], r['year'], r['month'], r['day'], r['mark'], r['hours']))
                    ok += 1
                except Exception as e:
                    err += 1

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
                    """, (o['order_number'], o.get('order_date'), o['master_name'], o.get('approver_name'), o.get('approver_position'), o['status']))
                    oid = cur.fetchone()[0]
                    order_id_map[o['order_number']] = oid
                    ok += 1
                except Exception as e:
                    err += 1

            for b in brigades:
                oid = order_id_map.get(b['order_number'])
                if not oid:
                    continue
                try:
                    cur.execute("INSERT INTO order_brigades (order_id, brigade_number) VALUES (%s, %s) RETURNING id",
                                (oid, b['brigade_number']))
                    brigade_id_map[b['brigade_id_local']] = cur.fetchone()[0]
                except Exception:
                    pass

            for line in lines:
                oid = order_id_map.get(line['order_number'])
                bid = brigade_id_map.get(line['brigade_id_local'])
                if not oid:
                    continue
                emp_id = None
                if line['employee_name']:
                    cur.execute("SELECT id FROM employees WHERE full_name ILIKE %s LIMIT 1", (f"%{line['employee_name']}%",))
                    row = cur.fetchone()
                    if row:
                        emp_id = row[0]
                try:
                    cur.execute("""
                        INSERT INTO order_lines (order_id, brigade_id, employee_id, employee_name, position,
                            shift1_start, shift1_end, shift2_start, shift2_end, hours_plan, hours_fact, is_ok)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (oid, bid, emp_id, line.get('employee_name'), line.get('position'),
                          line.get('shift1_start'), line.get('shift1_end'),
                          line.get('shift2_start'), line.get('shift2_end'),
                          line.get('hours_plan'), line.get('hours_fact'), False))
                    ok += 1
                except Exception:
                    err += 1

        conn.commit()
        cur.execute("INSERT INTO import_log (file_name, file_type, rows_imported, rows_error, status) VALUES (%s, %s, %s, %s, 'ok')",
                    (os.path.basename(file_path), file_type, ok, err))
        conn.commit()

    except Exception as e:
        conn.rollback()
        print(f"  ✗ Критическая ошибка: {e}")
        cur.close(); conn.close()
        return

    cur.close(); conn.close()
    print(f"  ✓ Импортировано: {ok} записей, ошибок: {err}")


if __name__ == '__main__':
    print("=" * 50)
    print("Импорт Excel-файлов АПХ Абакан")
    print("=" * 50)

    found_any = False
    for fname, ftype in FILE_MAP.items():
        path = find_file(fname)
        if path:
            found_any = True
            print(f"\n[{ftype}] {fname}")
            import_file(path, ftype)
        else:
            print(f"\n  — файл не найден: {fname}")

    if not found_any:
        print("\nФайлы не найдены. Положите xlsx-файлы в папку upload/")

    print("\n" + "=" * 50)
    print("Готово!")
