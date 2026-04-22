"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useVotingStore } from "@/store/voting-store";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { setVotingSession, closeVoting } = useVotingStore();

  useEffect(() => {
    const channel = supabase
      .channel("voting-session")
      .on(
        "broadcast",
        { event: "voting-open" },
        (payload) => {
          setVotingSession({
            isActive: true,
            presentationId: payload.payload.presentationId,
            closesAt: payload.payload.closesAt,
          });
        }
      )
      .on(
        "broadcast",
        { event: "voting-close" },
        () => {
          closeVoting();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setVotingSession, closeVoting]);

  return <>{children}</>;
}
