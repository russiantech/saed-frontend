export default function AuthError({ message }) {
  if (!message) return null;
  return <div className="form-error">{message}</div>;
}
