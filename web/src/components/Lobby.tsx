"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createEmptyBoard, generateRoomCode } from "@/lib/game";
import { randomBlackPlayer } from "@/lib/modes";
import { getPlayerId } from "@/lib/player";
import { getSupabase } from "@/lib/supabase";

export default function Lobby() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createOnlineRoom() {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const playerId = getPlayerId();
      const roomId = generateRoomCode();

      const { error: insertError } = await supabase.from("rooms").insert({
        id: roomId,
        host_id: playerId,
        guest_id: null,
        player_black: null,
        player_white: null,
        current_turn: 1,
        status: "waiting",
        winner: 0,
        last_winner: 0,
        board: createEmptyBoard(),
        mode: "online",
        host_ready: false,
        guest_ready: false,
      });

      if (insertError) throw insertError;
      router.push(`/game/${roomId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "방 만들기에 실패했습니다. Supabase 설정을 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinOnlineRoom() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("방 코드는 6자리입니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const playerId = getPlayerId();

      const { data: room, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", code)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!room) {
        setError("방을 찾을 수 없습니다.");
        return;
      }

      if (room.host_id === playerId) {
        router.push(`/game/${code}`);
        return;
      }

      if (room.guest_id && room.guest_id !== playerId) {
        setError("이 방은 이미 가득 찼습니다.");
        return;
      }

      if (!room.guest_id) {
        const colors = randomBlackPlayer(room.host_id, playerId);
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            guest_id: playerId,
            player_black: colors.player_black,
            player_white: colors.player_white,
            status: "ready",
            host_ready: false,
            guest_ready: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", code)
          .is("guest_id", null);

        if (updateError) throw updateError;
      }

      router.push(`/game/${code}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "방 참가에 실패했습니다. Supabase 설정을 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col justify-center px-5 py-10">
      <div className="rounded-3xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        <p className="text-sm font-medium text-amber-700">오목 온라인</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          어떻게 둘까요?
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          AI 대전, 친구와 온라인 대결, 같은 기기 2인 대결 중에서 선택하세요.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/play/ai"
            className="block w-full rounded-2xl bg-zinc-900 px-4 py-4 text-center text-base font-semibold text-white transition hover:bg-zinc-800"
          >
            1. AI와 대결
          </Link>

          <button
            type="button"
            onClick={createOnlineRoom}
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 px-4 py-4 text-base font-semibold text-white transition hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "처리 중..." : "2. 친구 초대 (온라인)"}
          </button>

          <Link
            href="/play/local"
            className="block w-full rounded-2xl border border-zinc-300 px-4 py-4 text-center text-base font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            3. 2인 같은 기기
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 p-4">
          <label htmlFor="room-code" className="text-sm font-medium text-zinc-700">
            친구 방 코드로 참가
          </label>
          <div className="mt-3 flex gap-2">
            <input
              id="room-code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
              placeholder="예: ABC123"
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-lg tracking-[0.3em] uppercase outline-none ring-amber-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={joinOnlineRoom}
              disabled={loading}
              className="rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
            >
              참가
            </button>
          </div>
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
