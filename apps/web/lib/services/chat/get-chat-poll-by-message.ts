export type ChatPollOptionDto = {
  id: string;
  position: number;
  label: string;
  voteCount: number;
};

export type ChatPollDetailDto = {
  pollId: string;
  messageId: string;
  question: string;
  allowMultiple: boolean;
  anonymousVoting: boolean;
  closesAt: string | null;
  options: ChatPollOptionDto[];
  totalVotes: number;
  mySelectedOptionIds: string[];
};
