import base64
import binascii
import hmac
import os
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, g, jsonify, request, send_from_directory, session
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "instance" / "pap.db"
UPLOAD_DIR = BASE_DIR / "uploads" / "products"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
IS_PRODUCTION = os.environ.get("PAP_ENV", "development").lower() == "production"
PET_THEME_INIT = """<style id="pet-theme-guard">html{visibility:hidden}</style><script>(function(){try{var m=localStorage.getItem('pap-mode')||sessionStorage.getItem('pap-mode');if(['cat','dog','both'].includes(m))document.documentElement.dataset.pet=m}catch(e){}addEventListener('DOMContentLoaded',function(){var g=document.getElementById('pet-theme-guard');if(g)g.remove()},{once:true})})();</script>"""

if IS_PRODUCTION and not os.environ.get("PAP_SECRET_KEY"):
    raise RuntimeError("PAP_SECRET_KEY is required in production")
if IS_PRODUCTION and not os.environ.get("PAP_ADMIN_PASSWORD"):
    raise RuntimeError("PAP_ADMIN_PASSWORD is required in production")

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.config.update(
    SECRET_KEY=os.environ.get("PAP_SECRET_KEY", "pap-development-secret-change-me"),
    MAX_CONTENT_LENGTH=20 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
)


SEED_PRODUCTS = [
    (1, "Cloud Nap Bed", "เตียงนุ่มทรงก้อนเมฆ รองรับสรีระและช่วยให้แมวสายงีบพักผ่อนได้สบายตลอดวัน", 890, 18, "Beds", "cat", "all", "", "☁️", 1),
    (2, "Zoomie Ball", "ลูกบอลเด้งสนุกสำหรับสุนัข ช่วยปล่อยพลังและฝึกการคาบกลับระหว่างเล่น", 290, 32, "Toys", "dog", "young", "", "🎾", 1),
    (3, "Twin Treat Box", "กล่องขนมรวมรสที่คัดสูตรสำหรับแบ่งความอร่อยให้ทั้งสุนัขและแมวในบ้าน", 450, 14, "Treats", "both", "adult", "", "🎁", 1),
    (4, "Moon Cat Wand", "ไม้ตกแมวประกายจันทร์ ช่วยกระตุ้นสัญชาตญาณการล่าและการออกกำลังกาย", 220, 0, "Toys", "cat", "young", "", "🌙", 0),
    (5, "Adventure Leash", "สายจูงแข็งแรงสีสด จับถนัดมือ เหมาะกับสุนัขที่พร้อมออกเดินทางทุกวัน", 590, 21, "Accessories", "dog", "adult", "", "🦮", 1),
    (6, "Pawfect Bowl", "ชามอาหารฐานกันลื่น ทำความสะอาดง่าย ใช้ได้กับทั้งสุนัขและแมว", 390, 27, "Accessories", "both", "senior", "", "🥣", 0),
]


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def get_db():
    if "db" not in g:
        DATABASE.parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    db = get_db()
    db.executescript((BASE_DIR / "schema.sql").read_text(encoding="utf-8"))
    product_columns = {row["name"] for row in db.execute("PRAGMA table_info(products)")}
    if "age_group" not in product_columns:
        db.execute("ALTER TABLE products ADD COLUMN age_group TEXT NOT NULL DEFAULT 'all'")
        if "age" in product_columns:
            db.execute("UPDATE products SET age_group = age WHERE age IN ('all','young','adult','senior')")
        db.commit()
    if db.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        now = utc_now()
        db.executemany(
            """INSERT INTO products
               (id,name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            [(*product, now, now) for product in SEED_PRODUCTS],
        )
        db.commit()


def product_json(row):
    return {
        "id": row["id"], "name": row["name"], "description": row["description"],
        "price": row["price"], "stock": row["stock"], "category": row["category"],
        "petType": row["pet_type"], "ageGroup": row["age_group"], "image": row["image_url"],
        "emoji": row["emoji"], "featured": bool(row["featured"]),
        "createdAt": row["created_at"], "updatedAt": row["updated_at"],
    }


def admin_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if not session.get("admin_authenticated"):
            return jsonify(error="Admin authentication required"), 401
        return handler(*args, **kwargs)
    return wrapped


def customer_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if not session.get("customer"):
            return jsonify(error="Customer login required"), 401
        return handler(*args, **kwargs)
    return wrapped


def save_upload(file_storage):
    if not file_storage or not file_storage.filename:
        return ""
    filename = secure_filename(file_storage.filename)
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Image must be PNG, JPEG, or WebP")
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    file_storage.save(UPLOAD_DIR / unique_name)
    return f"/uploads/products/{unique_name}"


def delete_upload(image_url):
    prefix = "/uploads/products/"
    if image_url and image_url.startswith(prefix):
        path = UPLOAD_DIR / Path(image_url).name
        if path.is_file():
            try:
                path.unlink()
            except OSError:
                # Windows can briefly lock a file while it is being served.
                pass


def product_payload(existing=None):
    source = request.form
    required = ("name", "description", "price", "stock", "category", "petType")
    if any(source.get(field) in (None, "") for field in required):
        raise ValueError("Missing required product fields")
    pet_type = source["petType"]
    if pet_type not in {"cat", "dog", "both"}:
        raise ValueError("Invalid pet type")
    age_group = source.get("ageGroup") or (existing["age_group"] if existing else "all")
    if age_group not in {"all", "young", "adult", "senior"}:
        raise ValueError("Invalid age group")
    price = float(source["price"])
    stock = int(source["stock"])
    if price < 0 or stock < 0:
        raise ValueError("Price and stock cannot be negative")
    image_url = existing["image_url"] if existing else ""
    uploaded = request.files.get("image")
    if uploaded and uploaded.filename:
        new_url = save_upload(uploaded)
        if existing:
            delete_upload(existing["image_url"])
        image_url = new_url
    return {
        "name": source["name"].strip(), "description": source["description"].strip(),
        "price": price, "stock": stock, "category": source["category"].strip(),
        "pet_type": pet_type, "age_group": age_group, "image_url": image_url,
        "emoji": source.get("emoji", "🐾"), "featured": 1 if source.get("featured") in {"true", "on", "1"} else 0,
    }


@app.after_request
def no_api_cache(response):
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    elif response.mimetype == "text/html":
        response.direct_passthrough = False
        html = response.get_data(as_text=True)
        if "<head>" in html:
            response.set_data(html.replace("<head>", f"<head>{PET_THEME_INIT}", 1))
    return response


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/products")
def list_products():
    rows = get_db().execute("SELECT * FROM products ORDER BY id").fetchall()
    return jsonify([product_json(row) for row in rows])


@app.get("/api/products/<int:product_id>")
def get_product(product_id):
    row = get_db().execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    return (jsonify(product_json(row)), 200) if row else (jsonify(error="Product not found"), 404)


@app.post("/api/products")
@admin_required
def create_product():
    try:
        data = product_payload()
    except (ValueError, TypeError) as error:
        return jsonify(error=str(error)), 400
    now = utc_now(); db = get_db()
    cursor = db.execute(
        """INSERT INTO products (name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at)
           VALUES (:name,:description,:price,:stock,:category,:pet_type,:age_group,:image_url,:emoji,:featured,:created_at,:updated_at)""",
        {**data, "created_at": now, "updated_at": now},
    )
    db.commit(); row = db.execute("SELECT * FROM products WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(product_json(row)), 201


@app.put("/api/products/<int:product_id>")
@admin_required
def update_product(product_id):
    db = get_db(); existing = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not existing:
        return jsonify(error="Product not found"), 404
    try:
        data = product_payload(existing)
    except (ValueError, TypeError) as error:
        return jsonify(error=str(error)), 400
    db.execute(
        """UPDATE products SET name=:name,description=:description,price=:price,stock=:stock,category=:category,
           pet_type=:pet_type,age_group=:age_group,image_url=:image_url,emoji=:emoji,featured=:featured,updated_at=:updated_at WHERE id=:id""",
        {**data, "updated_at": utc_now(), "id": product_id},
    )
    db.commit(); return jsonify(product_json(db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()))


@app.delete("/api/products/<int:product_id>")
@admin_required
def delete_product(product_id):
    db = get_db(); row = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not row:
        return jsonify(error="Product not found"), 404
    db.execute("DELETE FROM products WHERE id = ?", (product_id,)); db.commit(); delete_upload(row["image_url"])
    return "", 204


@app.post("/api/customer/login")
def customer_login():
    data = request.get_json(silent=True) or {}; name = str(data.get("name", "")).strip(); email = str(data.get("email", "")).strip()
    if not name or "@" not in email:
        return jsonify(error="Name and valid email are required"), 400
    session["customer"] = {"name": name, "email": email}; return jsonify(customer=session["customer"])


@app.post("/api/customer/logout")
def customer_logout():
    session.pop("customer", None); return "", 204


@app.get("/api/customer/session")
def customer_session():
    return jsonify(customer=session.get("customer"))


def order_json(order, items):
    return {
        "id": order["id"], "createdAt": order["created_at"], "status": order["status"], "total": order["total"],
        "customer": {"fullName": order["customer_name"], "email": order["customer_email"], "phone": order["phone"], "address": order["address"], "district": order["district"], "province": order["province"], "postalCode": order["postal_code"]},
        "items": [{"productId": item["product_id"], "name": item["product_name"], "qty": item["quantity"], "price": item["unit_price"], "subtotal": item["subtotal"]} for item in items],
    }


@app.post("/api/orders")
@customer_required
def create_order():
    data = request.get_json(silent=True) or {}; shipping = data.get("shipping") or {}; cart = data.get("items") or []
    required = ("fullName", "phone", "email", "address", "district", "province", "postalCode")
    if not cart or any(not str(shipping.get(field, "")).strip() for field in required):
        return jsonify(error="Cart and complete shipping address are required"), 400
    customer = session["customer"]
    if shipping["email"].strip().lower() != customer["email"].lower():
        return jsonify(error="Shipping email must match the logged-in customer"), 400
    db = get_db()
    try:
        db.execute("BEGIN IMMEDIATE")
        validated = []
        for item in cart:
            product_id = int(item.get("productId")); quantity = int(item.get("quantity"))
            if quantity <= 0:
                raise ValueError("Invalid quantity")
            product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
            if not product or product["stock"] < quantity:
                raise ValueError(f"Not enough stock for {product['name'] if product else 'a product'}")
            validated.append((product, quantity))
        order_id = f"PAP-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6].upper()}"
        total = sum(product["price"] * quantity for product, quantity in validated); created_at = utc_now()
        db.execute(
            """INSERT INTO orders (id,customer_name,customer_email,phone,address,district,province,postal_code,total,status,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,'New',?)""",
            (order_id, shipping["fullName"], shipping["email"], shipping["phone"], shipping["address"], shipping["district"], shipping["province"], shipping["postalCode"], total, created_at),
        )
        for product, quantity in validated:
            subtotal = product["price"] * quantity
            db.execute("INSERT INTO order_items (order_id,product_id,product_name,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)", (order_id, product["id"], product["name"], quantity, product["price"], subtotal))
            db.execute("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?", (quantity, created_at, product["id"]))
        db.commit()
    except (ValueError, TypeError, KeyError) as error:
        db.rollback(); return jsonify(error=str(error)), 409
    order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone(); items = db.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,)).fetchall()
    return jsonify(order_json(order, items)), 201


@app.get("/api/customer/orders")
@customer_required
def customer_orders():
    email = session["customer"]["email"]
    orders = get_db().execute("SELECT * FROM orders WHERE lower(customer_email) = lower(?) ORDER BY created_at DESC", (email,)).fetchall()
    return jsonify([order_json(order, get_db().execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],)).fetchall()) for order in orders])


@app.post("/api/admin/login")
def admin_login():
    supplied = str((request.get_json(silent=True) or {}).get("code", "")); expected = os.environ.get("PAP_ADMIN_PASSWORD", "PAP2026")
    if not hmac.compare_digest(supplied, expected):
        return jsonify(error="Invalid code"), 401
    session["admin_authenticated"] = True; return jsonify(authenticated=True)


@app.post("/api/admin/logout")
def admin_logout():
    session.pop("admin_authenticated", None); return "", 204


@app.get("/api/admin/session")
def admin_session():
    return jsonify(authenticated=bool(session.get("admin_authenticated")))


@app.get("/api/admin/orders")
@admin_required
def admin_orders():
    orders = get_db().execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    return jsonify([order_json(order, get_db().execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],)).fetchall()) for order in orders])


def decode_legacy_image(data_uri):
    if not data_uri or not data_uri.startswith("data:image/"):
        return data_uri if str(data_uri).startswith("/uploads/") else ""
    header, encoded = data_uri.split(",", 1); subtype = header.split(";")[0].split("/")[1].lower(); extension = "jpg" if subtype == "jpeg" else subtype
    if extension not in ALLOWED_EXTENSIONS:
        return ""
    try:
        payload = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        return ""
    if len(payload) > 2 * 1024 * 1024:
        return ""
    filename = f"legacy-{uuid.uuid4().hex}.{extension}"; (UPLOAD_DIR / filename).write_bytes(payload)
    return f"/uploads/products/{filename}"


@app.post("/api/admin/migrate")
@admin_required
def migrate_legacy():
    db = get_db()
    if db.execute("SELECT value FROM settings WHERE key = 'legacy_migrated'").fetchone():
        return jsonify(migrated=False, reason="already_migrated")
    products = (request.get_json(silent=True) or {}).get("products") or []
    now = utc_now(); migrated = 0
    for product in products:
        if not product.get("name"):
            continue
        if product.get("age") not in {"all", "young", "adult", "senior"}:
            product["age"] = "all"
        image_url = decode_legacy_image(product.get("image", "")); product_id = int(product.get("id") or 0) or None
        values = (product["name"], product.get("description", ""), max(0, float(product.get("price", 0))), max(0, int(product.get("stock", 0))), product.get("category") or "Other", product.get("petType") if product.get("petType") in {"cat","dog","both"} else "both", product.get("age", "all"), image_url, product.get("emoji", "🐾"), 1 if product.get("featured") else 0, now, now)
        if product_id:
            db.execute("""INSERT INTO products (id,name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                          ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,price=excluded.price,stock=excluded.stock,category=excluded.category,pet_type=excluded.pet_type,age_group=excluded.age_group,image_url=excluded.image_url,emoji=excluded.emoji,featured=excluded.featured,updated_at=excluded.updated_at""", (product_id, *values))
        else:
            db.execute("INSERT INTO products (name,description,price,stock,category,pet_type,age_group,image_url,emoji,featured,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", values)
        migrated += 1
    db.execute("INSERT INTO settings (key,value) VALUES ('legacy_migrated',?)", (now,)); db.commit()
    return jsonify(migrated=True, count=migrated)


@app.errorhandler(413)
def too_large(_error):
    return jsonify(error="Upload is too large"), 413


with app.app_context():
    init_db()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PAP_PORT", "4173")), debug=False)
