// Read-only "Viewing As" indicator — role is fixed per account, so this
// reflects the signed-in user's role rather than letting them switch it.
export default function RoleSwitcher({ role }: { role: "ATHLETE" | "COACH" }) {
  return (
    <div className="role-switcher-container">
      <span className="role-label">Viewing As</span>
      <div className={`role-switcher ${role === "COACH" ? "coach-active" : ""}`}>
        <span className={`role-btn ${role === "ATHLETE" ? "active" : ""}`}>Athlete</span>
        <span className={`role-btn ${role === "COACH" ? "active" : ""}`}>Coach</span>
        <div className="role-slider" />
      </div>
    </div>
  );
}
