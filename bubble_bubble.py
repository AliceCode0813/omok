import random
import sys
import tkinter as tk
from dataclasses import dataclass
from tkinter import messagebox

TILE = 32
COLS = 20
ROWS = 15
WIDTH = COLS * TILE
HEIGHT = ROWS * TILE
FPS = 60
DT = 1 / FPS

GRAVITY = 900
JUMP_V = -320
MOVE_SPEED = 180
BUBBLE_SPEED = 220
BUBBLE_FLOAT = -60
BUBBLE_LIFE = 6.0
BUBBLE_COOLDOWN = 0.35
ENEMY_SPEED = 70
HURRY_TIME = 45.0

PLAYER_W = 22
PLAYER_H = 26
ENEMY_W = 22
ENEMY_H = 22
BUBBLE_R = 14

LEVELS = [
    [
        "####################",
        "#.................#",
        "#...####.......####",
        "#.................#",
        "#..##....##....##..#",
        "#.................#",
        "#.....####.........#",
        "#.................#",
        "#..##........##...#",
        "#.................#",
        "#.................#",
        "#.................#",
        "####################",
        "####################",
        "####################",
    ],
    [
        "####################",
        "#.................#",
        "#.####.....#####..#",
        "#.................#",
        "#....##....##.....#",
        "#.................#",
        "#..####....####...#",
        "#.................#",
        "#.....##..##......#",
        "#.................#",
        "#..##........##...#",
        "#.................#",
        "####################",
        "####################",
        "####################",
    ],
    [
        "####################",
        "#.................#",
        "#..##..####..##...#",
        "#.................#",
        "#.####......####..#",
        "#.................#",
        "#....##..##.......#",
        "#.................#",
        "#..####....####...#",
        "#.................#",
        "#......####.......#",
        "#.................#",
        "####################",
        "####################",
        "####################",
    ],
]

ENEMY_SPAWNS = [
    [(3, 1), (9, 1), (15, 1)],
    [(2, 1), (7, 1), (12, 1), (17, 1)],
    [(4, 1), (10, 1), (16, 1), (6, 1), (13, 1)],
]


@dataclass
class Rect:
    x: float
    y: float
    w: float
    h: float

    @property
    def left(self):
        return self.x

    @property
    def right(self):
        return self.x + self.w

    @property
    def top(self):
        return self.y

    @property
    def bottom(self):
        return self.y + self.h

    @property
    def cx(self):
        return self.x + self.w / 2

    @property
    def cy(self):
        return self.y + self.h / 2


@dataclass
class Bubble:
    x: float
    y: float
    vx: float
    vy: float
    life: float
    has_enemy: bool = False
    enemy_id: int | None = None
    floating: bool = False


@dataclass
class Enemy:
    uid: int
    x: float
    y: float
    vx: float = ENEMY_SPEED
    vy: float = 0.0
    trapped: bool = False
    trap_timer: float = 0.0
    angry: bool = False
    color: str = "#E85D75"


@dataclass
class Player:
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    facing: int = 1
    on_ground: bool = False
    shoot_cd: float = 0.0
    alive: bool = True
    color: str = "#5BCB3A"
    horn_color: str = "#FFD93D"
    name: str = "버블"


