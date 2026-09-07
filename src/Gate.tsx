/**
 * Gate.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 접근 암호 화면. 올바른 암호를 입력해야 내부 프로그램(children)이 보인다.
 *
 *  · 암호는 평문이 아니라 SHA-256 해시로만 코드에 담긴다 (ACCESS_HASH).
 *  · 로그인 상태는 sessionStorage에 저장 → 탭을 닫기 전까지 유지, 새로고침해도 통과.
 *  · 정적 사이트 특성상 "절대적인" 접근 차단은 불가능하지만(브라우저에서 코드가 실행되므로),
 *    공유 암호를 모르는 사람은 들어올 수 없어 일반적인 무단 접근은 충분히 막는다.
 *    더 강한 보안이 필요하면 Vercel Password Protection(유료) 또는 별도 인증 서버가 필요하다.
 *
 *  ▸ 암호 변경 방법: 아래 setup 스크립트로 새 해시를 만들어 ACCESS_HASH만 교체.
 *      node -e "crypto.subtle.digest('SHA-256',new TextEncoder().encode('새암호')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
 *    (또는 온라인 SHA-256 도구 사용). 외부용 암호는 'prain2610!' 입니다.
 */
import React, { useEffect, useMemo, useState } from 'react';

/** 접근 암호의 SHA-256 해시. 외부용 암호: prain2610! */
export const ACCESS_HASH = '246d21aca19e9059afd3687855f10ed7509cc2f2fc1a6c71812044a9812e497d';

const SESSION_KEY = 'cr-estimate-auth-ext';

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const CSS = `
  .gate { --ink:#1F2A37; --sub:#5B6B7C; --line:#E2D9D3; --paper:#FFFFFF; --bg:#F6F4F2;
          --accent:#F15C21; --accent-strong:#D64A14; --bad:#B42318;
          font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
          position:fixed; inset:0; background:var(--bg); display:flex; align-items:center; justify-content:center; padding:20px; }
  .gate * { box-sizing:border-box; }
  .gate-card { width:100%; max-width:360px; background:var(--paper); border:1px solid var(--line);
               border-radius:14px; padding:28px 24px; box-shadow:0 12px 40px rgba(31,42,55,.10); }
  .gate-bar { height:4px; background:var(--accent); border-radius:2px; margin:-28px -24px 20px; border-top-left-radius:14px; border-top-right-radius:14px; }
  .gate h1 { font-size:18px; margin:0 0 4px; color:var(--ink); }
  .gate h1 b { color:var(--accent); }
  .gate p { margin:0 0 18px; color:var(--sub); font-size:13px; line-height:1.5; }
  .gate label { display:block; font-size:12px; color:var(--sub); margin-bottom:6px; }
  .gate input { width:100%; border:1px solid var(--line); border-radius:8px; padding:11px 12px; font-size:15px; background:#fff; color:var(--ink); }
  .gate input:focus { outline:2px solid var(--accent); outline-offset:1px; }
  .gate button { width:100%; margin-top:14px; border:1px solid var(--accent-strong); background:var(--accent); color:#fff;
                 font-weight:600; font-size:15px; border-radius:8px; padding:11px 12px; cursor:pointer; }
  .gate button:hover:not(:disabled) { background:var(--accent-strong); }
  .gate button:disabled { opacity:.6; cursor:default; }
  .gate-err { margin-top:12px; color:var(--bad); font-size:13px; min-height:18px; }
  .gate-foot { margin-top:16px; color:var(--sub); font-size:11px; text-align:center; }
`;

export interface GateProps {
  children: React.ReactNode;
  /** 이 해시와 일치하는 암호만 통과 (기본: ACCESS_HASH) */
  accessHash?: string;
  title?: string;
}

export default function Gate({ children, accessHash = ACCESS_HASH, title = '디자인 견적 및 리소스 산출' }: GateProps) {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === accessHash;
    } catch {
      return false;
    }
  });
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // 접근 해시가 바뀌면(암호 교체 후 재배포) 기존 세션 무효화
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) && sessionStorage.getItem(SESSION_KEY) !== accessHash) {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
      }
    } catch {
      /* sessionStorage 사용 불가 환경 무시 */
    }
  }, [accessHash]);

  const styleTag = useMemo(() => <style>{CSS}</style>, []);

  if (authed) return <>{children}</>;

  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setErr('');
    try {
      const hash = await sha256Hex(pw);
      if (hash === accessHash) {
        try {
          sessionStorage.setItem(SESSION_KEY, accessHash);
        } catch {
          /* 저장 실패해도 이번 세션은 통과 */
        }
        setAuthed(true);
      } else {
        setErr('암호가 올바르지 않습니다.');
        setPw('');
      }
    } catch {
      setErr('이 브라우저에서는 보안 기능(Web Crypto)을 사용할 수 없습니다. HTTPS로 접속했는지 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      {styleTag}
      <div className="gate-card">
        <div className="gate-bar" />
        <h1>
          <b>{title}</b>
        </h1>
        <p>접근 권한이 있는 사용자만 이용할 수 있습니다. 발급받은 접근 암호를 입력해 주세요.</p>
        <label htmlFor="gate-pw">접근 암호</label>
        <input
          id="gate-pw"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={pw}
          placeholder="암호 입력"
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button type="button" onClick={submit} disabled={busy || !pw}>
          {busy ? '확인 중…' : '입장'}
        </button>
        <div className="gate-err" role="alert">
          {err}
        </div>
        <div className="gate-foot">CR팀 내부용 · 무단 공유 금지</div>
      </div>
    </div>
  );
}
