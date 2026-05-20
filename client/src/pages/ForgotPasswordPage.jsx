import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { requestPasswordReset } from "../services/authService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await requestPasswordReset({ email });
      setMessage(data.message || "If this email exists, reset instructions will be available soon.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg p-7">
        <p className="font-mono text-base uppercase text-secondary">Account Help</p>
        <h1 className="mt-2 font-display text-3xl font-black text-primary sm:text-4xl">Reset your password</h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          Enter your email address and we will help you reset your password.
        </p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email" className="text-base font-semibold text-text">
              Email
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-paper border border-border bg-surface px-4 py-3.5 text-lg text-text"
            />
          </div>
          {message && (
            <p className="rounded-paper border border-success/30 bg-success/10 p-4 text-base text-success">
              {message}
            </p>
          )}
          {error && <p className="rounded-paper border border-danger/30 bg-danger/10 p-4 text-base text-danger">{error}</p>}
          <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
            {loading ? "Sending" : "Send reset instructions"}
          </Button>
        </form>
        <p className="mt-5 text-center text-base text-muted">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-secondary">
            Log in
          </Link>
        </p>
      </Card>
    </section>
  );
};

export default ForgotPasswordPage;
