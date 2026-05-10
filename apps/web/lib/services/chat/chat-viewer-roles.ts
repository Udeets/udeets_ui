type HubM = { role: string; status: string } | null;
type RoomM = { role: string; status: string } | null;

export function isHubStaff(hub: HubM): boolean {
  if (!hub || hub.status !== "active") return false;
  return hub.role === "creator" || hub.role === "admin";
}

export function isRoomModPlus(m: RoomM): boolean {
  if (!m || m.status !== "active") return false;
  return m.role === "owner" || m.role === "admin" || m.role === "moderator";
}
