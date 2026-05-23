export function serializeUser(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    createdAt: row.created_at
  };
}

export function serializeUserPublic(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at
  };
}