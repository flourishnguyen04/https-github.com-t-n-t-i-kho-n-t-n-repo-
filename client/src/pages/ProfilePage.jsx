import { Bell, Mail, Moon, Music2, Type, UserRound, Volume2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const ToggleSetting = ({ icon: Icon, title, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4 rounded-paper border border-border bg-paperSoft p-4">
    <div className="flex items-center gap-3">
      <Icon aria-hidden="true" className="text-secondary" size={22} />
      <div>
        <p className="font-display font-bold text-primary">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`rounded-full border px-4 py-2 text-base font-bold ${
        enabled ? "border-success/30 bg-success/10 text-success" : "border-border bg-surface text-muted"
      }`}
      aria-pressed={enabled}
    >
      {enabled ? "On" : "Off"}
    </button>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("writewise_sound") === "on");
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(
    () => localStorage.getItem("writewise_background_music") === "on"
  );
  const [theme, setTheme] = useState(() => localStorage.getItem("writewise_theme") || "light");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("writewise_font_size") || "medium");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("writewise_notifications") === "on"
  );
  const [notificationMessage, setNotificationMessage] = useState("");

  const updateSound = (enabled) => {
    setSoundEnabled(enabled);
    localStorage.setItem("writewise_sound", enabled ? "on" : "off");
  };

  const updateBackgroundMusic = (enabled) => {
    setBackgroundMusicEnabled(enabled);
    localStorage.setItem("writewise_background_music", enabled ? "on" : "off");
    window.dispatchEvent(new Event("writewise-audio-preferences-changed"));
  };

  const updateTheme = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem("writewise_theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event("writewise-preferences-changed"));
  };

  const updateFontSize = (nextSize) => {
    setFontSize(nextSize);
    localStorage.setItem("writewise_font_size", nextSize);
    document.documentElement.dataset.fontSize = nextSize;
    window.dispatchEvent(new Event("writewise-preferences-changed"));
  };

  const updateNotifications = async (enabled) => {
    setNotificationMessage("");

    if (!enabled) {
      setNotificationsEnabled(false);
      localStorage.setItem("writewise_notifications", "off");
      return;
    }

    if (!("Notification" in window)) {
      setNotificationMessage("Notifications are not supported in this browser.");
      return;
    }

    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;

    if (permission === "denied") {
      setNotificationMessage("Notifications are blocked in your browser settings.");
      setNotificationsEnabled(false);
      localStorage.setItem("writewise_notifications", "off");
      return;
    }

    setNotificationsEnabled(true);
    localStorage.setItem("writewise_notifications", "on");
    setNotificationMessage("Learning notifications are on.");

    window.setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("WriteWise Reminder", {
          body: "Ready for a quick grammar mission?"
        });
      }
    }, 1200);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-sm uppercase text-secondary">Profile</p>
          <h1 className="mt-2 font-display text-4xl font-black text-primary">Account Settings</h1>
        </div>
        <Button as={Link} to="/dashboard" variant="outline">
          Dashboard
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <Card className="p-6">
            <UserRound aria-hidden="true" className="mb-4 text-secondary" size={30} />
            <h2 className="font-display text-2xl font-bold text-primary">{user?.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Mail aria-hidden="true" size={16} />
              {user?.email}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-xl font-bold text-primary">Account Information</h2>
            <dl className="mt-4 space-y-3 text-base">
              <div className="rounded-paper border border-border bg-paperSoft p-3">
                <dt className="font-display text-sm font-bold uppercase text-muted">Name</dt>
                <dd className="mt-1 text-primary">{user?.name}</dd>
              </div>
              <div className="rounded-paper border border-border bg-paperSoft p-3">
                <dt className="font-display text-sm font-bold uppercase text-muted">Email</dt>
                <dd className="mt-1 text-primary">{user?.email}</dd>
              </div>
              {user?.createdAt && (
                <div className="rounded-paper border border-border bg-paperSoft p-3">
                  <dt className="font-display text-sm font-bold uppercase text-muted">Joined</dt>
                  <dd className="mt-1 text-primary">{new Date(user.createdAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-display text-2xl font-bold text-primary">Settings</h2>
          <div className="mt-5 space-y-4">
            <ToggleSetting
              icon={Volume2}
              title="Sound effects"
              description="Play soft sounds for buttons and learning feedback."
              enabled={soundEnabled}
              onToggle={updateSound}
            />
            <ToggleSetting
              icon={Music2}
              title="Background music"
              description="Play a quiet focus loop after you interact with the app."
              enabled={backgroundMusicEnabled}
              onToggle={updateBackgroundMusic}
            />
            <div className="rounded-paper border border-border bg-paperSoft p-4">
              <div className="flex items-center gap-3">
                <Moon aria-hidden="true" className="text-secondary" size={22} />
                <div>
                  <p className="font-display font-bold text-primary">Theme</p>
                  <p className="text-sm text-muted">Choose a light or dark paper workspace.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {["light", "dark"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateTheme(option)}
                    className={`rounded-paper border px-4 py-3 text-base font-bold capitalize ${
                      theme === option ? "border-secondary bg-secondary text-white" : "border-border bg-surface text-primary"
                    }`}
                    aria-pressed={theme === option}
                  >
                    {option} mode
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-paper border border-border bg-paperSoft p-4">
              <div className="flex items-center gap-3">
                <Type aria-hidden="true" className="text-secondary" size={22} />
                <div>
                  <p className="font-display font-bold text-primary">Font size</p>
                  <p className="text-sm text-muted">Adjust reading size for learning pages.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["small", "medium", "large"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateFontSize(option)}
                    className={`rounded-paper border px-3 py-3 text-base font-bold capitalize ${
                      fontSize === option ? "border-secondary bg-secondary text-white" : "border-border bg-surface text-primary"
                    }`}
                    aria-pressed={fontSize === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-paper border border-border bg-paperSoft p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell aria-hidden="true" className="text-secondary" size={22} />
                  <div>
                    <p className="font-display font-bold text-primary">Learning notifications</p>
                    <p className="text-sm text-muted">Show a simple reminder while the app is open.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateNotifications(!notificationsEnabled)}
                  className={`rounded-full border px-4 py-2 text-base font-bold ${
                    notificationsEnabled ? "border-success/30 bg-success/10 text-success" : "border-border bg-surface text-muted"
                  }`}
                  aria-pressed={notificationsEnabled}
                >
                  {notificationsEnabled ? "On" : "Off"}
                </button>
              </div>
              {notificationMessage && <p className="mt-3 text-sm text-muted">{notificationMessage}</p>}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ProfilePage;
