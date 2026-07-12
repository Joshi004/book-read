"""
Generates the Predicted vs. Actual Obedience chart for Chapter 13 of Behavior Ops.
Compares the psychologists' pre-experiment predictions against what Milgram's
subjects actually did, at the two voltage thresholds Charles cites: 210V and 450V.

Run: python3 assets/diagrams/chapter13_predicted_vs_actual_chart.py
Output: public/assets/diagrams/chapter13_predicted_vs_actual.png
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets",
                    "diagrams", "chapter13_predicted_vs_actual.png")

PAPER = "#F4F1EA"
INK = "#1A1A1A"
MUTED = "#5B5B5B"
ACCENT = "#2E5A87"
WARN = "#B23A48"
RULE = "#C9C2B2"

groups = ["Obedience at\n210 volts", "Obedience at\n450 volts"]
predicted = [14, 1]   # 100 - 86% predicted refusal, 100 - 99% predicted refusal
actual = [100, 65]

x = np.arange(len(groups))
width = 0.32

fig, ax = plt.subplots(figsize=(7.5, 5.2))
fig.patch.set_facecolor(PAPER)
ax.set_facecolor(PAPER)

bars_p = ax.bar(x - width / 2, predicted, width, color=ACCENT,
                 edgecolor=PAPER, linewidth=2, label="Predicted to obey",
                 zorder=3)
bars_a = ax.bar(x + width / 2, actual, width, color=WARN,
                 edgecolor=PAPER, linewidth=2, label="Actually obeyed",
                 zorder=3)

for bars in (bars_p, bars_a):
    for b in bars:
        h = b.get_height()
        ax.annotate(f"{h}%", xy=(b.get_x() + b.get_width() / 2, h),
                    xytext=(0, 5), textcoords="offset points",
                    ha="center", va="bottom", fontsize=11, fontweight="bold",
                    color=INK, fontfamily="sans-serif")

ax.set_ylim(0, 112)
ax.set_ylabel("Percent of participants", fontsize=10, color=MUTED,
              fontfamily="sans-serif")
ax.set_title("What Psychologists Predicted vs. What Happened",
             fontsize=13, fontweight="bold", color=INK, pad=16,
             fontfamily="sans-serif")
ax.set_xticks(x)
ax.set_xticklabels(groups, fontsize=10.5, color=INK, fontfamily="sans-serif")

ax.yaxis.grid(True, color=RULE, linewidth=0.6, alpha=0.6, zorder=0)
ax.set_axisbelow(True)
for spine_name, spine in ax.spines.items():
    if spine_name in ("top", "right", "left"):
        spine.set_visible(False)
    else:
        spine.set_color(RULE)
ax.tick_params(left=False, bottom=False)
ax.set_yticks([0, 25, 50, 75, 100])
ax.set_yticklabels(["0%", "25%", "50%", "75%", "100%"], color=MUTED, fontsize=9)

legend = ax.legend(loc="upper left", fontsize=9.5, frameon=False)
for text in legend.get_texts():
    text.set_color(INK)

plt.tight_layout()
plt.savefig(OUT, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"Saved: {OUT}")
