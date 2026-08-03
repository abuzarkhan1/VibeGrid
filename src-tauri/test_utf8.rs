fn main() {
    let mut h = String::from("abcdef");
    let keep = h.len() - 3;
    h.drain(..keep);
    println!("{}", h);
    
    let mut h2 = String::from("a🚀b");
    let keep = h2.len() - 2; // len is 1 + 4 + 1 = 6. keep = 4. Wait, 4 is inside the rocket!
    h2.drain(..keep);
}
