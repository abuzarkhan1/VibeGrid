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

        let s = "abc🦀def";

        assert_eq!(tail_utf8(s, 4), "def");

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
