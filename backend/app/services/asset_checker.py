import io
import logging
from typing import Dict, Any, Tuple, Optional
from PIL import Image
import pytesseract
from sqlalchemy.orm import Session

from app.config import settings
from app.models.base import Brand, KnowledgeItem
from app.services.rules_engine import run_deterministic_checks
from app.services.audit_service import record_audit_event

logger = logging.getLogger("asset_checker")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_DIMENSION = 4096

LIMITATIONS_NOTICE = (
    "OCR text extraction is advisory and screens plain text only. "
    "It does not verify typography, layout, font sizes, colors, or logo artwork. "
    "Human verification remains required."
)


def validate_image(filename: str, content_type: Optional[str], file_bytes: bytes) -> Image.Image:
    # 1. Size check
    if len(file_bytes) > settings.MAX_IMAGE_UPLOAD_BYTES:
        max_mb = settings.MAX_IMAGE_UPLOAD_BYTES // (1024 * 1024)
        raise ValueError(f"Image exceeds maximum upload size of {max_mb}MB.")

    if len(file_bytes) == 0:
        raise ValueError("Image file is empty.")

    # 2. MIME / Extension check
    has_valid_mime = content_type and content_type.lower() in ALLOWED_MIME_TYPES
    lower_filename = filename.lower()
    has_valid_ext = any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)

    if not (has_valid_mime or has_valid_ext):
        raise ValueError(
            f"Unsupported image format '{content_type}'. Supported formats: JPEG, PNG, WebP."
        )

    # 3. Pillow integrity & dimension verification
    try:
        raw_stream = io.BytesIO(file_bytes)
        with Image.open(raw_stream) as verify_img:
            verify_img.verify()
    except Exception as e:
        raise ValueError(f"Corrupt or unreadable image file: {e}")

    # Reopen to get image instance (verify() consumes stream)
    img = Image.open(io.BytesIO(file_bytes))
    width, height = img.size
    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise ValueError(
            f"Image dimensions ({width}x{height}) exceed maximum allowed limit of {MAX_DIMENSION}x{MAX_DIMENSION}."
        )

    return img.convert("RGB")


def extract_ocr_text(img: Image.Image) -> Tuple[str, Optional[float], str]:
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    try:
        # Check text extraction
        text = pytesseract.image_to_string(img)
        cleaned_text = text.strip() if text else ""

        if not cleaned_text:
            return "", 0.0, "no_text_detected"

        # Calculate average confidence if possible
        confidence = None
        try:
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            confs = [
                float(c)
                for c, word in zip(data.get("conf", []), data.get("text", []))
                if word.strip() and float(c) >= 0
            ]
            if confs:
                confidence = round(sum(confs) / len(confs), 1)
        except Exception:
            confidence = None

        return cleaned_text, confidence, "success"

    except (pytesseract.TesseractNotFoundError, FileNotFoundError):
        logger.warning("Tesseract OCR engine is not installed or configured on host.")
        return "", None, "ocr_unavailable"
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        return "", None, "ocr_error"


def inspect_image_asset(
    db: Session,
    brand_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: Optional[str] = None,
) -> Dict[str, Any]:
    # 1. Enforce brand existence
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise ValueError(f"Brand '{brand_id}' not found.")

    # 2. Validate image format, integrity, dimensions
    img = validate_image(filename, content_type, file_bytes)

    # 3. Extract OCR text
    text, confidence, status = extract_ocr_text(img)

    # 4. If text extracted, evaluate deterministic rules for this brand only
    findings = []
    if status == "success" and text:
        active_items = (
            db.query(KnowledgeItem)
            .filter(
                KnowledgeItem.brand_id == brand_id,
                KnowledgeItem.active == True,
            )
            .all()
        )
        findings = run_deterministic_checks(text, active_items)

    # 5. Audit event
    record_audit_event(
        db=db,
        brand_id=brand_id,
        review_id=None,
        event_type="asset_inspected",
        details={
            "filename": filename,
            "status": status,
            "confidence": confidence,
            "findings_count": len(findings),
        },
    )

    return {
        "brand_id": brand_id,
        "filename": filename,
        "extracted_text": text,
        "ocr_confidence": confidence,
        "processing_status": status,
        "findings": findings,
        "limitations": LIMITATIONS_NOTICE,
    }

