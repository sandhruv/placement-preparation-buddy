"""PDF resume parsing tool using pdfplumber."""
import pdfplumber


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text content from a PDF file.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Extracted text as a string

    Raises:
        ValueError: If the PDF is empty or cannot be read
        FileNotFoundError: If the file doesn't exist
    """
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        text = text.strip()

        if not text:
            raise ValueError("The PDF appears to be empty or contains only images")

        return text

    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {pdf_path}")
    except Exception as e:
        if "empty" in str(e).lower() or "cannot be read" in str(e).lower():
            raise
        raise ValueError(f"Failed to read PDF: {str(e)}")
