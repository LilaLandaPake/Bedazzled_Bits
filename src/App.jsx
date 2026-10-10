import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import RequireUser from './components/RequireUser.jsx'
import DirectChatPage from './features/chat/DirectChatPage.jsx'
import EventChatPage from './features/chat/EventChatPage.jsx'
import EventDetailPage from './features/events/EventDetailPage.jsx'
import EventsFeedPage from './features/events/EventsFeedPage.jsx'
import NewEventPage from './features/events/NewEventPage.jsx'
import ForYouPage from './features/network/ForYouPage.jsx'
import FriendsPage from './features/network/FriendsPage.jsx'
import NotFoundPage from './features/NotFoundPage.jsx'
import OnboardingPage from './features/onboarding/OnboardingPage.jsx'
import SignInPage from './features/onboarding/SignInPage.jsx'
import WelcomePage from './features/onboarding/WelcomePage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import UserProfilePage from './features/profile/UserProfilePage.jsx'
import RatePage from './features/safety/RatePage.jsx'
import ReportPage from './features/safety/ReportPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public, no bottom nav */}
      <Route element={<AppShell />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/signin" element={<SignInPage />} />
      </Route>

      {/* Members only, the four tabs with the bottom nav */}
      <Route
        element={
          <RequireUser>
            <AppShell withNav />
          </RequireUser>
        }
      >
        <Route path="/events" element={<EventsFeedPage />} />
        <Route path="/for-you" element={<ForYouPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Members only, full-screen pages with their own bottom bar or back button */}
      <Route
        element={
          <RequireUser>
            <AppShell />
          </RequireUser>
        }
      >
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/chat" element={<EventChatPage />} />
        <Route path="/events/:id/rate" element={<RatePage />} />
        <Route path="/messages/:id" element={<DirectChatPage />} />
        <Route path="/u/:id" element={<UserProfilePage />} />
        <Route path="/u/:id/report" element={<ReportPage />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
