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
        s = str(val).replace(',', '.').strip()
        return float(s)
    except (ValueError, TypeError):
        return None


def safe_int(val):
    if val is None:
        return None
    try:
        return int(float(str(val)))
    except (ValueError, TypeError):
        return None


def is_fio(s: str) -> bool:
    """Проверяет, похоже ли значение на ФИО"""
    s = s.strip()
    if len(s) < 5:
        return False
    words = s.split()
    if len(words) < 2:
        return False
    if not words[0][0].isupper():
        return False
    if any(c.isdigit() for c in s):
        return False
    skip = ["фамили", "иниц", "итого", "всего", "наименование", "должност",
            "организац", "подразделен", "сотрудник", "персонал", "рабочи",
            "водител", "уборщ", "итр", "инженер", "техничес", "утвержд",
            "мастер", "бригад", "режим", "работник"]
    if any(kw in s.lower() for kw in skip):
        return False
    return True


def is_tab_number(s: str) -> bool:
    s = s.strip()
    return bool(re.match(r'^\d{2,6}$', s))


# ── ШТАТНЫЕ СОТРУДНИКИ ──────────────────────────────────────────────────────

CATEGORY_MAP = {
    "водител": "Водители",
    "рабочи": "Рабочие",
    "итр": "ИТР",
    "инженер": "ИТР",
    "технич": "ИТР",
    "специалист": "ИТР",
    "уборщ": "Уборщики",
    "дворник": "Уборщики",
    "слесар": "Рабочие",
}


def detect_category(row_text: str):
    t = row_text.lower()
    for kw, cat in CATEGORY_MAP.items():
        if kw in t:
            return cat
    return None


def parse_employees(file_bytes: bytes) -> list[dict]:
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []
    current_category = "Рабочие"

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        all_rows = list(ws.iter_rows(values_only=True))

        # Определяем индексы колонок из строки-заголовка
        name_col = None
        tab_col = None
        pos_col = None
        schedule_col = None

        for row in all_rows[:20]:
            cells = [safe_str(c) for c in row]
            row_lower = " ".join(cells).lower()
            if any(kw in row_lower for kw in ["сотрудник", "фамили", "табел"]):
                for ci, c in enumerate(cells):
                    cl = c.lower()
                    if "сотрудник" in cl or "фамили" in cl or "иниц" in cl:
                        name_col = ci
                    elif "табел" in cl:
                        tab_col = ci
                    elif "должност" in cl:
                        pos_col = ci
                    elif "график" in cl:
                        schedule_col = ci
                if name_col is not None:
                    break

        if name_col is None:
            name_col = 1

        for row in all_rows:
            cells = [safe_str(c) for c in row]
            if not any(cells):
                continue

            row_text = " ".join(cells)
            row_lower = row_text.lower()
            non_empty = [c for c in cells if c]

            # Строка-группа (категория)
            cat = detect_category(row_lower)
            if cat and len(non_empty) <= 4:
                current_category = cat
                continue

            # ФИО
            full_name = cells[name_col] if name_col < len(cells) else ""
            name_col_used = name_col

            if not is_fio(full_name):
                found = False
                for ci, c in enumerate(cells):
                    if is_fio(c):
                        full_name = c
                        name_col_used = ci
                        found = True
                        break
                if not found:
                    continue

            # Табельный номер
            tab_number = ""
            if tab_col is not None and tab_col < len(cells) and is_tab_number(cells[tab_col]):
                tab_number = cells[tab_col]
            else:
                for c in cells:
                    if is_tab_number(c):
                        tab_number = c
                        break

            # Должность
            position = ""
            if pos_col is not None and pos_col < len(cells):
                position = cells[pos_col]
            else:
                for ci, c in enumerate(cells):
                    if ci == name_col_used:
                        continue
                    if len(c) > 10 and not is_tab_number(c) and not is_fio(c):
                        position = c
                        break

            schedule = ""
            if schedule_col is not None and schedule_col < len(cells):
                schedule = cells[schedule_col]

            results.append({
                "full_name": full_name,
                "tab_number": tab_number,
                "position": position,
                "work_schedule": schedule,
                "category": current_category,
                "department": "",
                "status": "active",
            })

    return results


# ── ВИДЫ РАБОТ ───────────────────────────────────────────────────────────────

