from pathlib import Path

import pdfplumber

SUPPORTED_FORMATS = ("md", "txt", "pdf")
CHARACTERS_PER_PAGE = 1200


class UnsupportedFormatError(ValueError):
    pass


def get_format_from_filename(file_name: str) -> str:
    extension = Path(file_name).suffix.lower().lstrip(".")
    if extension not in SUPPORTED_FORMATS:
        raise UnsupportedFormatError(f"Unsupported file format: {extension}")
    return extension


def parse_text_file(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def parse_pdf_file(file_bytes: bytes) -> str:
    import io

    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def parse_document(file_name: str, file_bytes: bytes) -> tuple[str, str]:
    document_format = get_format_from_filename(file_name)
    if document_format in ("md", "txt"):
        content = parse_text_file(file_bytes)
    elif document_format == "pdf":
        content = parse_pdf_file(file_bytes)
    else:
        raise UnsupportedFormatError(f"Unsupported file format: {document_format}")
    return content, document_format


def split_into_pages(content: str, characters_per_page: int = CHARACTERS_PER_PAGE) -> list[str]:
    if not content:
        return [""]
    pages = [
        content[start:start + characters_per_page]
        for start in range(0, len(content), characters_per_page)
    ]
    return pages


def get_page_content(content: str, page_number: int) -> tuple[str, int]:
    pages = split_into_pages(content)
    total_pages = len(pages)
    clamped_page_number = max(1, min(page_number, total_pages))
    return pages[clamped_page_number - 1], total_pages