class BubbleBubbleGame:
    def __init__(self, root, demo=False):
        self.demo = demo
        self.root = root
        self.root.title("버블버블 2인용 (Bubble Bubble)")
        self.root.resizable(False, False)

        top = tk.Frame(root, bg="#1a1a2e")
        top.pack(fill=tk.X)
        self.status = tk.Label(
            top,
            text="2인용  |  P1 버블: 방향키(↑점프 ↓버블)  P2 밥: WASD(W점프 S버블)",
            font=("맑은 고딕", 11),
            bg="#1a1a2e",
            fg="#FFE66D",
        )
        self.status.pack(pady=8)

        self.canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="#87CEEB", highlightthickness=0)
        self.canvas.pack()
        self.canvas.focus_set()

        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=8)
        tk.Button(btn_frame, text="새 게임", command=self.reset, width=12).pack(side=tk.LEFT, padx=5)

        self.keys = set()
        for widget in (root, self.canvas):
            widget.bind("<KeyPress>", self.on_key_down)
            widget.bind("<KeyRelease>", self.on_key_up)
        root.after(100, lambda: (root.focus_force(), self.canvas.focus_set()))

        self.level_idx = 0
        self.tiles: list[list[str]] = []
        self.walls: list[Rect] = []
        self.players: list[Player] = []
        self.enemies: list[Enemy] = []
        self.bubbles: list[Bubble] = []
        self.enemy_uid = 0
        self.stage_time = 0.0
        self.hurry = False
        self.game_over = False
        self.won = False

        self.load_level(0)
        self.tick()

    def on_key_down(self, event):
        self.keys.add(event.keysym.lower())

    def on_key_up(self, event):
        self.keys.discard(event.keysym.lower())

    def reset(self):
        self.game_over = False
        self.won = False
        self.load_level(0)

    def load_level(self, idx):
        self.level_idx = idx
        raw = LEVELS[idx]
        self.tiles = []
        for row in range(ROWS):
            if row < len(raw):
                line = raw[row][:COLS].ljust(COLS, "#")
            else:
                line = "#" * COLS
            self.tiles.append(list(line))
        self.walls = []
        for row in range(ROWS):
            for col in range(COLS):
                if self.tiles[row][col] == "#":
                    self.walls.append(Rect(col * TILE, row * TILE, TILE, TILE))

        self.enemies = []
        self.bubbles = []
        self.enemy_uid = 0
        self.stage_time = 0.0
        self.hurry = False

        for col, row in ENEMY_SPAWNS[idx]:
            self.spawn_enemy(col * TILE + 5, row * TILE + 5)

        self.players = [
            Player(x=3 * TILE + 4, y=10 * TILE, color="#5BCB3A", horn_color="#FFD93D", name="버블"),
            Player(x=16 * TILE + 4, y=10 * TILE, color="#4DA3FF", horn_color="#FFB347", name="밥"),
        ]
        for p in self.players:
            p.alive = True
            p.vx = p.vy = 0
            p.shoot_cd = 0

        self.update_status()

    def spawn_enemy(self, x, y):
        colors = ["#E85D75", "#C77DFF", "#FF9F1C", "#2EC4B6", "#FF6B6B"]
        self.enemies.append(
            Enemy(
                uid=self.enemy_uid,
                x=x,
                y=y,
                color=random.choice(colors),
            )
        )
        self.enemy_uid += 1

    def tile_at(self, px, py):
        col = int(px // TILE)
        row = int(py // TILE)
        if 0 <= row < ROWS and 0 <= col < COLS:
            return self.tiles[row][col]
        return "#"

    def solid_at(self, px, py):
        return self.tile_at(px, py) == "#"

    def resolve_axis(self, rect: Rect, vx, vy):
        rect.x += vx
        for wall in self.walls:
            if self.overlap(rect, wall):
                if vx > 0:
                    rect.x = wall.left - rect.w
                elif vx < 0:
                    rect.x = wall.right

        rect.y += vy
        on_ground = False
        for wall in self.walls:
            if self.overlap(rect, wall):
                if vy > 0:
                    rect.y = wall.top - rect.h
                    on_ground = True
                elif vy < 0:
                    rect.y = wall.bottom
        return on_ground

    @staticmethod
    def overlap(a: Rect, b: Rect):
        return a.left < b.right and a.right > b.left and a.top < b.bottom and a.bottom > b.top

    def circle_rect_hit(self, cx, cy, r, rect: Rect):
        nearest_x = max(rect.left, min(cx, rect.right))
        nearest_y = max(rect.top, min(cy, rect.bottom))
        dx = cx - nearest_x
        dy = cy - nearest_y
        return dx * dx + dy * dy <= r * r

    def update_status(self):
        alive_enemies = sum(1 for e in self.enemies if not e.trapped)
        trapped = sum(1 for e in self.enemies if e.trapped)
        hurry = "  [허리업!]" if self.hurry else ""
        self.status.config(
            text=(
                f"스테이지 {self.level_idx + 1}  |  "
                f"적 {alive_enemies}  |  갇힌 버블 {trapped}  |  "
                f"P1: 방향키  P2: WASD{hurry}"
            )
        )

    def player_controls(self, player: Player, left, right, jump, shoot):
        if not player.alive:
            return

        player.vx = 0
        if left in self.keys:
            player.vx = -MOVE_SPEED
            player.facing = -1
        if right in self.keys:
            player.vx = MOVE_SPEED
            player.facing = 1

        rect = Rect(player.x, player.y, PLAYER_W, PLAYER_H)
        if jump in self.keys and player.on_ground:
            player.vy = JUMP_V
            player.on_ground = False

        player.shoot_cd = max(0, player.shoot_cd - DT)
        if shoot in self.keys and player.shoot_cd <= 0:
            self.shoot_bubble(player)
            player.shoot_cd = BUBBLE_COOLDOWN

    def shoot_bubble(self, player: Player):
        bx = player.x + (PLAYER_W + BUBBLE_R + 2 if player.facing > 0 else -BUBBLE_R - 2)
        by = player.y + PLAYER_H / 2
        self.bubbles.append(
            Bubble(
                x=bx,
                y=by,
                vx=player.facing * BUBBLE_SPEED,
                vy=0,
                life=BUBBLE_LIFE,
            )
        )

    def pop_bubble(self, bubble: Bubble, by_player=False):
        if bubble.has_enemy and bubble.enemy_id is not None:
            for enemy in self.enemies:
                if enemy.uid == bubble.enemy_id:
                    self.enemies.remove(enemy)
                    break
        elif by_player and not bubble.has_enemy:
            pass
        if bubble in self.bubbles:
            self.bubbles.remove(bubble)

    def trap_enemy(self, enemy: Enemy, bubble: Bubble):
        enemy.trapped = True
        enemy.trap_timer = BUBBLE_LIFE
        enemy.vx = enemy.vy = 0
        bubble.has_enemy = True
        bubble.enemy_id = enemy.uid
        bubble.floating = True
        bubble.vx = 0
        bubble.vy = BUBBLE_FLOAT

    def update_players(self):
        controls = [
            ("left", "right", "up", "down"),   # 1P 버블: 방향키
            ("a", "d", "w", "s"),                # 2P 밥: WASD
        ]
        for player, ctrl in zip(self.players, controls):
            self.player_controls(player, *ctrl)

        for player in self.players:
            if not player.alive:
                continue

            player.vy += GRAVITY * DT
            if player.vy > 500:
                player.vy = 500

            rect = Rect(player.x, player.y, PLAYER_W, PLAYER_H)
            on_ground = self.resolve_axis(rect, player.vx * DT, 0)
            on_ground = self.resolve_axis(rect, 0, player.vy * DT) or on_ground
            player.x, player.y = rect.x, rect.y
            player.on_ground = on_ground

            if player.y > HEIGHT:
                player.y = TILE
                player.vy = 0

            prect = Rect(player.x, player.y, PLAYER_W, PLAYER_H)
            for enemy in self.enemies:
                if enemy.trapped:
                    continue
                erect = Rect(enemy.x, enemy.y, ENEMY_W, ENEMY_H)
                if self.overlap(prect, erect):
                    player.alive = False

    def update_enemies(self):
        speed_mul = 1.8 if self.hurry else 1.0
        for enemy in self.enemies:
            if enemy.trapped:
                continue

            enemy.vy += GRAVITY * DT
            if enemy.vy > 500:
                enemy.vy = 500

            rect = Rect(enemy.x, enemy.y, ENEMY_W, ENEMY_H)
            self.resolve_axis(rect, enemy.vx * speed_mul * DT, 0)

            on_ground = self.resolve_axis(rect, 0, enemy.vy * DT)
            enemy.x, enemy.y = rect.x, rect.y

            if on_ground:
                front_x = enemy.x + (ENEMY_W + 2 if enemy.vx > 0 else -2)
                foot_y = enemy.y + ENEMY_H + 2
                if self.solid_at(front_x, foot_y) or self.solid_at(front_x, enemy.y + ENEMY_H / 2):
                    enemy.vx *= -1

            nearest = None
            nearest_dist = 9999
            for player in self.players:
                if not player.alive:
                    continue
                dist = abs(player.x - enemy.x)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest = player

            if nearest and nearest_dist < TILE * 5:
                enemy.vx = abs(enemy.vx) * (1 if nearest.x > enemy.x else -1)

            if enemy.y > HEIGHT:
                enemy.y = TILE
                enemy.vy = 0

    def update_bubbles(self):
        for bubble in list(self.bubbles):
            bubble.life -= DT
            if bubble.life <= 0:
                if bubble.has_enemy:
                    for enemy in self.enemies:
                        if enemy.uid == bubble.enemy_id:
                            enemy.trapped = False
                            enemy.vy = -120
                            break
                self.bubbles.remove(bubble)
                continue

            if bubble.floating:
                bubble.vy = BUBBLE_FLOAT
                bubble.vx *= 0.95
            else:
                bubble.vy += GRAVITY * 0.15 * DT

            bubble.x += bubble.vx * DT
            bubble.y += bubble.vy * DT

            if bubble.x < BUBBLE_R or bubble.x > WIDTH - BUBBLE_R:
                bubble.vx *= -1
                bubble.x = max(BUBBLE_R, min(WIDTH - BUBBLE_R, bubble.x))

            for wall in self.walls:
                if self.circle_rect_hit(bubble.x, bubble.y, BUBBLE_R, wall):
                    if bubble.floating:
                        bubble.y = wall.top - BUBBLE_R
                    else:
                        bubble.vy *= -0.5
                        bubble.vx *= 0.8
                        bubble.y = wall.top - BUBBLE_R
                        if abs(bubble.vy) < 30:
                            bubble.floating = True
                            bubble.vy = BUBBLE_FLOAT

            if bubble.y < BUBBLE_R:
                self.pop_bubble(bubble)

            if not bubble.has_enemy:
                for enemy in self.enemies:
                    if enemy.trapped:
                        continue
                    erect = Rect(enemy.x, enemy.y, ENEMY_W, ENEMY_H)
                    if self.circle_rect_hit(bubble.x, bubble.y, BUBBLE_R, erect):
                        self.trap_enemy(enemy, bubble)
                        break
            else:
                for player in self.players:
                    if not player.alive:
                        continue
                    prect = Rect(player.x, player.y, PLAYER_W, PLAYER_H)
                    if self.circle_rect_hit(bubble.x, bubble.y, BUBBLE_R + 4, prect):
                        self.pop_bubble(bubble, by_player=True)
                        break

            for other in self.bubbles:
                if other is bubble:
                    continue
                dx = bubble.x - other.x
                dy = bubble.y - other.y
                if dx * dx + dy * dy < (BUBBLE_R * 2) ** 2:
                    self.pop_bubble(bubble)
                    self.pop_bubble(other)
                    break

    def check_stage_clear(self):
        if self.enemies:
            return

        if self.level_idx + 1 < len(LEVELS):
            cleared = self.level_idx + 1
            self.load_level(self.level_idx + 1)
            messagebox.showinfo("클리어!", f"스테이지 {cleared} 클리어! 다음 스테이지로!")
        else:
            self.won = True
            self.game_over = True
            messagebox.showinfo("축하!", "모든 스테이지를 클리어했습니다! 귀여운 드래곤 승리!")

    def check_game_over(self):
        alive_players = [p for p in self.players if p.alive]
        if not alive_players and not self.won:
            self.game_over = True
            messagebox.showinfo("게임 오버", "적에게 잡혔습니다! 새 게임으로 다시 도전하세요.")

    def apply_demo_inputs(self):
        if not self.demo or self.game_over:
            return

        self.keys.clear()
        t = self.stage_time
        phase = int(t * 2)

        if phase % 4 in (0, 1):
            self.keys.add("right")
        elif phase % 4 == 2:
            self.keys.add("left")
        if int(t * 3) % 5 == 0:
            self.keys.add("up")
        if int(t * 4) % 6 == 0:
            self.keys.add("down")

        if phase % 3 != 0:
            self.keys.add("d")
        if int(t * 2.5) % 5 == 0:
            self.keys.add("w")
        if int(t * 3.5) % 7 == 0:
            self.keys.add("s")

    def update(self):
        if self.game_over:
            return

        self.apply_demo_inputs()
        self.stage_time += DT
        if self.stage_time >= HURRY_TIME and not self.hurry:
            self.hurry = True
            for enemy in self.enemies:
                if not enemy.trapped:
                    enemy.vx *= 1.5

        self.update_players()
        self.update_enemies()
        self.update_bubbles()
        self.check_stage_clear()
        self.check_game_over()
        self.update_status()

    def draw_tile(self, col, row):
        x, y = col * TILE, row * TILE
        if self.tiles[row][col] == "#":
            self.canvas.create_rectangle(x, y, x + TILE, y + TILE, fill="#6B4226", outline="#4A2F18", width=1)
            self.canvas.create_rectangle(x + 2, y + 2, x + TILE - 2, y + 6, fill="#8B5E3C", outline="")

    def draw_cute_dragon(self, x, y, facing, body_color, horn_color, name):
        cx = x + PLAYER_W / 2
        cy = y + PLAYER_H / 2
        flip = facing

        self.canvas.create_oval(
            cx - 12, cy - 10, cx + 12, cy + 12,
            fill=body_color, outline="#2d5016" if body_color.startswith("#5") else "#1a4a8a", width=2,
        )
        eye_x = cx + 5 * flip
        self.canvas.create_oval(eye_x - 3, cy - 6, eye_x + 3, cy, fill="white", outline="")
        self.canvas.create_oval(eye_x - 1, cy - 4, eye_x + 1, cy - 2, fill="#111", outline="")

        horn_x = cx + 8 * flip
        self.canvas.create_polygon(
            horn_x, cy - 12,
            horn_x + 4 * flip, cy - 4,
            horn_x - 2 * flip, cy - 6,
            fill=horn_color, outline="#cc8800",
        )

        tail_x = cx - 10 * flip
        self.canvas.create_oval(tail_x - 5, cy + 2, tail_x + 5, cy + 10, fill=body_color, outline="")

        self.canvas.create_text(cx, y - 6, text=name, fill="#333", font=("맑은 고딕", 8, "bold"))

    def draw_cute_enemy(self, enemy: Enemy):
        cx = enemy.x + ENEMY_W / 2
        cy = enemy.y + ENEMY_H / 2
        color = "#AA0000" if self.hurry and not enemy.trapped else enemy.color

        if enemy.trapped:
            return

        self.canvas.create_oval(
            cx - 11, cy - 9, cx + 11, cy + 9,
            fill=color, outline="#5a2030", width=2,
        )
        self.canvas.create_oval(cx - 5, cy - 4, cx - 1, cy, fill="white", outline="")
        self.canvas.create_oval(cx + 1, cy - 4, cx + 5, cy, fill="white", outline="")
        self.canvas.create_oval(cx - 4, cy - 2, cx - 2, cy, fill="#111", outline="")
        self.canvas.create_oval(cx + 2, cy - 2, cx + 4, cy, fill="#111", outline="")

        leg = 1 if (int(enemy.x) // 8) % 2 else -1
        self.canvas.create_line(cx - 6, cy + 8, cx - 6, cy + 12 + leg * 2, fill=color, width=3)
        self.canvas.create_line(cx + 6, cy + 8, cx + 6, cy + 12 - leg * 2, fill=color, width=3)

    def draw_bubble(self, bubble: Bubble):
        shimmer = "#B8E8FF" if not bubble.has_enemy else "#FFE4F0"
        self.canvas.create_oval(
            bubble.x - BUBBLE_R, bubble.y - BUBBLE_R,
            bubble.x + BUBBLE_R, bubble.y + BUBBLE_R,
            fill=shimmer, outline="#6EC6FF", width=2,
        )
        self.canvas.create_oval(
            bubble.x - 5, bubble.y - 8,
            bubble.x + 1, bubble.y - 2,
            fill="white", outline="",
        )
        if bubble.has_enemy:
            for enemy in self.enemies:
                if enemy.uid == bubble.enemy_id:
                    cx, cy = bubble.x, bubble.y
                    self.canvas.create_oval(
                        cx - 8, cy - 6, cx + 8, cy + 6,
                        fill=enemy.color, outline="#5a2030", width=1,
                    )
                    self.canvas.create_oval(cx - 3, cy - 2, cx - 1, cy, fill="white", outline="")
                    self.canvas.create_oval(cx + 1, cy - 2, cx + 3, cy, fill="white", outline="")
                    break

    def draw(self):
        self.canvas.delete("all")

        for row in range(ROWS):
            for col in range(COLS):
                self.draw_tile(col, row)

        for bubble in self.bubbles:
            self.draw_bubble(bubble)

        for enemy in self.enemies:
            self.draw_cute_enemy(enemy)

        for player in self.players:
            if player.alive:
                self.draw_cute_dragon(
                    player.x, player.y, player.facing,
                    player.color, player.horn_color, player.name,
                )

        if self.hurry:
            self.canvas.create_text(
                WIDTH // 2, 18,
                text="HURRY UP!",
                fill="#FF4444",
                font=("맑은 고딕", 16, "bold"),
            )

    def tick(self):
        self.update()
        self.draw()
        self.root.after(int(1000 / FPS), self.tick)


if __name__ == "__main__":
    demo = "--demo" in sys.argv
    root = tk.Tk()
    BubbleBubbleGame(root, demo=demo)
    root.mainloop()
