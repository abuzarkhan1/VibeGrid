const fs = require('fs');
let code = fs.readFileSync('src/components/terminal/TerminalPane.tsx', 'utf8');

// Remove the old setTimeout
code = code.replace(/const cmd = currentNode\?\.startupCommand;\s*const targetPtyId = ptyId;\s*if \(cmd && targetPtyId\) {\s*setTimeout\(\(\) => {\s*writeToPty\(targetPtyId, cmd \+ '\\r\\n'\);\s*}, 1500\);\s*}/g, '');

// Inject inside listenTerminalBatch
const listenStr = `unlistenBatch = await listenTerminalBatch((event) => {
          const currentPtyId = ptyPaneIdRef.current;
          if (currentPtyId && event.payload[currentPtyId]) {
            term.write(event.payload[currentPtyId]);
          }
        });`;

const newListenStr = `
        let commandInjected = false;
        unlistenBatch = await listenTerminalBatch((event) => {
          const currentPtyId = ptyPaneIdRef.current;
          if (currentPtyId && event.payload[currentPtyId]) {
            term.write(event.payload[currentPtyId]);

            // Robust startup command injection (FR-012)
            // Wait for the first chunk of data (usually the shell prompt starting)
            // before injecting the command, instead of a blind timeout.
            if (!commandInjected && currentNode?.startupCommand) {
              commandInjected = true;
              setTimeout(() => {
                writeToPty(currentPtyId, currentNode.startupCommand + '\\r\\n');
              }, 400); // short wait after prompt starts rendering
            }
          }
        });`;

code = code.replace(listenStr, newListenStr);
fs.writeFileSync('src/components/terminal/TerminalPane.tsx', code);
