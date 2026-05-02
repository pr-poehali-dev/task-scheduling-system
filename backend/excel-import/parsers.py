"""Парсеры для каждого типа Excel-файла АПХ Абакан"""
import re
from openpyxl import load_workbook
from io import BytesIO


def safe_str(val):
    if val is None:
        return ""
    return str(val).strip()


def safe_float(val):
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def safe_int(val):
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def parse_time(val):
    """Парсит время вида 8:00 или datetime.time"""
    if val is None:
        return None
    s = safe_str(val)
    if not s:
        return None
    import datetime
    if isinstance(val, datetime.time):
        return val.strftime("%H:%M")
    m = re.match(r'^(\d{1,2}):(\d{2})$', s)
    if m:
        return s
    return s[:5] if len(s) >= 5 else s


# ── ШТАТНЫЕ СОТРУДНИКИ ──────────────────────────────────────────────────────

def parse_employees(file_bytes: bytes) -> list[dict]:
    """
    Файл: штатные сотрудники.xlsx
    Структура: группы (Водители / Рабочие / ...) с записями
    Колонки: № | Сотрудник | Табельный номер | Должность | График работы
    """
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []
    current_category = "Прочие"

    CATEGORY_KEYWORDS = {
        "водители": "Водители",
        "рабочие": "Рабочие",
        "итр": "ИТР",
        "уборщ": "Уборщики",
        "инженер": "ИТР",
        "технич": "ИТР",
        "специалист": "ИТР",
    }

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))

        for row in rows:
            cells = [safe_str(c) for c in row]
            row_text = " ".join(cells).lower()

            # Определяем категорию по строке-заголовку группы
            for kw, cat in CATEGORY_KEYWORDS.items():
                if kw in row_text and all(safe_str(c) == "" for c in row[2:6]):
                    current_category = cat
                    break

            # Ищем строку с сотрудником: есть ФИО и табельный номер
            # Позиция: [№, ФИО, Табельный, Должность, График]
            # Ищем по признаку: ячейка[1] — длинное имя, ячейка[2] — цифровой код
            full_name = safe_str(row[1]) if len(row) > 1 else ""
            tab_num = safe_str(row[2]) if len(row) > 2 else ""
            position = safe_str(row[3]) if len(row) > 3 else ""
            schedule = safe_str(row[4]) if len(row) > 4 else ""

            # Фильтр: имя должно содержать хотя бы 2 слова (ФИО), таб. номер — цифры
            name_words = full_name.split()
            if len(name_words) >= 2 and re.match(r'^\d+$', tab_num):
                results.append({
                    "full_name": full_name,
                    "tab_number": tab_num,
                    "position": position,
                    "work_schedule": schedule,
                    "category": current_category,
                    "department": "",
                    "status": "active",
                })

    return results


# ── ВИДЫ РАБОТ ───────────────────────────────────────────────────────────────

def parse_work_types(file_bytes: bytes) -> list[dict]:
    """
    Файл: виды работ.xlsx
    Структура: несколько листов. Каждый лист — группа работ.
    Ищем строки с кодом/наименованием работы.
    """
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        group_name = sheet_name

        for row in rows:
            if not row:
                continue
            cells = [safe_str(c) for c in row]
            # Ищем строку где есть непустое название (длиннее 5 символов)
            # и хотя бы одна ячейка с числом (норматив)
            name_candidates = [c for c in cells if len(c) > 5 and not c.replace('.', '').replace(',', '').isdigit()]
            num_candidates = [safe_float(c.replace(',', '.')) for c in cells if re.match(r'^\d+[,.]?\d*$', c)]

            if not name_candidates:
                continue

            name = name_candidates[0]
            # Пропускаем заголовки
            header_words = ["наименование", "норматив", "единица", "примечание", "код", "№"]
            if any(hw in name.lower() for hw in header_words):
                continue

            code = ""
            for c in cells:
                if re.match(r'^[\d\-\.]+$', c) and len(c) <= 15 and c != "":
                    code = c
                    break

            unit = ""
            unit_words = ["м2", "м²", "м3", "шт", "пог", "га", "тонн", "кг", "чел"]
            for c in cells:
                if any(uw in c.lower() for uw in unit_words):
                    unit = c
                    break

            norm = num_candidates[0] if num_candidates else None

            results.append({
                "code": code,
                "name": name,
                "group_name": group_name,
                "unit": unit,
                "norm_per_hour": norm,
            })

    return results


# ── ТАБЕЛЬ ───────────────────────────────────────────────────────────────────

VALID_MARKS = {"Я", "В", "Б", "О", "К", "С", "П", "Н", "Х", "ОТ", "ОЖ", "Р"}


