"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import OmokBoard from "@/components/OmokBoard";
import TurnTimer from "@/components/TurnTimer";
import {
  bothPlayersReady,
  canPlaceStone,
  checkWin,
  createEmptyBoard,
  getPlayerRole,
  getResultMessage,
  getRoomLastMove,
  type Board,
  type Room,
} from "@/lib/game";
import { nextOnlineColors, randomBlackPlayer } from "@/lib/modes";
import { getPlayerId } from "@/lib/player";
import { getSupabase } from "@/lib/supabase";
import { useSyncedTurnTimer } from "@/hooks/useTurnTimer";

interface GameRoomProps {
  roomId: string;
}

function normalizeRoom(raw: Room): Room {
  return {
    ...raw,
    board: raw.board as Board,
    current_turn: Number(raw.current_turn) as Room["current_turn"],
    winner: Number(raw.winner) as Room["winner"],
    last_winner: Number(raw.last_winner ?? 0) as Room["winner"],
    host_ready: Boolean(raw.host_ready),
    guest_ready: Boolean(raw.guest_ready),
    last_move_row:
      raw.last_move_row == null ? null : Number(raw.last_move_row),
    last_move_col:
      raw.last_move_col == null ? null : Number(raw.last_move_col),
    turn_started_at: raw.turn_started_at ?? null,
    end_reason: raw.end_reason ?? null,
  };
}

