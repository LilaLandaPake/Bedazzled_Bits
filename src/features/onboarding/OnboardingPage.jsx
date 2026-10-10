import Header from '../../components/ui/Header.jsx'
import ScreenPlaceholder from '../../components/ScreenPlaceholder.jsx'

export default function OnboardingPage() {
  return (
    <>
      <Header title="Join the community" back="/" />
      <ScreenPlaceholder
        title="Onboarding"
        message="Invite code, name, role, interests and area will be set up here."
      />
    </>
  )
}
