import sqlite3


def product_json(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "stock": row["stock"],
        "category": row["category"],
        "petType": row["pet_type"],
        "ageGroup": row["age_group"],
        "image": row["image_url"],
        "emoji": row["emoji"],
        "featured": bool(row["featured"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def order_json(order: sqlite3.Row, items: list[sqlite3.Row]) -> dict:
    return {
        "id": order["id"],
        "createdAt": order["created_at"],
        "status": order["status"],
        "total": order["total"],
        "customer": {
            "fullName": order["customer_name"],
            "email": order["customer_email"],
            "phone": order["phone"],
            "address": order["address"],
            "district": order["district"],
            "province": order["province"],
            "postalCode": order["postal_code"],
        },
        "items": [
            {
                "productId": item["product_id"],
                "name": item["product_name"],
                "qty": item["quantity"],
                "price": item["unit_price"],
                "subtotal": item["subtotal"],
            }
            for item in items
        ],
    }
