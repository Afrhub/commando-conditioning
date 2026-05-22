import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

const SESSION_FLAG = "commando-conditioning:boot-seen";

/**
 * Boot loader: black overlay with pulsating CC logo.
 * - Plays once per browser session (sessionStorage gate).
 * - Auto-completes after 1500ms.
 * - Click anywhere to skip.
 * - Respects prefers-reduced-motion: shrinks to 500ms hold.
 */
export function BootLoader({ onDone }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = setTimeout(() => fadeOut(), reduce ? 500 : 1500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fadeOut = () => {
    setHidden(true);
    sessionStorage.setItem(SESSION_FLAG, "1");
    setTimeout(onDone, 400);
  };

  return (
    <div
      className={`boot-loader ${hidden ? "boot-fade-out" : ""}`}
      onClick={fadeOut}
      role="presentation"
    >
      <div className="boot-logo-wrap">
        <img
          src="/brand/logo.png"
          alt=""
          aria-hidden
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/brand/logo.svg"; }}
          className="boot-logo"
        />
      </div>
      <div className="boot-skip-hint">click to skip</div>
    </div>
  );
}

export function shouldShowBoot(): boolean {
  try {
    return sessionStorage.getItem(SESSION_FLAG) !== "1";
  } catch {
    return true;
  }
}
