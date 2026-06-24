import pytest
from app.preprocess import (
    remove_pii,
    normalize_whitespace,
    truncate,
    preprocess_text,
    preprocess_batch,
)


class TestRemovePII:
    def test_removes_email(self):
        result = remove_pii("Contact me at student@university.edu")
        assert "[EMAIL]" in result
        assert "student@university.edu" not in result

    def test_removes_ssn(self):
        result = remove_pii("SSN: 123-45-6789")
        assert "[SSN]" in result

    def test_removes_phone(self):
        result = remove_pii("Call 555-123-4567")
        assert "[PHONE]" in result

    def test_removes_url(self):
        result = remove_pii("Visit https://example.com")
        assert "[URL]" in result

    def test_removes_ip(self):
        result = remove_pii("Server at 192.168.1.1")
        assert "[IP]" in result

    def test_removes_student_id(self):
        result = remove_pii("ID: S1234567")
        assert "[STUDENT_ID]" in result

    def test_removes_credit_card(self):
        result = remove_pii("Card: 4111-1111-1111-1111")
        assert "[CARD]" in result

    def test_multiple_pii(self):
        result = remove_pii("user@mail.com ssn 123-45-6789")
        assert "[EMAIL]" in result
        assert "[SSN]" in result

    def test_no_pii_unchanged(self):
        text = "Hello world, this is a test"
        assert remove_pii(text) == text


class TestNormalizeWhitespace:
    def test_collapses_spaces(self):
        assert normalize_whitespace("hello    world") == "hello world"

    def test_collapses_newlines(self):
        assert normalize_whitespace("line1\n\n\nline2") == "line1 line2"

    def test_strips_whitespace(self):
        assert normalize_whitespace("  hello  ") == "hello"

    def test_empty_string(self):
        assert normalize_whitespace("") == ""


class TestTruncate:
    def test_short_text_unchanged(self):
        text = "hello world"
        assert truncate(text, 10) == text

    def test_truncates_long_text(self):
        text = " ".join(["word"] * 20)
        result = truncate(text, 5)
        assert len(result.split()) == 5

    def test_exact_length(self):
        text = " ".join(["word"] * 5)
        assert truncate(text, 5) == text


class TestPreprocessText:
    def test_full_pipeline(self):
        text = "  Student S1234567 is feeling really really stressed!!   "
        result = preprocess_text(text)
        assert "[STUDENT_ID]" in result
        assert result == result.strip()
        assert "  " not in result

    def test_whitespace_pii_order(self):
        text = "  hello   world  "
        result = preprocess_text(text)
        assert result == "hello world"

    def test_empty_text(self):
        assert preprocess_text("") == ""

    def test_only_pii(self):
        result = preprocess_text("test@test.com")
        assert result == "[EMAIL]"


class TestPreprocessBatch:
    def test_batch_processing(self):
        texts = ["hello world", "test@test.com", "  foo  "]
        results = preprocess_batch(texts)
        assert len(results) == 3
        assert results[0] == "hello world"
        assert "[EMAIL]" in results[1]
        assert results[2] == "foo"
