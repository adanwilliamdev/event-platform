"""Geração de QR Code para ingressos (equivalente ao QRCodeGenerator.java)."""
import base64
from io import BytesIO

import qrcode


def generate_qr_code_base64(data: str) -> str:
    img = qrcode.make(data, box_size=8, border=2)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