def parse_timesheet(file_bytes: bytes) -> list[dict]:
    """
    Файл: табель.xlsx
    Структура листов: ИТР | Водители | Рабочие | Уборщики
    Строки: № | Должность | ФИО | день1..день31
    Заголовок месяца/года ищем в первых строках.
    """
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))

        year, month = None, None
        day_columns = {}  # col_index -> day_number
        name_col = None
        tab_col = None
        data_started = False

        MONTH_RU = {
            "январ": 1, "феврал": 2, "март": 3, "апрел": 4,
            "май": 5, "мая": 5, "июн": 6, "июл": 7, "август": 8,
            "сентябр": 9, "октябр": 10, "ноябр": 11, "декабр": 12,
        }

        for row_idx, row in enumerate(rows):
            cells = [safe_str(c) for c in row]
            row_text = " ".join(cells).lower()

            # Ищем год и месяц
            if year is None:
                for kw, m_num in MONTH_RU.items():
                    if kw in row_text:
                        for c in cells:
                            yr = re.search(r'20\d{2}', c)
                            if yr:
                                year = int(yr.group())
                                month = m_num
                                break
                        if year:
                            break

            # Ищем строку-заголовок с числами 1..31 (дни месяца)
            day_nums_in_row = []
            for ci, c in enumerate(cells):
                n = safe_int(c)
                if n and 1 <= n <= 31:
                    day_nums_in_row.append((ci, n))

            if len(day_nums_in_row) >= 15 and not day_columns:
                day_columns = {ci: dn for ci, dn in day_nums_in_row}
                # Определяем колонки ФИО и табельного
                # ФИО — обычно 2-3 колонка слева от дней
                min_day_col = min(day_columns.keys())
                for ci in range(min_day_col - 1, -1, -1):
                    if "фамили" in safe_str(cells[ci]).lower() or "иниц" in safe_str(cells[ci]).lower():
                        name_col = ci
                        break
                if name_col is None:
                    name_col = max(0, min_day_col - 1)
                # Табельный — ищем по заголовку
                for ci, c in enumerate(cells):
                    if "табел" in c.lower():
                        tab_col = ci
                        break
                data_started = True
                continue

            if not data_started or not day_columns:
                continue

            # Строки данных
            if name_col is None or name_col >= len(cells):
                continue

            full_name = safe_str(cells[name_col]) if name_col < len(cells) else ""
            tab_number = safe_str(cells[tab_col]) if tab_col and tab_col < len(cells) else ""

            # Пропускаем строки без ФИО или с заголовками
            name_words = full_name.split()
            if len(name_words) < 2:
                continue
            if any(w in full_name.lower() for w in ["фамили", "иниц", "итого", "всего"]):
                continue

            # Читаем отметки по дням
            for col_idx, day_num in day_columns.items():
                if col_idx >= len(cells):
                    continue
                mark = safe_str(cells[col_idx]).upper()
                hours = None

                if mark in VALID_MARKS:
                    pass
                elif re.match(r'^\d+(\.\d+)?$', mark):
                    # Число часов — явка
                    hours = safe_float(mark)
                    mark = "Я"
                elif mark == "":
                    mark = ""
                else:
                    mark = ""

                if mark or hours:
                    results.append({
                        "employee_name": full_name,
                        "tab_number": tab_number,
                        "year": year or 2026,
                        "month": month or 1,
                        "day": day_num,
                        "mark": mark,
                        "hours": hours,
                    })

    return results


# ── НАРЯД-ЗАДАНИЕ ─────────────────────────────────────────────────────────────

