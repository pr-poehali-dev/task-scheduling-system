"""
Авторизация МБУ АПХ Абакан.
POST /login         — вход
POST /logout        — выход
POST /me            — проверка токена
POST /users         — список пользователей (admin)
POST /create-user   — создать пользователя (admin)
POST /update-user   — изменить роль / ФИО (admin)
POST /change-password — сменить пароль (admin)
POST /toggle-user   — заблокировать/разблокировать (admin)
POST /delete-user   — удалить навсегда (admin)
"""
import json, os, secrets
import bcrypt
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

ROLES = {"admin": "Администратор", "master": "Мастер", "dispatcher": "Диспетчер", "user": "Пользователь"}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_token_info(event: dict):
    """Возвращает (user_id, username, role) по токену или None"""
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT user_id, username, role FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row if row else None


def require_admin(event: dict):
    info = get_token_info(event)
    if not info or info[2] != "admin":
        return None
    return info


def users_list(cur):
    cur.execute("""
        SELECT id, username, full_name, role, is_active, created_at
        FROM users ORDER BY created_at
    """)
    rows = cur.fetchall()
    return [{"id": r[0], "username": r[1], "full_name": r[2],
             "role": r[3], "role_label": ROLES.get(r[3], r[3]),
             "is_active": r[4], "created_at": str(r[5])[:19]} for r in rows]


