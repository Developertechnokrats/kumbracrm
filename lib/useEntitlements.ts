'use client'

import { useState } from 'react'

export function useEntitlements(initialKeys: string[] = []) {
  const [keys, setKeys] = useState(new Set(initialKeys))

  return {
    has: (k: string) => keys.has(k),
    list: Array.from(keys),
    set: (arr: string[]) => setKeys(new Set(arr)),
  }
}
