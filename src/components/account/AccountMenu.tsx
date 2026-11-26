"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { useMe } from "./useMe";

// The right end of the header: "Log in" for visitors, your photo and a menu once you're in.
export function AccountMenu({ active }: { active?: boolean }) {
  const me = useMe();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!me || !me.signedIn) {
    const next = path && path !== "/login" ? `?next=${encodeURIComponent(path)}` : "";
    return (
      <Link href={`/login${next}`} className={active ? "active" : undefined} style={{ fontWeight: 700, visibility: me ? "visible" : "hidden" }}>
        Log in
      </Link>
    );
  }

  return (
    <div className="account-menu" ref={box}>
      <button type="button" className="account-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={`Your account, ${me.name}`}>
        <Avatar name={me.name} src={me.avatar} size={38} ring />
      </button>
      {open ? (
        <div className="account-pop" role="menu">
          <div className="account-who">
            <Avatar name={me.name} src={me.avatar} size={44} />
            <div style={{ minWidth: 0 }}>
              <strong>{me.name}</strong>
              <span>{me.email}</span>
            </div>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)}>Your profile</Link>
          <Link role="menuitem" href="/account#reading" onClick={() => setOpen(false)}>Reading history</Link>
          <Link role="menuitem" href="/account#comments" onClick={() => setOpen(false)}>Your comments</Link>
          <Link role="menuitem" href="/account#settings" onClick={() => setOpen(false)}>Settings</Link>
          <form action="/auth/logout" method="post">
            <button role="menuitem" type="submit">Log out</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

// The same, as rows for the mobile menu.
export function MobileAccountLinks() {
  const me = useMe();
  if (!me?.signedIn) return <Link href="/login">Log in</Link>;
  return (
    <>
      <Link href="/account" className="mobile-me">
        <Avatar name={me.name} src={me.avatar} size={28} /> {me.name}
      </Link>
      <form action="/auth/logout" method="post">
        <button type="submit" className="mobile-logout">Log out</button>
      </form>
    </>
  );
}
