"""Utilities for generating annual report PDFs using ReportLab."""

from io import BytesIO
from typing import Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_pdf_report(department: str, year: str, stats: Dict[str, int], achievements: List[dict]) -> BytesIO:
    """Create a PDF document that summarizes department achievements."""

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # --- 1. Cover Page ---
    title_style = styles["Title"]
    elements.append(Paragraph("Annual Performance Report", title_style))
    elements.append(Spacer(1, 12))

    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=14, alignment=1)
    elements.append(Paragraph(f"Department: {department}", subtitle_style))
    elements.append(Paragraph(f"Academic Year: {year}", subtitle_style))
    elements.append(Spacer(1, 50))

    # --- 2. Executive Summary (Table) ---
    elements.append(Paragraph("Executive Summary", styles["Heading2"]))
    elements.append(Spacer(1, 12))

    data = [
        ["Metric", "Count"],
        ["Total Achievements", stats.get("total", 0)],
        ["Academic", stats.get("academic", 0)],
        ["Research", stats.get("research", 0)],
        ["Sports/Cultural", stats.get("cultural", 0)],
    ]

    summary_table = Table(data, colWidths=[200, 100])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.darkblue),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 40))

    # --- 3. Detailed Achievements List ---
    elements.append(Paragraph("Detailed Approved Achievements", styles["Heading2"]))

    for item in achievements:
        elements.append(Paragraph(f"- {item['title']}", styles["Heading4"]))
        detail_text = (
            f"<b>Category:</b> {item['category']} | "
            f"<b>Date:</b> {item['date']} | "
            f"<b>Student:</b> {item.get('user_name', 'N/A')}"
        )
        elements.append(Paragraph(detail_text, styles["Normal"]))
        description = item.get("description", "")
        preview = description[:200] + ("..." if len(description) > 200 else "")
        elements.append(Paragraph(f"<i>{preview}</i>", styles["Italic"]))
        elements.append(Spacer(1, 10))

    doc.build(elements)
    buffer.seek(0)
    return buffer
