import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6">
        <p className="font-mono text-sm uppercase text-secondary">Create Account</p>
        <h1 className="mt-2 font-display text-4xl font-black text-primary">Join WriteWise</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-text">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-paper border border-border bg-surface px-4 py-3 text-text"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-text">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-paper border border-border bg-surface px-4 py-3 text-text"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-semibold text-text">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-paper border border-border bg-surface px-4 py-3 text-text"
            />
          </div>
          {error && <p className="rounded-paper border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
            {loading ? "Creating Account" : "Create Account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-secondary">
            Log in
          </Link>
        </p>
      </Card>
    </section>
  );
};

export default RegisterPage;