def parse_orders(file_bytes: bytes) -> tuple[list[dict], list[dict], list[dict]]:
    """
    Файл: Наряд задание.xlsx
    Листы: каждый лист — отдельный мастер/объект
    Структура: шапка (дата, мастер, утверждающий), таблица бригад с работниками
    Возвращает: (orders, brigades, lines)
    """
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    all_orders = []
    all_brigades = []
    all_lines = []

    order_counter = 1

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))

        order_date = None
        master_name = ""
        approver_name = ""
        approver_pos = ""
        order_number = f"НЗ-{sheet_name}-{order_counter}"
        order_counter += 1

        # Ищем дату, мастера, утверждающего в первых 30 строках
        for row in rows[:30]:
            cells = [safe_str(c) for c in row]
            row_text = " ".join(cells)

            # Дата вида "22 января 2026 г."
            dm = re.search(r'(\d{1,2})\s+(январ|феврал|март|апрел|мая?|июн|июл|август|сентябр|октябр|ноябр|декабр)\S*\s+(\d{4})', row_text, re.IGNORECASE)
            if dm and not order_date:
                month_map = {
                    "январ": 1, "феврал": 2, "март": 3, "апрел": 4,
                    "мая": 5, "май": 5, "июн": 6, "июл": 7, "август": 8,
                    "сентябр": 9, "октябр": 10, "ноябр": 11, "декабр": 12,
                }
                day_n = int(dm.group(1))
                mon_word = dm.group(2).lower()
                year_n = int(dm.group(3))
                mon_n = next((v for k, v in month_map.items() if mon_word.startswith(k[:4])), 1)
                import datetime
                try:
                    order_date = datetime.date(year_n, mon_n, day_n)
                except Exception:
                    pass

            # Мастер
            if "мастер" in row_text.lower() and not master_name:
                for c in cells:
                    words = c.split()
                    if len(words) >= 2 and any(w[0].isupper() for w in words):
                        if "мастер" not in c.lower():
                            master_name = c
                            break

            # Утверждающий
            if "утвержд" in row_text.lower() and not approver_name:
                for c in cells:
                    if len(c) > 3 and "утвержд" not in c.lower():
                        approver_name = c
                        break

            if "гл." in row_text.lower() or "главн" in row_text.lower():
                for c in cells:
                    if len(c) > 10 and ("инженер" in c.lower() or "директор" in c.lower()):
                        approver_pos = c
                        break

        order_rec = {
            "order_number": order_number,
            "order_date": order_date.isoformat() if order_date else None,
            "master_name": master_name or sheet_name,
            "approver_name": approver_name,
            "approver_position": approver_pos,
            "status": "done" if order_date and order_date.year < 2026 else "in_progress",
            "sheet_name": sheet_name,
        }
        all_orders.append(order_rec)

        # Ищем строки с работниками бригад
        # Признак: есть "бригада" или числа-времена вида 8:00
        current_brigade_num = 1
        brigade_id_local = f"{order_number}_b{current_brigade_num}"
        brigade_rec = {
            "order_number": order_number,
            "brigade_number": current_brigade_num,
            "brigade_id_local": brigade_id_local,
        }
        all_brigades.append(brigade_rec)

        for row in rows:
            cells = [safe_str(c) for c in row]
            row_text = " ".join(cells)

            # Новая бригада
            bm = re.search(r'бригада\s*[№#]?\s*(\d+)', row_text, re.IGNORECASE)
            if bm:
                current_brigade_num = int(bm.group(1))
                brigade_id_local = f"{order_number}_b{current_brigade_num}"
                brigade_rec = {
                    "order_number": order_number,
                    "brigade_number": current_brigade_num,
                    "brigade_id_local": brigade_id_local,
                }
                if brigade_id_local not in [b["brigade_id_local"] for b in all_brigades]:
                    all_brigades.append(brigade_rec)
                continue

            # Строка работника: ищем время вида HH:MM в ячейках
            times_in_row = []
            for ci, c in enumerate(cells):
                if re.match(r'^\d{1,2}:\d{2}$', c):
                    times_in_row.append((ci, c))

            if len(times_in_row) >= 2:
                # ФИО — ищем ячейку с 2+ словами с заглавными
                fio = ""
                position = ""
                for ci, c in enumerate(cells):
                    words = c.split()
                    if len(words) >= 2 and words[0][0].isupper() and not re.match(r'^\d', c):
                        if not any(skip in c.lower() for skip in ["работник", "фамили", "должн"]):
                            if not fio:
                                fio = c
                            elif not position and len(c) > 3:
                                position = c
                            break

                # Часы план/факт
                plan_h = None
                fact_h = None
                nums_in_row = [(ci, safe_float(c)) for ci, c in enumerate(cells) if re.match(r'^\d+$', c) and 1 <= int(c) <= 24]

                if nums_in_row:
                    plan_h = nums_in_row[0][1] if nums_in_row else None
                    fact_h = nums_in_row[1][1] if len(nums_in_row) > 1 else None

                times_sorted = sorted(times_in_row, key=lambda x: x[0])
                s1 = times_sorted[0][1] if len(times_sorted) > 0 else None
                e1 = times_sorted[1][1] if len(times_sorted) > 1 else None
                s2 = times_sorted[2][1] if len(times_sorted) > 2 else None
                e2 = times_sorted[3][1] if len(times_sorted) > 3 else None

                if fio:
                    all_lines.append({
                        "order_number": order_number,
                        "brigade_id_local": brigade_id_local,
                        "employee_name": fio,
                        "position": position,
                        "shift1_start": s1,
                        "shift1_end": e1,
                        "shift2_start": s2,
                        "shift2_end": e2,
                        "hours_plan": plan_h,
                        "hours_fact": fact_h,
                        "is_ok": False,
                    })

    return all_orders, all_brigades, all_lines
