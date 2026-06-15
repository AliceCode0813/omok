"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createEmptyBoard, generateRoomCode } from "@/lib/game";
import { getPlayerId } from "@/lib/player";
import { getSupabase } from "@/lib/supabase";

export default function Lobby() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabase();
      const playerId = getPlayerId();
      const roomId = generateRoomCode();

      const { error: insertError } = await supabase.from("rooms").insert({
        id: roomId,
        host_id: playerId,
        player_black: playerId,
        guest_id: null,
        player_white: null,
        current_turn: 1,
        status: "waiting",
        winner: 0,
        board: createEmptyBoard(),
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

  async function joinRoom() {
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
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            guest_id: playerId,
            player_white: playerId,
            status: "playing",
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
        <p className="text-sm font-medium text-amber-700">실시간 멀티플레이</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
          오목 온라인
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          방을 만들고 코드를 친구에게 보내세요. 서로 다른 폰에서도 같은 방에
          들어와 실시간으로 대국할 수 있습니다.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={createRoom}
            disabled={loading}
            className="w-full rounded-2xl bg-zinc-900 px-4 py-4 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "처리 중..." : "새 방 만들기"}
          </button>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <label
              htmlFor="room-code"
              className="text-sm font-medium text-zinc-700"
            >
              방 코드로 참가
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="room-code"
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase())
                }
                maxLength={6}
                placeholder="예: ABC123"
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-lg tracking-[0.3em] uppercase outline-none ring-amber-500 focus:ring-2"
              />
              <button
                type="button"
                onClick={joinRoom}
                disabled={loading}
                className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-400 disabled:opacity-60"
              >
                참가
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          배포 전 Supabase와 Vercel 환경 변수 설정이 필요합니다.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        PC용 오목은{" "}
        <Link href="https://github.com/AliceCode0813/omok" className="underline">
          GitHub 저장소
        </Link>
        에서 확인할 수 있습니다.
      </p>
    </main>
  );
}