def parse_work_types(file_bytes: bytes) -> list[dict]:
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []

    SKIP_WORDS = ["наименование", "норматив", "единица", "примечание", "код",
                  "итого", "всего", "таблица", "раздел", "пп"]

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        group_name = sheet_name
        all_rows = list(ws.iter_rows(values_only=True))

        name_col = None
        norm_col = None
        unit_col = None
        code_col = None

        for row in all_rows[:15]:
            cells = [safe_str(c) for c in row]
            row_lower = " ".join(cells).lower()
            if "наименован" in row_lower or "вид раб" in row_lower:
                for ci, c in enumerate(cells):
                    cl = c.lower()
                    if "наименован" in cl or "вид раб" in cl:
                        name_col = ci
                    elif "норм" in cl or "выраб" in cl:
                        norm_col = ci
                    elif "единиц" in cl or "изм" in cl:
                        unit_col = ci
                    elif "код" in cl or "шифр" in cl:
                        code_col = ci
                if name_col is not None:
                    break

        if name_col is None:
            name_col = 1

        for row in all_rows:
            cells = [safe_str(c) for c in row]
            if not any(cells):
                continue

            name = cells[name_col] if name_col < len(cells) else ""
            if not name or len(name) < 4:
                continue
            if any(kw in name.lower() for kw in SKIP_WORDS):
                continue
            if re.match(r'^[\d\s,.\-]+$', name):
                continue

            code = cells[code_col] if code_col is not None and code_col < len(cells) else ""
            unit = cells[unit_col] if unit_col is not None and unit_col < len(cells) else ""
            norm = None
            if norm_col is not None and norm_col < len(cells):
                norm = safe_float(cells[norm_col])

            if not unit:
                unit_words = ["м²", "м2", "м³", "м3", "шт", "пог", "га", "тонн", "кг", "чел"]
                for c in cells:
                    if any(uw in c.lower() for uw in unit_words):
                        unit = c
                        break

            results.append({
                "code": code,
                "name": name,
                "group_name": group_name,
                "unit": unit,
                "norm_per_hour": norm,
            })

    return results


# ── ТАБЕЛЬ ───────────────────────────────────────────────────────────────────

VALID_MARKS = {"Я", "В", "Б", "О", "К", "С", "П", "Н", "Х", "ОТ", "ОЖ", "Р", "НН", "ДО"}

MONTH_RU = {
    "январ": 1, "феврал": 2, "март": 3, "апрел": 4,
    "май": 5, "мая": 5, "июн": 6, "июл": 7, "август": 8,
    "сентябр": 9, "октябр": 10, "ноябр": 11, "декабр": 12,
}


