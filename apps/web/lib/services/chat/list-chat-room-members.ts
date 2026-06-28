export type ChatRoomMemberDto = {
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  displayName: string;
  avatarUrl: string | null;
};
