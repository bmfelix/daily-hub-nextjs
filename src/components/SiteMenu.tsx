'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export type MenuItem = { href: string; title: string }

export function SiteMenu({ items }: { items: MenuItem[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <nav id="site-menu" className={`site-menu${open ? ' is-open' : ''}`} aria-label="Main">
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
