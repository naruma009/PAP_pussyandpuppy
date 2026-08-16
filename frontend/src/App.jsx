import CommerceAppShell from "./components/layout/CommerceAppShell";
import PetModeGuard from "./features/preferences/PetModeGuard";

export default function App() {
  return (
    <PetModeGuard>
      <CommerceAppShell />
    </PetModeGuard>
  );
}