def handler(event: dict, context) -> dict:
    """Авторизация и управление пользователями АПХ Абакан"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")

    _path = body.get("_path", event.get("path", "/"))

    if _path.endswith("/login"):        return handle_login(body)
    if _path.endswith("/logout"):       return handle_logout(event)
    if _path.endswith("/me"):           return handle_me(event)
    if _path.endswith("/users"):        return handle_list_users(event)
    if _path.endswith("/create-user"):  return handle_create_user(body, event)
    if _path.endswith("/update-user"):  return handle_update_user(body, event)
    if _path.endswith("/change-password"): return handle_change_password(body, event)
    if _path.endswith("/toggle-user"):  return handle_toggle_user(body, event)
    if _path.endswith("/delete-user"):  return handle_delete_user(body, event)

    return resp(404, {"error": "not found"})


# ── ЛОГИН ─────────────────────────────────────────────────────────────────────

def handle_login(body: dict) -> dict:
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return resp(400, {"error": "Введите логин и пароль"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, full_name, role, is_active FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(401, {"error": "Неверный логин или пароль"})

    user_id, pw_hash, full_name, role, is_active = row
    if not is_active:
        cur.close(); conn.close()
        return resp(403, {"error": "Аккаунт заблокирован. Обратитесь к администратору."})
    if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
        cur.close(); conn.close()
        return resp(401, {"error": "Неверный логин или пароль"})

    token = secrets.token_hex(32)
    cur.execute("INSERT INTO sessions (token, user_id, username, role) VALUES (%s, %s, %s, %s)",
                (token, user_id, username, role))
    conn.commit()
    cur.close(); conn.close()

    return resp(200, {"ok": True, "token": token, "username": username,
                      "full_name": full_name or username, "role": role,
                      "role_label": ROLES.get(role, role)})


# ── ВЫХОД ─────────────────────────────────────────────────────────────────────

def handle_logout(event: dict) -> dict:
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if token:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
        conn.commit()
        cur.close(); conn.close()
    return resp(200, {"ok": True})


# ── ПРОВЕРКА ТОКЕНА ───────────────────────────────────────────────────────────

def handle_me(event: dict) -> dict:
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if not token:
        return resp(401, {"error": "Нет токена"})
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT username, role FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return resp(401, {"error": "Сессия истекла"})
    return resp(200, {"ok": True, "username": row[0], "role": row[1], "role_label": ROLES.get(row[1], row[1])})


# ── СПИСОК ПОЛЬЗОВАТЕЛЕЙ ──────────────────────────────────────────────────────

def handle_list_users(event: dict) -> dict:
    if not require_admin(event):
        return resp(403, {"error": "Доступ запрещён"})
    conn = get_conn()
    cur = conn.cursor()
    result = users_list(cur)
    cur.close(); conn.close()
    return resp(200, {"ok": True, "users": result})


# ── СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ ──────────────────────────────────────────────────────

def handle_create_user(body: dict, event: dict) -> dict:
    if not require_admin(event):
        return resp(403, {"error": "Доступ запрещён"})

    username = body.get("username", "").strip()
    password = body.get("password", "")
    full_name = body.get("full_name", "").strip()
    role = body.get("role", "user")

    if not username or not password:
        return resp(400, {"error": "Логин и пароль обязательны"})
    if len(password) < 6:
        return resp(400, {"error": "Пароль минимум 6 символов"})
    if role not in ROLES:
        return resp(400, {"error": f"Роль должна быть одной из: {', '.join(ROLES.keys())}"})

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    if cur.fetchone():
        cur.close(); conn.close()
        return resp(409, {"error": f"Пользователь «{username}» уже существует"})

    cur.execute("INSERT INTO users (username, password_hash, full_name, role) VALUES (%s, %s, %s, %s)",
                (username, pw_hash, full_name or username, role))
    conn.commit()
    result = users_list(cur)
    cur.close(); conn.close()
    return resp(200, {"ok": True, "message": f"Пользователь «{username}» создан", "users": result})


# ── ИЗМЕНИТЬ РОЛЬ / ФИО ───────────────────────────────────────────────────────

def handle_update_user(body: dict, event: dict) -> dict:
    admin = require_admin(event)
    if not admin:
        return resp(403, {"error": "Доступ запрещён"})

    user_id = body.get("user_id")
    new_role = body.get("role")
    new_full_name = body.get("full_name", "").strip()

    if not user_id:
        return resp(400, {"error": "user_id обязателен"})
    if new_role and new_role not in ROLES:
        return resp(400, {"error": "Недопустимая роль"})

    conn = get_conn()
    cur = conn.cursor()

    # Защита: нельзя изменить роль самому себе
    cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Пользователь не найден"})

    if new_role:
        cur.execute("UPDATE users SET role = %s, updated_at = NOW() WHERE id = %s", (new_role, user_id))
    if new_full_name:
        cur.execute("UPDATE users SET full_name = %s, updated_at = NOW() WHERE id = %s", (new_full_name, user_id))

    conn.commit()
    result = users_list(cur)
    cur.close(); conn.close()
    return resp(200, {"ok": True, "message": "Данные обновлены", "users": result})


# ── СМЕНИТЬ ПАРОЛЬ ────────────────────────────────────────────────────────────

def handle_change_password(body: dict, event: dict) -> dict:
    if not require_admin(event):
        return resp(403, {"error": "Доступ запрещён"})

    user_id = body.get("user_id")
    new_password = body.get("password", "")

    if not user_id or not new_password:
        return resp(400, {"error": "user_id и password обязательны"})
    if len(new_password) < 6:
        return resp(400, {"error": "Пароль минимум 6 символов"})

    pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", (pw_hash, user_id))
    # Инвалидируем все сессии этого пользователя
    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
    conn.commit()
    result = users_list(cur)
    cur.close(); conn.close()
    return resp(200, {"ok": True, "message": "Пароль изменён. Пользователю нужно войти заново.", "users": result})


# ── БЛОКИРОВКА / РАЗБЛОКИРОВКА ────────────────────────────────────────────────

def handle_toggle_user(body: dict, event: dict) -> dict:
    admin = require_admin(event)
    if not admin:
        return resp(403, {"error": "Доступ запрещён"})

    user_id = body.get("user_id")
    if not user_id:
        return resp(400, {"error": "user_id обязателен"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT username, is_active FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Пользователь не найден"})

    username, is_active = row
    # Нельзя заблокировать самого себя
    if username == admin[1]:
        cur.close(); conn.close()
        return resp(400, {"error": "Нельзя заблокировать собственный аккаунт"})

    new_active = not is_active
    cur.execute("UPDATE users SET is_active = %s, updated_at = NOW() WHERE id = %s", (new_active, user_id))
    if not new_active:
        # Убиваем все сессии при блокировке
        cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
    conn.commit()
    result = users_list(cur)
    cur.close(); conn.close()

    action = "разблокирован" if new_active else "заблокирован"
    return resp(200, {"ok": True, "message": f"Пользователь «{username}» {action}", "users": result})


# ── УДАЛИТЬ НАВСЕГДА ──────────────────────────────────────────────────────────

def handle_delete_user(body: dict, event: dict) -> dict:
    admin = require_admin(event)
    if not admin:
        return resp(403, {"error": "Доступ запрещён"})

    user_id = body.get("user_id")
    confirm = body.get("confirm", False)

    if not user_id:
        return resp(400, {"error": "user_id обязателен"})
    if not confirm:
        return resp(400, {"error": "Требуется подтверждение: confirm=true"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {"error": "Пользователь не найден"})

    username = row[0]
    if username == admin[1]:
        cur.close(); conn.close()
        return resp(400, {"error": "Нельзя удалить собственный аккаунт"})

    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    result = users_list(cur)
    cur.close(); conn.close()
    return resp(200, {"ok": True, "message": f"Пользователь «{username}» удалён навсегда", "users": result})
