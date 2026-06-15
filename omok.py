import tkinter as tk
from tkinter import messagebox

BOARD_SIZE = 15
CELL = 40
MARGIN = 30
STONE_R = 16


class OmokGame:
    def __init__(self, root):
        self.root = root
        self.root.title("오목 (Gomoku)")
        self.root.resizable(False, False)

        size = MARGIN * 2 + CELL * (BOARD_SIZE - 1)
        self.canvas = tk.Canvas(root, width=size, height=size, bg="#DCB35C")
        self.canvas.pack(padx=10, pady=10)

        self.status = tk.Label(root, text="흑돌 차례", font=("맑은 고딕", 14))
        self.status.pack(pady=(0, 10))

        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=(0, 10))
        tk.Button(btn_frame, text="새 게임", command=self.reset, width=12).pack(side=tk.LEFT, padx=5)

        self.board = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]
        self.current = 1
        self.game_over = False

        self.draw_board()
        self.canvas.bind("<Button-1>", self.on_click)

    def draw_board(self):
        self.canvas.delete("all")
        for i in range(BOARD_SIZE):
            x = MARGIN + i * CELL
            y_end = MARGIN + (BOARD_SIZE - 1) * CELL
            self.canvas.create_line(x, MARGIN, x, y_end, fill="#333")
            self.canvas.create_line(MARGIN, x, y_end, x, fill="#333")

        for row, col in [(3, 3), (3, 11), (11, 3), (11, 11), (7, 7)]:
            x = MARGIN + col * CELL
            y = MARGIN + row * CELL
            self.canvas.create_oval(x - 4, y - 4, x + 4, y + 4, fill="#333")

        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if self.board[row][col]:
                    self.draw_stone(row, col, self.board[row][col])

    def draw_stone(self, row, col, player):
        x = MARGIN + col * CELL
        y = MARGIN + row * CELL
        color = "#111" if player == 1 else "#FAFAFA"
        outline = "#000" if player == 1 else "#666"
        self.canvas.create_oval(
            x - STONE_R, y - STONE_R, x + STONE_R, y + STONE_R,
            fill=color, outline=outline, width=2,
        )

    def on_click(self, event):
        if self.game_over:
            return

        col = round((event.x - MARGIN) / CELL)
        row = round((event.y - MARGIN) / CELL)

        if not (0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE):
            return
        if self.board[row][col] != 0:
            return

        self.board[row][col] = self.current
        self.draw_stone(row, col, self.current)

        if self.check_win(row, col):
            winner = "흑돌" if self.current == 1 else "백돌"
            self.status.config(text=f"{winner} 승리!")
            messagebox.showinfo("게임 종료", f"{winner} 승리!")
            self.game_over = True
            return

        self.current = 3 - self.current
        self.status.config(text="흑돌 차례" if self.current == 1 else "백돌 차례")

    def check_win(self, row, col):
        player = self.board[row][col]
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        for dr, dc in directions:
            count = 1
            for sign in (1, -1):
                r, c = row + dr * sign, col + dc * sign
                while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and self.board[r][c] == player:
                    count += 1
                    r += dr * sign
                    c += dc * sign
            if count >= 5:
                return True
        return False

    def reset(self):
        self.board = [[0] * BOARD_SIZE for _ in range(BOARD_SIZE)]
        self.current = 1
        self.game_over = False
        self.status.config(text="흑돌 차례")
        self.draw_board()


if __name__ == "__main__":
    root = tk.Tk()
    OmokGame(root)
    root.mainloop()