export default function GameRoom({ roomId }: GameRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "polling">(
    "connecting",
  );

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/game/${roomId}`;
  }, [roomId]);

  const loadRoom = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data) throw new Error("방을 찾을 수 없습니다.");
    setRoom(normalizeRoom(data as Room));
  }, [roomId]);

  useEffect(() => {
    setPlayerId(getPlayerId());
  }, []);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null =
      null;

    async function ensureJoined(currentRoom: Room, currentPlayerId: string) {
      if (
        currentRoom.host_id !== currentPlayerId &&
        !currentRoom.guest_id
      ) {
        const colors = randomBlackPlayer(currentRoom.host_id, currentPlayerId);
        const supabase = getSupabase();
        const { error: joinError } = await supabase
          .from("rooms")
          .update({
            guest_id: currentPlayerId,
            player_black: colors.player_black,
            player_white: colors.player_white,
            status: "ready",
            host_ready: false,
            guest_ready: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId)
          .is("guest_id", null);

        if (joinError) throw joinError;
      }
    }

    async function init() {
      try {
        const currentPlayerId = getPlayerId();
        const supabase = getSupabase();
        const { data } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .maybeSingle();

        if (!data) throw new Error("방을 찾을 수 없습니다.");

        await ensureJoined(normalizeRoom(data as Room), currentPlayerId);
        await loadRoom();

        channel = supabase
          .channel(`room:${roomId}`, {
            config: { broadcast: { self: false } },
          })
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "rooms",
              filter: `id=eq.${roomId}`,
            },
            (payload) => {
              if (payload.new) {
                setRoom(normalizeRoom(payload.new as Room));
              }
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setLiveStatus("live");
            } else if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              setLiveStatus("polling");
            }
          });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "게임을 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (channel) {
        getSupabase().removeChannel(channel);
      }
    };
  }, [loadRoom, roomId]);

  useEffect(() => {
    if (!room || room.winner) return;

    const intervalId = window.setInterval(() => {
      void loadRoom();
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [loadRoom, room?.winner, roomId]);

  const role = room ? getPlayerRole(room, playerId) : null;
  const isMyTurn = room ? canPlaceStone(room, playerId) : false;
  const isHost = room?.host_id === playerId;
  const isGuest = room?.guest_id === playerId;
  const myReady = isHost ? room?.host_ready : room?.guest_ready;
  const waitingForReady =
    room?.status === "ready" && room.guest_id && !bothPlayersReady(room);
  const myStone: Room["current_turn"] | undefined =
    role === "black" ? 1 : role === "white" ? 2 : undefined;
  const timerActive =
    Boolean(room?.status === "playing" && !room?.winner && !waitingForReady);

  const handleTimeout = useCallback(async () => {
    if (!room || room.status !== "playing" || room.winner) return;

    const elapsed = room.turn_started_at
      ? Date.now() - new Date(room.turn_started_at).getTime()
      : 0;
    if (elapsed < 60_000) return;

    const winnerStone = room.current_turn === 1 ? 2 : 1;
    const supabase = getSupabase();
    await supabase
      .from("rooms")
      .update({
        winner: winnerStone,
        status: "finished",
        end_reason: "timeout",
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .eq("current_turn", room.current_turn)
      .eq("winner", 0);

    await loadRoom();
  }, [loadRoom, room, roomId]);

  const remaining = useSyncedTurnTimer(
    timerActive,
    room?.turn_started_at,
    `${room?.current_turn}-${room?.turn_started_at ?? "none"}`,
    () => {
      void handleTimeout();
    },
  );

  const lastMove = room ? getRoomLastMove(room) : null;

  const statusText = useMemo(() => {
    if (!room) return "불러오는 중...";
    if (room.winner) {
      return getResultMessage({
        winner: room.winner,
        endReason: room.end_reason ?? null,
        myStone,
      });
    }
    if (room.status === "waiting") return "상대를 기다리는 중...";
    if (waitingForReady && !myReady) return "준비 버튼을 눌러주세요";
    if (waitingForReady && myReady) return "상대 준비를 기다리는 중...";
    if (!role) return "관전 중";
    if (isMyTurn) return "내 차례입니다";
    return "상대 차례입니다";
  }, [room, role, isMyTurn, waitingForReady, myReady, myStone]);

  async function handlePlace(row: number, col: number) {
    if (!room || !role || !isMyTurn || room.board[row][col] !== 0) return;

    const stone = role === "black" ? 1 : 2;
    const nextBoard = room.board.map((boardRow) => [...boardRow]) as Board;
    nextBoard[row][col] = stone;

    const winner = checkWin(nextBoard, row, col) ? stone : 0;
    const nextTurn = stone === 1 ? 2 : 1;

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          board: nextBoard,
          current_turn: winner ? stone : nextTurn,
          winner,
          status: winner ? "finished" : "playing",
          last_move_row: row,
          last_move_col: col,
          turn_started_at: winner ? room.turn_started_at : now,
          end_reason: winner ? "normal" : null,
          updated_at: now,
        })
        .eq("id", roomId)
        .eq("current_turn", room.current_turn);

      if (updateError) throw updateError;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "착수에 실패했습니다.",
      );
      await loadRoom();
    }
  }

  async function markReady() {
    if (!room || (!isHost && !isGuest)) return;

    const supabase = getSupabase();
    const readyPatch = isHost
      ? { host_ready: true }
      : { guest_ready: true };

    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        ...readyPatch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const willBothReady =
      (isHost && room.guest_ready) || (isGuest && room.host_ready);

    if (willBothReady) {
      const now = new Date().toISOString();
      const { error: startError } = await supabase
        .from("rooms")
        .update({
          status: "playing",
          turn_started_at: now,
          last_move_row: null,
          last_move_col: null,
          end_reason: null,
          updated_at: now,
        })
        .eq("id", roomId);

      if (startError) setError(startError.message);
    }

    await loadRoom();
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function resetRoom() {
    if (!room || room.host_id !== playerId || !room.guest_id) return;

    const colors =
      nextOnlineColors(
        room.player_black,
        room.player_white,
        room.winner as 0 | 1 | 2,
      ) ?? {
        player_black: room.player_black!,
        player_white: room.player_white!,
      };

    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        board: createEmptyBoard(),
        current_turn: 1,
        winner: 0,
        last_winner: room.winner,
        player_black: colors.player_black,
        player_white: colors.player_white,
        status: "ready",
        host_ready: false,
        guest_ready: false,
        last_move_row: null,
        last_move_col: null,
        turn_started_at: null,
        end_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadRoom();
  }

  if (loading) {
    return (
      <main className="flex min-h-full items-center justify-center px-5 py-10">
        <p className="text-zinc-600">게임을 불러오는 중...</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-5 py-10">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">{error}</p>
        <Link href="/" className="mt-4 text-center text-sm underline">
          로비로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-zinc-500 underline">
          모드 선택
        </Link>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow ring-1 ring-black/5">
          방 코드 <span className="tracking-[0.25em]">{roomId}</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-zinc-900">{statusText}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {role === "black" && "나: 흑돌 (선공)"}
              {role === "white" && "나: 백돌 (후공)"}
              {!role && "이 방의 플레이어가 아닙니다"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyInvite}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400"
            >
              {copied ? "링크 복사됨" : "초대 링크 복사"}
            </button>
            {room.host_id === playerId && room.guest_id && (
              <button
                type="button"
                onClick={resetRoom}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                다음 판
              </button>
            )}
          </div>
        </div>

        {waitingForReady && (isHost || isGuest) && (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              첫 판은 흑/백이 랜덤으로 정해집니다. 다음 판부터는 이긴 사람이
              백(후공)으로 둡니다.
            </p>
            {!myReady ? (
              <button
                type="button"
                onClick={markReady}
                className="mt-3 w-full rounded-2xl bg-zinc-900 px-4 py-3 font-semibold text-white"
              >
                준비 완료
              </button>
            ) : (
              <p className="mt-3 text-sm font-medium text-amber-800">
                내 준비 완료 · 상대 대기 중
              </p>
            )}
            <p className="mt-2 text-xs text-amber-800">
              호스트 {room.host_ready ? "준비됨" : "대기"} / 게스트{" "}
              {room.guest_ready ? "준비됨" : "대기"}
            </p>
          </div>
        )}

        <div className="mt-5">
          <TurnTimer
            remaining={remaining}
            active={timerActive}
            label={
              room.winner
                ? "게임 종료"
                : room.status === "waiting"
                  ? "상대 대기"
                  : waitingForReady
                    ? "준비 중"
                    : isMyTurn
                      ? "내 턴 남은 시간"
                      : "상대 턴 남은 시간"
            }
          />
          <OmokBoard
            board={room.board}
            disabled={
              !isMyTurn ||
              room.status !== "playing" ||
              !!room.winner ||
              Boolean(waitingForReady)
            }
            lastMove={lastMove}
            onPlace={handlePlace}
          />
        </div>

        <div className="mt-5 grid gap-2 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p>흑돌: {room.player_black ? "배정됨" : "대기"}</p>
          <p>백돌: {room.player_white ? "배정됨" : "대기"}</p>
          <p>같은 방 링크를 친구에게내면 바로 참가할 수 있습니다.</p>
          <p className="text-xs text-zinc-500">
            {liveStatus === "live" && "실시간 연결됨"}
            {liveStatus === "polling" && "자동 동기화 중 (1.5초마다 갱신)"}
            {liveStatus === "connecting" && "연결 중..."}
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
