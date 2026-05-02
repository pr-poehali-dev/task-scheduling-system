"""
Авторизация МБУ АПХ Абакан.
POST /login  — вход (username, password) → token
POST /logout — выход (token)
GET  /me     — проверка сессии (X-Auth-Token)
POST /setup  — первичная установка пароля администратора (только если нет пользователей)
"""
import json
import os
import secrets
import bcrypt
import psycopg2


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Авторизация: login, logout, me. Создание пользователей — только через Admin-панель."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    body = {}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")

    _path = body.get("_path", "")
    action = ""
    for key in [path, _path]:
        if key.endswith("/login"):
            action = "login"; break
        if key.endswith("/logout"):
            action = "logout"; break
        if key.endswith("/me"):
            action = "me"; break
        if key.endswith("/create-user"):
            action = "create_user"; break
        if key.endswith("/users"):
            action = "list_users"; break

    if action == "login":
        return handle_login(body)
    if action == "logout":
        return handle_logout(event)
    if action == "me":
        return handle_me(event)
    if action == "create_user":
        return handle_create_user(body, event)
    if action == "list_users":
        return handle_list_users(event)

    return resp(404, {"error": "not found"})


def handle_login(body: dict) -> dict:
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return resp(400, {"error": "Введите логин и пароль"})

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, password_hash, full_name, role, is_active FROM users WHERE username = %s",
        (username,)
    )
    row = cur.fetchone()

    if not row:
        cur.close(); conn.close()
        return resp(401, {"error": "Неверный логин или пароль"})

    user_id, pw_hash, full_name, role, is_active = row

    if not is_active:
        cur.close(); conn.close()
        return resp(403, {"error": "Аккаунт заблокирован"})

    if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
        cur.close(); conn.close()
        return resp(401, {"error": "Неверный логин или пароль"})

    # Создаём сессию
    token = secrets.token_hex(32)
    cur.execute(
        "INSERT INTO sessions (token, user_id, username, role) VALUES (%s, %s, %s, %s)",
        (token, user_id, username, role)
    )
    conn.commit()
    cur.close(); conn.close()

    return resp(200, {
        "ok": True,
        "token": token,
        "username": username,
        "full_name": full_name or username,
        "role": role,
    })


def handle_logout(event: dict) -> dict:
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if not token:
        return resp(200, {"ok": True})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
    conn.commit()
    cur.close(); conn.close()

    return resp(200, {"ok": True})


def handle_me(event: dict) -> dict:
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if not token:
        return resp(401, {"error": "Нет токена"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT username, role FROM sessions WHERE token = %s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        return resp(401, {"error": "Сессия истекла"})

    return resp(200, {"ok": True, "username": row[0], "role": row[1]})


def get_token_role(event: dict) -> str | None:
    """Возвращает роль по токену из заголовка, или None если токен недействителен"""
    token = (event.get("headers") or {}).get("X-Auth-Token", "")
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT role FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    cur.close(); conn.close()
    return row[0] if row else None


def handle_create_user(body: dict, event: dict) -> dict:
    """Создание/обновление пользователя — только для администратора"""
    role = get_token_role(event)
    if role != "admin":
        return resp(403, {"error": "Доступ запрещён. Только администратор может создавать пользователей."})

    username = body.get("username", "").strip()
    password = body.get("password", "")
    full_name = body.get("full_name", "").strip()
    new_role = body.get("role", "user")

    if not username or not password:
        return resp(400, {"error": "Логин и пароль обязательны"})
    if len(password) < 6:
        return resp(400, {"error": "Пароль должен быть не менее 6 символов"})

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO users (username, password_hash, full_name, role)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (username) DO UPDATE SET
               password_hash = EXCLUDED.password_hash,
               full_name = EXCLUDED.full_name,
               role = EXCLUDED.role,
               updated_at = NOW()""",
        (username, pw_hash, full_name or username, new_role)
    )
    conn.commit()

    # Список всех пользователей для ответа
    cur.execute("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at")
    rows = cur.fetchall()
    cur.close(); conn.close()

    users = [{"id": r[0], "username": r[1], "full_name": r[2], "role": r[3], "is_active": r[4]} for r in rows]
    return resp(200, {"ok": True, "message": f"Пользователь «{username}» создан", "users": users})


def handle_list_users(event: dict) -> dict:
    """Список пользователей — только для администратора"""
    role = get_token_role(event)
    if role != "admin":
        return resp(403, {"error": "Доступ запрещён"})

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at")
    rows = cur.fetchall()
    cur.close(); conn.close()

    users = [{"id": r[0], "username": r[1], "full_name": r[2], "role": r[3], "is_active": r[4]} for r in rows]
    return resp(200, users)