import GameRoom from "@/components/GameRoom";

interface GamePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { roomId } = await params;
  return <GameRoom roomId={roomId.toUpperCase()} />;
}
