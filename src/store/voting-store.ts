import { create } from "zustand";

interface VotingState {
  isActive: boolean;
  presentationId: string | null;
  closesAt: string | null;
  hasVoted: boolean;
  setVotingSession: (session: {
    isActive: boolean;
    presentationId: string | null;
    closesAt: string | null;
  }) => void;
  setHasVoted: (voted: boolean) => void;
  closeVoting: () => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  isActive: false,
  presentationId: null,
  closesAt: null,
  hasVoted: false,
  setVotingSession: (session) =>
    set({
      isActive: session.isActive,
      presentationId: session.presentationId,
      closesAt: session.closesAt,
    }),
  setHasVoted: (voted) => set({ hasVoted: voted }),
  closeVoting: () =>
    set({ isActive: false, presentationId: null, closesAt: null }),
}));
