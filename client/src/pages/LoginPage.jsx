import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form);
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-6">
        <p className="font-mono text-sm uppercase text-secondary">Welcome Back</p>
        <h1 className="mt-2 font-display text-4xl font-black text-primary">Log in</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-semibold text-text">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-secondary hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-paper border border-border bg-surface px-4 py-3 text-text"
            />
          </div>
          {error && <p className="rounded-paper border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
            {loading ? "Logging In" : "Log In"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          New to WriteWise?{" "}
          <Link to="/register" className="font-semibold text-secondary">
            Create an account
          </Link>
        </p>
      </Card>
    </section>
  );
};

export default LoginPage;
