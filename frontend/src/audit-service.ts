const auditApiHost = import.meta.env.VITE_AUDIT_API_HOST;

if (auditApiHost === undefined) {
  throw new Error("VITE_AUDIT_API_HOST is required.");
}

export { auditApiHost };
