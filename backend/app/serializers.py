from collections.abc import Mapping
from datetime import datetime
from decimal import Decimal


def json_number(value):
    return float(value) if isinstance(value, Decimal) else value


def json_time(value):
    return value.isoformat() if isinstance(value, datetime) else value


def product_json(row: Mapping) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": json_number(row["price"]),
        "stock": row["stock"],
        "category": row["category"],
        "petType": row["pet_type"],
        "ageGroup": row["age_group"],
        "image": row["image_url"],
        "emoji": row["emoji"],
        "featured": bool(row["featured"]),
        "createdAt": json_time(row["created_at"]),
        "updatedAt": json_time(row["updated_at"]),
    }


def order_json(order: Mapping, items: list[Mapping]) -> dict:
    return {
        "id": order["id"],
        "createdAt": json_time(order["created_at"]),
        "status": order["status"],
        "paymentStatus": order["payment_status"],
        "paymentProvider": order["payment_provider"],
        "currency": order["currency"],
        "paidAt": json_time(order["paid_at"]),
        "total": json_number(order["total"]),
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
                "price": json_number(item["unit_price"]),
                "subtotal": json_number(item["subtotal"]),
            }
            for item in items
        ],
    }
