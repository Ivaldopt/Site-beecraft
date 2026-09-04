import csv
import io
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import DB, CurrentUser
from ..models import Sale, SaleItem

router = APIRouter(prefix="/reports", tags=["Relatórios"])


@router.get("/sales.csv")
def sales_csv(db: DB, _: CurrentUser):
    sales = db.scalars(
        select(Sale).options(selectinload(Sale.customer)).order_by(Sale.sold_at.desc())
    ).all()
    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Número", "Data", "Cliente", "Pagamento", "Total", "Custo", "Lucro"])
    for sale in sales:
        writer.writerow(
            [
                sale.number,
                sale.sold_at.isoformat(),
                sale.customer.name if sale.customer else "",
                sale.payment_method.value,
                sale.total,
                sale.total_cost,
                sale.net_profit,
            ]
        )
    data = io.BytesIO(output.getvalue().encode("utf-8"))
    return StreamingResponse(
        data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="vendas.csv"'},
    )


@router.get("/sales/{sale_id}/receipt.pdf")
def sale_receipt(sale_id: uuid.UUID, db: DB, _: CurrentUser):
    sale = db.scalar(
        select(Sale)
        .options(
            selectinload(Sale.customer), selectinload(Sale.items).selectinload(SaleItem.product)
        )
        .where(Sale.id == sale_id)
    )
    if not sale:
        raise HTTPException(404, "Venda não encontrada")
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 25 * mm
    pdf.setTitle(f"Recibo {sale.number}")
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(20 * mm, y, "BeeCraft")
    y -= 10 * mm
    pdf.setFont("Helvetica", 10)
    pdf.drawString(20 * mm, y, f"Recibo / Venda: {sale.number}")
    y -= 6 * mm
    pdf.drawString(20 * mm, y, f"Data: {sale.sold_at:%d/%m/%Y %H:%M}")
    y -= 6 * mm
    pdf.drawString(
        20 * mm, y, f"Cliente: {sale.customer.name if sale.customer else 'Consumidor final'}"
    )
    y -= 12 * mm
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(20 * mm, y, "Produto")
    pdf.drawRightString(width - 55 * mm, y, "Qtd.")
    pdf.drawRightString(width - 20 * mm, y, "Total")
    pdf.setFont("Helvetica", 10)
    for item in sale.items:
        y -= 7 * mm
        pdf.drawString(20 * mm, y, item.product.name[:55])
        pdf.drawRightString(width - 55 * mm, y, str(item.quantity))
        pdf.drawRightString(width - 20 * mm, y, f"{item.unit_price * item.quantity:.2f} EUR")
    y -= 12 * mm
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawRightString(width - 20 * mm, y, f"Total: {sale.total:.2f} EUR")
    y -= 10 * mm
    pdf.setFont("Helvetica", 9)
    pdf.drawString(20 * mm, y, f"Pagamento: {sale.payment_method.value}")
    pdf.drawString(
        20 * mm, 18 * mm, "Documento simples de registo interno. Obrigado pela preferência."
    )
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{sale.number}.pdf"'},
    )