def parse_timesheet(file_bytes: bytes) -> list[dict]:
    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    results = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        all_rows = list(ws.iter_rows(values_only=True))

        year, month = None, None
        day_columns: dict[int, int] = {}
        name_col = None
        tab_col = None
        header_row_idx = None

        # Год/месяц в первых строках
        for row in all_rows[:6]:
            cells = [safe_str(c) for c in row]
            text = " ".join(cells)
            for kw, m_num in MONTH_RU.items():
                if kw in text.lower():
                    yr = re.search(r'20\d{2}', text)
                    if yr:
                        year = int(yr.group())
                        month = m_num
                        break
            if year:
                break

        # Строка с числами 1..31 (заголовок дней)
        for row_i, row in enumerate(all_rows):
            cells = [safe_str(c) for c in row]
            day_nums = []
            for ci, c in enumerate(cells):
                n = safe_int(c)
                if n is not None and 1 <= n <= 31:
                    day_nums.append((ci, n))

            if len(day_nums) >= 20:
                day_columns = {ci: dn for ci, dn in day_nums}
                header_row_idx = row_i
                min_day_col = min(day_columns.keys())

                for ci, c in enumerate(cells[:min_day_col]):
                    cl = c.lower()
                    if "фамили" in cl or "иниц" in cl or "сотрудник" in cl:
                        name_col = ci
                    elif "табел" in cl:
                        tab_col = ci

                if name_col is None:
                    name_col = min_day_col - 1 if min_day_col > 0 else 0
                break

        if not day_columns:
            continue

        for row_i, row in enumerate(all_rows):
            if header_row_idx is not None and row_i <= header_row_idx:
                continue

            cells = [safe_str(c) for c in row]
            if not any(cells):
                continue

            # ФИО
            full_name = cells[name_col] if name_col is not None and name_col < len(cells) else ""
            if not is_fio(full_name):
                min_day_col = min(day_columns.keys()) if day_columns else 99
                found = False
                for ci in range(min(min_day_col, len(cells))):
                    if is_fio(cells[ci]):
                        full_name = cells[ci]
                        found = True
                        break
                if not found:
                    continue

            # Табельный
            tab_number = ""
            if tab_col is not None and tab_col < len(cells) and is_tab_number(cells[tab_col]):
                tab_number = cells[tab_col]
            if not tab_number:
                min_dc = min(day_columns.keys()) if day_columns else 10
                for c in cells[:min_dc]:
                    if is_tab_number(c):
                        tab_number = c
                        break

            # Отметки
            for col_idx, day_num in day_columns.items():
                if col_idx >= len(cells):
                    continue
                raw = cells[col_idx].upper().strip()
                mark = ""
                hours = None

                if raw in VALID_MARKS:
                    mark = raw
                    if raw == "Я":
                        hours = 8.0
                elif re.match(r'^\d+(\.\d+)?$', raw) and 0 < float(raw) <= 24:
                    hours = float(raw)
                    mark = "Я"

                if mark:
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
    import datetime as dt

    wb = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    all_orders = []
    all_brigades = []
    all_lines = []

    MONTH_MAP = {
        "январ": 1, "феврал": 2, "март": 3, "апрел": 4,
        "мая": 5, "май": 5, "июн": 6, "июл": 7, "август": 8,
        "сентябр": 9, "октябр": 10, "ноябр": 11, "декабр": 12,
    }

    for sheet_idx, sheet_name in enumerate(wb.sheetnames):
        ws = wb[sheet_name]
        all_rows = list(ws.iter_rows(values_only=True))

        order_date = None
        master_name = ""
        approver_name = ""
        approver_pos = ""
        order_number = f"НЗ-{sheet_name}-{sheet_idx + 1}"

        for row in all_rows[:40]:
            cells = [safe_str(c) for c in row]
            text = " ".join(cells)

            if not order_date:
                dm = re.search(
                    r'(\d{1,2})\s+(январ|феврал|март|апрел|мая?|июн|июл|август|сентябр|октябр|ноябр|декабр)\S*\s+(\d{4})',
                    text, re.IGNORECASE
                )
                if dm:
                    day_n = int(dm.group(1))
                    mon_word = dm.group(2).lower()
                    year_n = int(dm.group(3))
                    mon_n = next((v for k, v in MONTH_MAP.items() if mon_word.startswith(k[:4])), 1)
                    try:
                        order_date = dt.date(year_n, mon_n, day_n)
                    except Exception:
                        pass

            if "мастер" in text.lower() and not master_name:
                for c in cells:
                    if is_fio(c):
                        master_name = c
                        break

            if not approver_name:
                for c in cells:
                    if is_fio(c) and c != master_name:
                        approver_name = c
                    if len(c) > 15 and ("инженер" in c.lower() or "директор" in c.lower()):
                        approver_pos = c

        all_orders.append({
            "order_number": order_number,
            "order_date": order_date.isoformat() if order_date else None,
            "master_name": master_name or sheet_name,
            "approver_name": approver_name,
            "approver_position": approver_pos,
            "status": "done" if (order_date and order_date.year < 2026) else "in_progress",
        })

        current_brigade_num = 1
        brigade_local_id = f"{order_number}_b1"
        brigade_seen = {brigade_local_id}
        all_brigades.append({
            "order_number": order_number,
            "brigade_number": 1,
            "brigade_id_local": brigade_local_id,
        })

        for row in all_rows:
            cells = [safe_str(c) for c in row]
            text = " ".join(cells)

            bm = re.search(r'бригада\s*[№#]?\s*(\d+)', text, re.IGNORECASE)
            if bm:
                current_brigade_num = int(bm.group(1))
                brigade_local_id = f"{order_number}_b{current_brigade_num}"
                if brigade_local_id not in brigade_seen:
                    brigade_seen.add(brigade_local_id)
                    all_brigades.append({
                        "order_number": order_number,
                        "brigade_number": current_brigade_num,
                        "brigade_id_local": brigade_local_id,
                    })
                continue

            times = [(ci, c) for ci, c in enumerate(cells) if re.match(r'^\d{1,2}:\d{2}$', c)]
            if len(times) < 2:
                continue

            fio = ""
            pos = ""
            min_time_col = times[0][0]
            for ci in range(min_time_col):
                c = cells[ci]
                if is_fio(c) and not fio:
                    fio = c
                elif len(c) > 3 and not is_fio(c) and not is_tab_number(c) and not pos and c:
                    pos = c

            if not fio:
                continue

            max_time_col = max(t[0] for t in times)
            plan_h, fact_h = None, None
            for ci in range(max_time_col + 1, len(cells)):
                n = safe_int(cells[ci])
                if n and 1 <= n <= 24:
                    if plan_h is None:
                        plan_h = float(n)
                    elif fact_h is None:
                        fact_h = float(n)
                        break

            times_vals = [t[1] for t in times]
            all_lines.append({
                "order_number": order_number,
                "brigade_id_local": brigade_local_id,
                "employee_name": fio,
                "position": pos,
                "shift1_start": times_vals[0] if len(times_vals) > 0 else None,
                "shift1_end": times_vals[1] if len(times_vals) > 1 else None,
                "shift2_start": times_vals[2] if len(times_vals) > 2 else None,
                "shift2_end": times_vals[3] if len(times_vals) > 3 else None,
                "hours_plan": plan_h,
                "hours_fact": fact_h,
                "is_ok": False,
            })

    return all_orders, all_brigades, all_lines
