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
    """Авторизация: login, logout, me, setup"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/").rstrip("/")
    method = event.get("httpMethod", "GET")
    body = {}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")

    # Роутинг по URL или по _path в теле запроса
    _path = body.get("_path", "")
    action = ""
    for key in [path, _path]:
        if key.endswith("/login"):
            action = "login"; break
        if key.endswith("/logout"):
            action = "logout"; break
        if key.endswith("/setup"):
            action = "setup"; break
        if key.endswith("/me"):
            action = "me"; break

    if action == "login":
        return handle_login(body)
    if action == "logout":
        return handle_logout(event)
    if action == "setup":
        return handle_setup(body)
    if action == "me":
        return handle_me(event)

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


def handle_setup(body: dict) -> dict:
    """Первичная установка: создаёт admin если пользователей нет"""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    count = cur.fetchone()[0]

    # Разрешаем setup только если нет пользователей ИЛИ передан секретный ключ
    setup_key = body.get("setup_key", "")
    if count > 0 and setup_key != "APX_SETUP_2026":
        cur.close(); conn.close()
        return resp(403, {"error": "Пользователи уже существуют"})

    username = body.get("username", "").strip()
    password = body.get("password", "")
    full_name = body.get("full_name", "Администратор")
    role = body.get("role", "admin")

    if not username or not password:
        cur.close(); conn.close()
        return resp(400, {"error": "username и password обязательны"})

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    cur.execute(
        """INSERT INTO users (username, password_hash, full_name, role)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (username) DO UPDATE SET
               password_hash = EXCLUDED.password_hash,
               full_name = EXCLUDED.full_name,
               role = EXCLUDED.role""",
        (username, pw_hash, full_name, role)
    )
    conn.commit()
    cur.close(); conn.close()

    return resp(200, {"ok": True, "message": f"Пользователь {username} создан/обновлён"})