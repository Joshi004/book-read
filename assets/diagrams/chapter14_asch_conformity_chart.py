"""
Generates the Asch Conformity Results chart for Chapter 14 of Behavior Ops.
Plots the three headline percentages Charles cites from Solomon Asch's 1956
line-judgment experiments: how many participants conformed to the group's
obviously wrong answer across all trials, conformed at least once, and never
conformed at all.

Run: python3 assets/diagrams/chapter14_asch_conformity_chart.py
Output: public/assets/diagrams/chapter14_asch_conformity.png
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets",
                    "diagrams", "chapter14_asch_conformity.png")

PAPER = "#F4F1EA"
INK = "#1A1A1A"
MUTED = "#5B5B5B"
ACCENT = "#2E5A87"
WARN = "#B23A48"
RULE = "#C9C2B2"

labels = ["Conformed on\nevery critical trial", "Conformed at\nleast once", "Never\nconformed"]
values = [32, 75, 25]
colors = [WARN, ACCENT, "#6B9EC7"]

x = np.arange(len(labels))

fig, ax = plt.subplots(figsize=(7.5, 5.2))
fig.patch.set_facecolor(PAPER)
ax.set_facecolor(PAPER)

bars = ax.bar(x, values, width=0.5, color=colors, edgecolor=PAPER, linewidth=2, zorder=3)

for b, v in zip(bars, values):
    ax.annotate(f"{v}%", xy=(b.get_x() + b.get_width() / 2, v),
                xytext=(0, 5), textcoords="offset points",
                ha="center", va="bottom", fontsize=12, fontweight="bold",
                color=INK, fontfamily="sans-serif")

ax.set_ylim(0, 88)
ax.set_ylabel("Percent of participants", fontsize=10, color=MUTED, fontfamily="sans-serif")
ax.set_title("Asch's Line-Judgment Experiment (1956)",
             fontsize=13, fontweight="bold", color=INK, pad=16, fontfamily="sans-serif")
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=10.5, color=INK, fontfamily="sans-serif")

ax.yaxis.grid(True, color=RULE, linewidth=0.6, alpha=0.6, zorder=0)
ax.set_axisbelow(True)
for spine_name, spine in ax.spines.items():
    if spine_name in ("top", "right", "left"):
        spine.set_visible(False)
    else:
        spine.set_color(RULE)
ax.tick_params(left=False, bottom=False)
ax.set_yticks([0, 25, 50, 75])
ax.set_yticklabels(["0%", "25%", "50%", "75%"], color=MUTED, fontsize=9)

plt.tight_layout()
plt.savefig(OUT, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"Saved: {OUT}")
