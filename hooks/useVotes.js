// ===================================================
// 🗳️ useVotes – Vote state per article
// Votes are stored permanently but the REVEAL is
// session-only — hidden on every fresh app launch.
// ===================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVotes, castVote, getLocalVotes } from '../services/voteService';

// In-memory cache for vote counts (cleared every launch = no reveal on load)
const votesCache = {};

// Session-reveal set — tracks which articles were voted THIS session only
// Never persisted. Empty on every launch → bars always hidden until user votes.
const sessionRevealed = new Set();

export function useVotes(articleId) {
  const [votes,   setVotes]   = useState(votesCache[articleId] || { agree: 0, disagree: 0 });
  const [myVote,  setMyVote]  = useState(null);
  const [loading, setLoading] = useState(true);

  // Revealed = did the user vote THIS session for this article?
  const [revealed, setRevealed] = useState(sessionRevealed.has(articleId));

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function load() {
      // Check local vote history (so we know which choice was made)
      const localVotes = await getLocalVotes();
      const existing   = localVotes[articleId] || null;

      // Always fetch live counts so bar is accurate when it eventually shows
      const counts = await fetchVotes(articleId);
      votesCache[articleId] = counts;

      if (mounted.current) {
        setVotes(counts);
        setMyVote(existing);
        // ← Never set revealed=true here, even if voted before
        //    revealed only becomes true when vote() is called this session
        setLoading(false);
      }
    }
    load();
    return () => { mounted.current = false; };
  }, [articleId]);

  const vote = useCallback(async (choice) => {
    if (myVote) return; // already voted (this session or before)

    const updated = {
      agree:    votes.agree    + (choice === 'agree'    ? 1 : 0),
      disagree: votes.disagree + (choice === 'disagree' ? 1 : 0),
    };

    // Mark as revealed for this session
    sessionRevealed.add(articleId);

    setVotes(updated);
    setMyVote(choice);
    setRevealed(true);
    votesCache[articleId] = updated;

    await castVote(articleId, choice);
  }, [myVote, votes, articleId]);

  return { votes, myVote, loading, revealed, vote };
}