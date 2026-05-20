import { BookOpen, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/topics", label: "Topics" },
  { to: "/profile", label: "Profile" }
];

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `pill-nav-link${isActive ? " is-active" : ""}`;

  const mobileLinkClass = ({ isActive }) =>
    `rounded-paper px-4 py-3 text-base font-semibold transition ${
      isActive ? "bg-primary text-white" : "text-text hover:bg-paperSoft"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-paper border border-primary bg-surface shadow-tactile">
            <BookOpen aria-hidden="true" size={20} />
          </span>
          WriteWise
        </Link>

        <button
          type="button"
          className="rounded-paper border border-border bg-surface p-2 md:hidden"
          aria-label="Open navigation"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <div className="pill-nav-shell" aria-label="Primary navigation">
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass}>
                    <span className="pill-nav-bg" aria-hidden="true" />
                    <span className="pill-nav-label">{item.label}</span>
                  </NavLink>
                ))}
                <button type="button" className="pill-nav-link pill-nav-logout" onClick={handleLogout}>
                  <span className="pill-nav-bg" aria-hidden="true" />
                  <span className="pill-nav-label">
                    <LogOut aria-hidden="true" size={16} />
                    Logout
                  </span>
                </button>
              </div>
              <span className="ml-2 hidden items-center gap-2 rounded-paper border border-border bg-surface px-3 py-2 text-sm text-muted lg:inline-flex">
                <UserRound aria-hidden="true" size={16} />
                {user?.name}
              </span>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="outline">
                Log In
              </Button>
              <Button as={Link} to="/register" variant="secondary">
                Get Started
              </Button>
            </>
          )}
        </div>
      </nav>

      {isOpen && (
        <div className="border-t border-border bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                    {item.label}
                  </NavLink>
                ))}
                <Button type="button" variant="outline" onClick={handleLogout}>
                  <LogOut aria-hidden="true" size={16} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline" onClick={() => setIsOpen(false)}>
                  Log In
                </Button>
                <Button as={Link} to="/register" variant="secondary" onClick={() => setIsOpen(false)}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
