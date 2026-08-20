'use client';

import React, { useState } from 'react';
import { FileCode, Check, Copy, ShieldCheck, Zap } from 'lucide-react';

export function DiffInspectorView() {
  const [copied, setCopied] = useState<boolean>(false);

  const diffLines = [
    { type: 'header', content: '@@ -81,7 +81,16 @@ fn validate_session(req: &HttpRequest) -> Result<Claims, AuthError>' },
    { type: 'context', oldNum: 81, newNum: 81, content: ' pub fn validate_session(req: &HttpRequest) -> Result<Claims, AuthError> {' },
    { type: 'del', oldNum: 82, newNum: '', content: '-    let token = req.headers().get("Authorization")?;' },
    { type: 'del', oldNum: 83, newNum: '', content: '-    if token.starts_with("Bearer ") {' },
    { type: 'del', oldNum: 84, newNum: '', content: '-        let raw = &token[7..];' },
    { type: 'add', oldNum: '', newNum: 82, content: '+    let token = extract_bearer_token(req)?;' },
    { type: 'add', oldNum: '', newNum: 83, content: '+    let claims = token.verify_claims(&KEY_STORE)?;' },
    { type: 'add', oldNum: '', newNum: 84, content: '+    tracing::debug!(' },
    { type: 'add', oldNum: '', newNum: 85, content: '+        target: "auth::session",' },
    { type: 'add', oldNum: '', newNum: 86, content: '+        user_id = %claims.subject,' },
    { type: 'add', oldNum: '', newNum: 87, content: '+        "Session token validated successfully"' },
    { type: 'add', oldNum: '', newNum: 88, content: '+    );' },
    { type: 'add', oldNum: '', newNum: 89, content: '+    Ok(claims)' },
    { type: 'context', oldNum: 85, newNum: 90, content: ' }' },
  ];

  const handleCopy = () => {
    const raw = diffLines.map((l) => l.content).join('\n');
    navigator.clipboard?.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 bg-[#090a0c] font-mono text-xs select-text">
      {/* Diff Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#4a4b50]/40">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-[#5683da]" />
          <div>
            <div className="text-white font-bold text-sm">src/middleware/auth.rs</div>
            <div className="text-[#a9a9aa] text-[11px]">AST Zero-Copy Patch · Synthesized by Claude Code</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#27c93f] font-bold text-xs bg-[#0d2818] border border-[#27c93f]/30 px-2 py-0.5 rounded">
            <ShieldCheck size={12} />
            Verified: 0 Warnings, 0 Errors
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#111111] hover:bg-[#1a1b1e] border border-[#4a4b50] text-white text-xs transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-[#27c93f]" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Diff'}</span>
          </button>
        </div>
      </div>

      {/* Diff Table */}
      <div className="rounded-[8px] bg-[#111111] border border-[#4a4b50] overflow-x-auto">
        <table className="w-full border-collapse text-[11px] leading-relaxed">
          <tbody>
            {diffLines.map((line, idx) => {
              if (line.type === 'header') {
                return (
                  <tr key={idx} className="bg-[#1a1b1e] text-[#5683da] font-bold">
                    <td colSpan={3} className="px-3 py-1 text-[10px]">
                      {line.content}
                    </td>
                  </tr>
                );
              }

              let rowBg = 'bg-[#111111] text-[#d1d1d1]';
              let signColor = 'text-[#6b6c6d]';
              let sign = ' ';

              if (line.type === 'add') {
                rowBg = 'bg-[#0d2818] text-[#86efac] border-l-2 border-[#27c93f]';
                signColor = 'text-[#27c93f] font-bold';
                sign = '+';
              } else if (line.type === 'del') {
                rowBg = 'bg-[#2a0f14] text-[#fca5a5] border-l-2 border-[#ef4444]';
                signColor = 'text-[#ef4444] font-bold';
                sign = '-';
              }

              return (
                <tr key={idx} className={`${rowBg} hover:brightness-110 transition-colors`}>
                  <td className="w-10 px-2 py-0.5 text-right text-[10px] text-[#6b6c6d] select-none">
                    {line.oldNum || ''}
                  </td>
                  <td className="w-10 px-2 py-0.5 text-right text-[10px] text-[#6b6c6d] select-none">
                    {line.newNum || ''}
                  </td>
                  <td className="px-3 py-0.5 whitespace-pre">
                    <span className={`inline-block w-3 ${signColor}`}>{sign}</span>
                    <span>{line.content.replace(/^[+-]/, '')}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
