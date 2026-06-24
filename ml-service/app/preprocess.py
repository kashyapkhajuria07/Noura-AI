import re
from typing import List

EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
PHONE_PATTERN = re.compile(r'\b(\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\b')
URL_PATTERN = re.compile(r'https?://\S+|www\.\S+')
IP_PATTERN = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
STUDENT_ID_PATTERN = re.compile(r'\b[Ss]\d{6,8}\b')
CREDIT_CARD_PATTERN = re.compile(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b')


def remove_pii(text: str) -> str:
    text = EMAIL_PATTERN.sub('[EMAIL]', text)
    text = SSN_PATTERN.sub('[SSN]', text)
    text = PHONE_PATTERN.sub('[PHONE]', text)
    text = URL_PATTERN.sub('[URL]', text)
    text = IP_PATTERN.sub('[IP]', text)
    text = STUDENT_ID_PATTERN.sub('[STUDENT_ID]', text)
    text = CREDIT_CARD_PATTERN.sub('[CARD]', text)
    return text


def normalize_whitespace(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def truncate(text: str, max_length: int = 512) -> str:
    words = text.split()
    if len(words) > max_length:
        words = words[:max_length]
    return ' '.join(words)


def preprocess_text(text: str, max_length: int = 512) -> str:
    text = remove_pii(text)
    text = normalize_whitespace(text)
    text = truncate(text, max_length)
    return text


def preprocess_batch(texts: List[str], max_length: int = 512) -> List[str]:
    return [preprocess_text(t, max_length) for t in texts]
