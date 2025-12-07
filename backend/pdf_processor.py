from pypdf import PdfReader
import io
import re


def extract_text_from_pdf(pdf_file: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_file))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            lines = extracted.split('\n')
            filtered_lines = []
            for line in lines:
                if line.strip().isdigit():
                    continue
                filtered_lines.append(line)
            
            text += "\n".join(filtered_lines) + "\n"
            
    return text.lower()

def chunk_text(text: str, max_chunk_size: int = 500) -> list[str]:
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?]) +', text)
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_chunk_size:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
            
    if current_chunk:
        chunks.append(current_chunk.strip())
        
    return chunks
