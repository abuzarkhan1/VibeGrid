'use client';

import React, { useState, useMemo } from 'react';
import { GitCommit, Copy, Check, X, Split, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { DemoTheme } from './demoThemes';

interface DiffLineItem {
  type: 'context' | 'add' | 'remove';
  lineOld: number | null;
  lineNew: number | null;
  text: string;
}

interface DemoDiffViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: DemoTheme;
  onStageCommit?: () => void;
}

const AUTH_RS_DIFF: DiffLineItem[] = [
  { type: 'context', lineOld: 1, lineNew: 1, text: '//! VibeGrid Autonomous Session & Token Auth Middleware' },
  { type: 'context', lineOld: 2, lineNew: 2, text: 'use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};' },
  { type: 'context', lineOld: 3, lineNew: 3, text: 'use actix_web::{Error, HttpMessage};' },
  { type: 'context', lineOld: 4, lineNew: 4, text: 'use futures_util::future::{ok, LocalBoxFuture, Ready};' },
  { type: 'remove', lineOld: 5, lineNew: null, text: '- pub struct AuthMiddleware { pub allow_anonymous: bool }' },
  { type: 'add', lineOld: null, lineNew: 5, text: '+ pub struct AuthMiddleware {' },
  { type: 'add', lineOld: null, lineNew: 6, text: '+     pub allow_anonymous: bool,' },
  { type: 'add', lineOld: null, lineNew: 7, text: '+     pub rate_limit_rps: u32,' },
  { type: 'add', lineOld: null, lineNew: 8, text: '+     pub pty_token_vault: Arc<PtyTokenVault>,' },
  { type: 'add', lineOld: null, lineNew: 9, text: '+ }' },
  { type: 'context', lineOld: 6, lineNew: 10, text: '' },
  { type: 'remove', lineOld: 7, lineNew: null, text: '- pub async fn verify_token(req: &ServiceRequest) -> Result<Claims, Error> {' },
  { type: 'remove', lineOld: 8, lineNew: null, text: '-     let token = req.headers().get("Authorization").ok_or(Unauthorized)?;' },
  { type: 'remove', lineOld: 9, lineNew: null, text: '-     Claims::decode_insecure(token)' },
  { type: 'remove', lineOld: 10, lineNew: null, text: '- }' },
  { type: 'add', lineOld: null, lineNew: 11, text: '+ pub async fn verify_token(req: &ServiceRequest, vault: &PtyTokenVault) -> Result<Claims, Error> {' },
  { type: 'add', lineOld: null, lineNew: 12, text: '+     let auth_header = req.headers().get("Authorization").ok_or(AuthError::MissingToken)?;' },
  { type: 'add', lineOld: null, lineNew: 13, text: '+     let raw_jwt = auth_header.to_str().map_err(|_| AuthError::InvalidEncoding)?;' },
  { type: 'add', lineOld: null, lineNew: 14, text: '+     let sanitized_token = raw_jwt.trim_start_matches("Bearer ");' },
  { type: 'add', lineOld: null, lineNew: 15, text: '+     ' },
  { type: 'add', lineOld: null, lineNew: 16, text: '+     // Zero-allocation zero-copy Ed25519 signature verification' },
  { type: 'add', lineOld: null, lineNew: 17, text: '+     let claims = vault.verify_ed25519(sanitized_token)?;' },
  { type: 'add', lineOld: null, lineNew: 18, text: '+     if claims.is_expired() {' },
  { type: 'add', lineOld: null, lineNew: 19, text: '+         return Err(AuthError::TokenExpired.into());' },
  { type: 'add', lineOld: null, lineNew: 20, text: '+     }' },
  { type: 'add', lineOld: null, lineNew: 21, text: '+     req.extensions_mut().insert(claims.clone());' },
  { type: 'add', lineOld: null, lineNew: 22, text: '+     Ok(claims)' },
  { type: 'add', lineOld: null, lineNew: 23, text: '+ }' },
  { type: 'context', lineOld: 11, lineNew: 24, text: '' },
  { type: 'remove', lineOld: 12, lineNew: null, text: '- const MAX_RETRY_ATTEMPTS: usize = 1;' },
  { type: 'add', lineOld: null, lineNew: 25, text: '+ const MAX_RETRY_ATTEMPTS: usize = 5; // Resilient IPC bridge' },
  { type: 'context', lineOld: 13, lineNew: 26, text: 'pub const PTY_AUTH_REALM: &str = "vibegrid-local";' },
];

