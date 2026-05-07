"""
NEETHI AI — Document Parser
Extracts text from PDFs, DOCX, and images using PyMuPDF, pdfplumber, python-docx, and OCR fallback.
"""
import os
import logging
from typing import Dict, Any
from app.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)


class DocumentParser:
    """Multi-format document text extraction pipeline."""

    async def parse(self, file_path: str) -> Dict[str, Any]:
        """Parse a document and return extracted text + metadata."""
        ext = os.path.splitext(file_path)[1].lower()
        
        parsers = {
            ".pdf": self._parse_pdf,
            ".docx": self._parse_docx,
            ".doc": self._parse_docx,
            ".png": self._parse_image,
            ".jpg": self._parse_image,
            ".jpeg": self._parse_image,
            ".tiff": self._parse_image,
            ".bmp": self._parse_image,
        }

        parser_fn = parsers.get(ext, self._parse_unknown)
        result = await parser_fn(file_path)
        result["file_extension"] = ext
        result["file_size"] = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        return result

    async def _parse_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract text from PDF using PyMuPDF with pdfplumber fallback for tables."""
        text = ""
        confidence = 1.0
        language = "english"
        method = "pymupdf"

        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            pages_text = []
            for page in doc:
                page_text = page.get_text()
                pages_text.append(page_text)
            doc.close()
            text = "\n\n".join(pages_text).strip()
        except Exception as e:
            logger.error(f"PyMuPDF failed for {file_path}: {e}")

        # If PyMuPDF got little/no text, try pdfplumber (handles some scanned layouts better)
        if len(text) < 100:
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    pages_text = []
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        pages_text.append(page_text)
                    plumber_text = "\n\n".join(pages_text).strip()
                    if len(plumber_text) > len(text):
                        text = plumber_text
                        method = "pdfplumber"
            except Exception as e:
                logger.error(f"pdfplumber failed for {file_path}: {e}")

        # If still no text, likely a scanned PDF — OCR it
        if len(text) < 50 and ocr_service.is_available():
            try:
                import fitz
                doc = fitz.open(file_path)
                ocr_texts = []
                for i, page in enumerate(doc):
                    pix = page.get_pixmap(dpi=300)
                    img_path = file_path + f"_page_{i}.png"
                    pix.save(img_path)
                    ocr_result = ocr_service.extract_text_from_image(img_path)
                    ocr_texts.append(ocr_result["text"])
                    confidence = min(confidence, ocr_result["confidence"])
                    if ocr_result["language"] == "kannada":
                        language = "kannada"
                    elif ocr_result["language"] == "mixed":
                        language = "mixed"
                    # Cleanup temp image
                    try:
                        os.remove(img_path)
                    except OSError:
                        pass
                doc.close()
                text = "\n\n".join(ocr_texts).strip()
                method = "ocr"
                confidence = confidence / 100.0 if confidence > 1 else confidence
            except Exception as e:
                logger.error(f"OCR fallback failed for {file_path}: {e}")
                confidence = 0.0
                method = "failed"

        # Detect language from extracted text
        if method != "ocr":
            language = ocr_service._detect_language(text)

        return {
            "text": text,
            "confidence": round(confidence, 2),
            "language": language,
            "method": method,
            "page_count": self._count_pdf_pages(file_path),
        }

    def _count_pdf_pages(self, file_path: str) -> int:
        try:
            import fitz
            doc = fitz.open(file_path)
            count = len(doc)
            doc.close()
            return count
        except Exception:
            return 0

    async def _parse_docx(self, file_path: str) -> Dict[str, Any]:
        """Extract text from DOCX files."""
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text = "\n".join(paragraphs)
            language = ocr_service._detect_language(text)
            return {"text": text, "confidence": 1.0, "language": language, "method": "python-docx", "page_count": 0}
        except Exception as e:
            logger.error(f"DOCX parsing failed for {file_path}: {e}")
            return {"text": "", "confidence": 0.0, "language": "unknown", "method": "failed", "page_count": 0}

    async def _parse_image(self, file_path: str) -> Dict[str, Any]:
        """Extract text from images using OCR."""
        if not ocr_service.is_available():
            return {"text": "", "confidence": 0.0, "language": "unknown", "method": "ocr_unavailable", "page_count": 1}
        
        result = ocr_service.extract_text_from_image(file_path)
        return {
            "text": result["text"],
            "confidence": result["confidence"] / 100.0 if result["confidence"] > 1 else result["confidence"],
            "language": result["language"],
            "method": "tesseract_ocr",
            "page_count": 1,
        }

    async def _parse_unknown(self, file_path: str) -> Dict[str, Any]:
        """Attempt to read as plain text."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            return {"text": text, "confidence": 0.5, "language": ocr_service._detect_language(text), "method": "plaintext", "page_count": 0}
        except Exception:
            return {"text": "", "confidence": 0.0, "language": "unknown", "method": "failed", "page_count": 0}


document_parser = DocumentParser()
