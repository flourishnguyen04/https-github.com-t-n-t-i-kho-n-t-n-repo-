import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ActivityPage from "./pages/ActivityPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackPage from "./pages/FeedbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TaskActivityPage from "./pages/TaskActivityPage";
import TopicDetailPage from "./pages/TopicDetailPage";
import TopicsPage from "./pages/TopicsPage";
import WritingHistoryPage from "./pages/WritingHistoryPage";
import { playClickSound, syncBackgroundMusic } from "./utils/audio";

const LegacyWritingRedirect = () => {
  const { miniTopicId } = useParams();
  return <Navigate to={`/mini-topics/${miniTopicId}/tasks/final-writing`} replace />;
};

const App = () => {
  const location = useLocation();
  const routeTransitionKey = `${location.key}-${location.pathname}${location.search}${location.hash}`;
  const isTaskRoute = /^\/mini-topics\/[^/]+\/tasks\/[^/]+/.test(location.pathname);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = localStorage.getItem("writewise_theme") || "light";
      document.documentElement.dataset.fontSize = localStorage.getItem("writewise_font_size") || "medium";
    };
    const handlePreferenceChange = () => applyTheme();
    const handleAudioPreferenceChange = () => syncBackgroundMusic();
    const handleClick = (event) => {
      const clickable = event.target.closest("button, a, [role='button']");
      if (clickable) {
        playClickSound();
        syncBackgroundMusic();
      }
    };

    applyTheme();
    document.addEventListener("click", handleClick);
    window.addEventListener("storage", handlePreferenceChange);
    window.addEventListener("writewise-preferences-changed", handlePreferenceChange);
    window.addEventListener("writewise-audio-preferences-changed", handleAudioPreferenceChange);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("storage", handlePreferenceChange);
      window.removeEventListener("writewise-preferences-changed", handlePreferenceChange);
      window.removeEventListener("writewise-audio-preferences-changed", handleAudioPreferenceChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {!isTaskRoute && <Navbar />}
      <main className="flex-1">
        <div key={routeTransitionKey} className="route-transition">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/topics/:topicId" element={<TopicDetailPage />} />
              <Route path="/mini-topics/:miniTopicId" element={<ActivityPage />} />
              <Route path="/mini-topics/:miniTopicId/activities" element={<ActivityPage />} />
              <Route path="/mini-topics/:miniTopicId/tasks/:taskType" element={<TaskActivityPage />} />
              <Route path="/mini-topics/:miniTopicId/writing" element={<LegacyWritingRedirect />} />
              <Route path="/feedback/:submissionId" element={<FeedbackPage />} />
              <Route path="/writing-history" element={<WritingHistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </div>
      </main>
      {!isTaskRoute && <Footer />}
    </div>
  );
};

export default App;
