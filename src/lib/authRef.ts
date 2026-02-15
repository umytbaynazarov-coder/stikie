/** Module-level user ID ref — bridges React context and Zustand store */
let _userId: string | null = null

export function setCurrentUserId(id: string | null) {
  _userId = id
}

export function getCurrentUserId(): string | null {
  return _userId
}
