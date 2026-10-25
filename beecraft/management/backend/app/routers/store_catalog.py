import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from ..config import get_settings
from ..deps import CurrentUser, Owner

router = APIRouter(prefix="/store-catalog", tags=["Catálogo da loja"])

def connection():
    settings = get_settings()
    if not settings.store_admin_key:
        raise HTTPException(503, "Defina STORE_ADMIN_KEY no ambiente do ADM")
    return settings, {"x-admin-key": settings.store_admin_key}

async def relay(method: str, path: str, **kwargs):
    settings, headers = connection()
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(method, f"{settings.store_api_url}{path}", headers=headers, **kwargs)
    if response.is_error:
        try: detail = response.json().get("message", response.text)
        except ValueError: detail = response.text
        raise HTTPException(response.status_code, detail)
    return response.json() if response.content else None

@router.get("/products")
async def products(_: CurrentUser): return await relay("GET", "/products/admin/all")

@router.get("/categories")
async def categories(_: CurrentUser):
    settings, _ = connection()
    async with httpx.AsyncClient(timeout=15) as client: response = await client.get(f"{settings.store_api_url}/categories")
    if response.is_error: raise HTTPException(response.status_code, "Não foi possível carregar as categorias")
    return response.json()

@router.get("/categories/admin")
async def admin_categories(_: CurrentUser): return await relay("GET", "/categories/admin/all")

@router.post("/categories")
async def create_category(payload: dict, _: Owner): return await relay("POST", "/categories/admin", json=payload)

@router.patch("/categories/{category_id}")
async def update_category(category_id: str, payload: dict, _: Owner): return await relay("PATCH", f"/categories/admin/{category_id}", json=payload)

@router.post("/products")
async def create_product(payload: dict, _: Owner): return await relay("POST", "/products/admin", json=payload)

@router.patch("/products/{product_id}")
async def update_product(product_id: str, payload: dict, _: Owner): return await relay("PATCH", f"/products/admin/{product_id}", json=payload)

@router.delete("/products/{product_id}")
async def archive_product(product_id: str, _: Owner): return await relay("DELETE", f"/products/admin/{product_id}")

@router.post("/products/{product_id}/images")
async def upload_images(product_id: str, _: Owner, files: list[UploadFile] = File(...)):
    uploads = [("files", (file.filename, await file.read(), file.content_type)) for file in files]
    return await relay("POST", f"/uploads/products/{product_id}", files=uploads)

@router.delete("/images/{image_id}")
async def delete_image(image_id: str, _: Owner): return await relay("DELETE", f"/uploads/{image_id}")

@router.get("/event-orders")
async def event_orders(_: CurrentUser): return await relay("GET", "/event-orders/admin/all")

@router.patch("/event-orders/{order_id}/status")
async def update_event_order(order_id: str, payload: dict, _: CurrentUser):
    return await relay("PATCH", f"/event-orders/admin/{order_id}/status", json=payload)
