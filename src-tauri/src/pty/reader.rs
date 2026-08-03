use std::io::Read;
use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;
use crate::ipc::IpcBatcher;

pub fn spawn_pty_reader(
    pane_id: String,
    mut reader: Box<dyn Read + Send>,
    batcher: IpcBatcher,
) {
    let bp_flag = batcher.get_backpressure_flag(&pane_id);

    thread::spawn(move || {
        let mut buffer = [0u8; 8192];
        loop {
            // Check backpressure flag; pause reading if buffer limit reached
            if bp_flag.load(Ordering::SeqCst) {
                thread::sleep(Duration::from_millis(10));
                continue;
            }

            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF - process terminated
                    eprintln!("[PtyReader] PTY reader EOF for pane {}", pane_id);
                    break;
                }
                Ok(n) => {
                    batcher.push_output(pane_id.clone(), &buffer[..n]);
                }
                Err(err) => {
                    eprintln!("[PtyReader] Error reading from pane {}: {}", pane_id, err);
                    break;
                }
            }
        }
    });
}
