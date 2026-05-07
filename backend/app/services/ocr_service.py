"""
NEETHI AI — OCR Service
Tesseract v5 (Kannada + English) with confidence gating.
"""
import logging
import os
from typing import Dict, Any
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
    TESSERACT_AVAILABLE = os.path.exists(settings.TESSERACT_CMD)
except Exception:
    TESSERACT_AVAILABLE = False


class OCRService:
    """OCR processing using Tesseract with Kannada support."""

    def __init__(self):
        self.tesseract_available = TESSERACT_AVAILABLE

    def is_available(self) -> bool:
        return self.tesseract_available

    def extract_text_from_image(self, image_path: str, languages: str = "eng+kan") -> Dict[str, Any]:
        """Extract text from an image using Tesseract OCR."""
        if not self.tesseract_available:
            logger.warning("Tesseract not available. Returning empty OCR result.")
            return {"text": "", "confidence": 0.0, "language": "unknown", "available": False}

        try:
            img = Image.open(image_path)

            # Get detailed OCR data
            ocr_data = pytesseract.image_to_data(img, lang=languages, output_type=pytesseract.Output.DICT)

            # Calculate average confidence (filter out -1 which means no text)
            confidences = [int(c) for c in ocr_data["conf"] if int(c) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Get full text
            text = pytesseract.image_to_string(img, lang=languages).strip()

            # Detect dominant language
            language = self._detect_language(text)

            return {
                "text": text,
                "confidence": round(avg_confidence, 2),
                "language": language,
                "word_count": len([w for w in ocr_data["text"] if w.strip()]),
                "available": True,
            }

        except Exception as e:
            logger.error(f"OCR extraction failed for {image_path}: {e}")
            return {"text": "", "confidence": 0.0, "language": "unknown", "error": str(e), "available": True}

    def _detect_language(self, text: str) -> str:
        """Simple language detection based on Unicode ranges."""
        if not text:
            return "unknown"

        kannada_chars = sum(1 for c in text if '\u0C80' <= c <= '\u0CFF')
        english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
        total = kannada_chars + english_chars

        if total == 0:
            return "unknown"
        if kannada_chars / total > 0.3:
            return "kannada" if kannada_chars > english_chars else "mixed"
        return "english"


ocr_service = OCRService()
