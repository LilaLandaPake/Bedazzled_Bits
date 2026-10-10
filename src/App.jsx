import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import RequireUser from './components/RequireUser.jsx'
import EventChatPage from './features/chat/EventChatPage.jsx'
import EventDetailPage from './features/events/EventDetailPage.jsx'
import EventsFeedPage from './features/events/EventsFeedPage.jsx'
import NewEventPage from './features/events/NewEventPage.jsx'
import NotFoundPage from './features/NotFoundPage.jsx'
import OnboardingPage from './features/onboarding/OnboardingPage.jsx'
import WelcomePage from './features/onboarding/WelcomePage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import UserProfilePage from './features/profile/UserProfilePage.jsx'
import RatePage from './features/safety/RatePage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public, no bottom nav */}
      <Route element={<AppShell />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Members only, with bottom nav */}
      <Route
        element={
          <RequireUser>
            <AppShell withNav />
          </RequireUser>
        }
      >
        <Route path="/events" element={<EventsFeedPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/u/:id" element={<UserProfilePage />} />
      </Route>

      {/* Members only, full-screen flows (forms, chat input bar) */}
      <Route
        element={
          <RequireUser>
            <AppShell />
          </RequireUser>
        }
      >
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:id/chat" element={<EventChatPage />} />
        <Route path="/events/:id/rate" element={<RatePage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