export function DemoDiffViewerDrawer({
  isOpen,
  onClose,
  currentTheme,
  onStageCommit,
}: DemoDiffViewerDrawerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState<boolean>(false);
  const [staged, setStaged] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const raw = AUTH_RS_DIFF.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStage = () => {
    setStaged(true);
    if (onStageCommit) {
      onStageCommit();
    }
    setTimeout(() => {
      onClose();
      setStaged(false);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-diff-viewer-title"
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none font-sans"
      onClick={onClose}
    >
      {/* Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92%] rounded-[12px] border border-[#4a4b50] bg-[#090a0c] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-left font-mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#4a4b50] bg-[#111111] px-5 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#090a0c] border border-[#4a4b50] text-[#5683da]">
              <GitCommit className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 id="demo-diff-viewer-title" className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  src/middleware/auth.rs
                </h2>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#090a0c] border border-[#4a4b50]">
                  <span className="text-[#27c93f] font-semibold">+18</span>
                  <span className="text-[#6b6c6d]">/</span>
                  <span className="text-[#ff5f56] font-semibold">-6</span>
                </span>
              </div>
              <p className="text-[10px] text-[#a9a9aa] truncate">
                Zero-copy Ed25519 token verification & rate limiter
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#090a0c] p-0.5 rounded-lg border border-[#4a4b50]">
              <button
                onClick={() => setViewMode('unified')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-[#5683da] text-white font-bold'
                    : 'text-[#a9a9aa] hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Unified</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                  viewMode === 'split'
                    ? 'bg-[#5683da] text-white font-bold'
                    : 'text-[#a9a9aa] hover:text-white'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Side-by-Side</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-[#4a4b50] bg-[#090a0c] hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
              title="Copy Raw Diff"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#27c93f]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#111111] text-[#a9a9aa] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff Table Body */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 text-[11px] leading-relaxed custom-scrollbar bg-[#090a0c]">
          <div className="rounded-lg border border-[#4a4b50] overflow-hidden bg-[#111111]">
            <table className="w-full border-collapse text-left font-mono">
              <thead>
                <tr className="border-b border-[#4a4b50] bg-[#090a0c] text-[10px] text-[#6b6c6d] uppercase tracking-wider font-semibold">
                  <th className="w-10 py-1 px-2 text-right border-r border-[#4a4b50]/60">Old</th>
                  <th className="w-10 py-1 px-2 text-right border-r border-[#4a4b50]/60">New</th>
                  <th className="w-6 py-1 text-center">+/-</th>
                  <th className="py-1 px-3">Diff Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b50]/30 text-[11px]">
                {AUTH_RS_DIFF.map((line, idx) => {
                  const isAdd = line.type === 'add';
                  const isRemove = line.type === 'remove';

                  let rowBg = 'hover:bg-[#090a0c]/60';
                  let textColor = 'text-[#e5e5e7]';
                  let marker = ' ';

                  if (isAdd) {
                    rowBg = 'bg-[#27c93f]/10 hover:bg-[#27c93f]/15';
                    textColor = 'text-emerald-300 font-medium';
                    marker = '+';
                  } else if (isRemove) {
                    rowBg = 'bg-[#ff5f56]/10 hover:bg-[#ff5f56]/15';
                    textColor = 'text-rose-300 line-through opacity-75';
                    marker = '-';
                  }

                  return (
                    <tr key={idx} className={`${rowBg} transition-colors`}>
                      <td className="w-10 py-0.5 px-2 text-right text-[10px] text-[#6b6c6d] bg-[#090a0c]/40 border-r border-[#4a4b50]/60 select-none">
                        {line.lineOld ?? ''}
                      </td>
                      <td className="w-10 py-0.5 px-2 text-right text-[10px] text-[#6b6c6d] bg-[#090a0c]/40 border-r border-[#4a4b50]/60 select-none">
                        {line.lineNew ?? ''}
                      </td>
                      <td
                        className={`w-6 py-0.5 text-center text-xs font-bold select-none ${
                          isAdd ? 'text-[#27c93f]' : isRemove ? 'text-[#ff5f56]' : 'text-transparent'
                        }`}
                      >
                        {marker}
                      </td>
                      <td className={`py-0.5 px-3 whitespace-pre font-mono ${textColor}`}>
                        {line.text.replace(/^[+-]\s*/, '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#4a4b50] bg-[#111111] px-5 py-2.5 text-[10px] text-[#a9a9aa] shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#27c93f]" />
              Stage Ready · Index Clean
            </span>
            <span className="hidden sm:inline text-[#6b6c6d]">•</span>
            <span className="hidden sm:inline">UTF-8 · LF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStage}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#27c93f] hover:bg-[#20aa35] text-black font-sans font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {staged ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Staged & Committed!</span>
                </>
              ) : (
                <>
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Stage & Commit to Git</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
