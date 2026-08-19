//! Centralized UTF-8 boundary and truncation utilities.

/// Return a slice of `s` containing at most `max_bytes` from the tail,
/// safely advancing forward to the next valid UTF-8 character boundary so
/// multi-byte codepoints are never split.
pub fn tail_utf8(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes {
        return s;
    }
    let mut start = s.len() - max_bytes;
    while start < s.len() && !s.is_char_boundary(start) {
        start += 1;
    }
    &s[start..]
}

/// Return the byte index at which to truncate/drain the prefix of `s` so that
/// at most `cap` bytes are retained from the tail, aligned to a valid char boundary.
pub fn tail_drain_count(s: &str, cap: usize) -> usize {
    if s.len() <= cap {
        return 0;
    }
    let mut keep = s.len() - cap;
    while keep < s.len() && !s.is_char_boundary(keep) {
        keep += 1;
    }
    keep
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tail_utf8_ascii() {
        assert_eq!(tail_utf8("hello world", 5), "world");
        assert_eq!(tail_utf8("hello", 10), "hello");
    }

    #[test]
    fn tail_utf8_multibyte() {
        // "🦀" is 4 bytes: [240, 159, 166, 128]
        let s = "abc🦀def";
        // len is 3 + 4 + 3 = 10 bytes
        // max_bytes = 4 -> start index = 6 -> falls inside '🦀' (bytes 3..7) -> advances to 7 -> "def"
        assert_eq!(tail_utf8(s, 4), "def");
        // max_bytes = 7 -> start index = 3 -> char boundary -> "🦀def"
        assert_eq!(tail_utf8(s, 7), "🦀def");
    }

    #[test]
    fn tail_drain_count_multibyte() {
        let s = "abc🦀def";
        assert_eq!(tail_drain_count(s, 4), 7);
        assert_eq!(tail_drain_count(s, 7), 3);
        assert_eq!(tail_drain_count(s, 20), 0);
    }
}
