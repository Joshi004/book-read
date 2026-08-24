"""
Generates the "Three Worked DRS Totals" chart for Chapter 31 of Behavior Ops.
Plots the three cumulative Deception Rating Scale totals Charles walks through
in this chapter's worked examples against the >11-point "likely deception"
threshold established in Chapters 25-26.

Run: python3 assets/diagrams/chapter31_drs_scores_chart.py
Output: public/assets/diagrams/chapter31_drs_scores.png
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets",
                    "diagrams", "chapter31_drs_scores.png")

PAPER = "#F4F1EA"
INK = "#1A1A1A"
MUTED = "#5B5B5B"
ACCENT = "#2E5A87"
WARN = "#B23A48"
RULE = "#C9C2B2"

labels = ["Resume-statement\nreply\n(NA + PSD×2 + RES)",
          "Non-contracted\ndenial\n(NC + PSD×2)",
          "Question\nreversal\n(QR + NA)"]
values = [16, 12, 8]
THRESHOLD = 11
colors = [WARN if v > THRESHOLD else ACCENT for v in values]

x = np.arange(len(labels))
width = 0.5

fig, ax = plt.subplots(figsize=(7.5, 5.4))
fig.patch.set_facecolor(PAPER)
ax.set_facecolor(PAPER)

bars = ax.bar(x, values, width, color=colors, edgecolor=PAPER, linewidth=2,
              zorder=3)

for b, v in zip(bars, values):
    ax.annotate(f"{v}", xy=(b.get_x() + b.get_width() / 2, v),
                xytext=(0, 6), textcoords="offset points",
                ha="center", va="bottom", fontsize=15, fontweight="bold",
                color=INK, fontfamily="sans-serif")

ax.axhline(y=THRESHOLD, color=INK, linewidth=1.4, linestyle="--", zorder=2,
           alpha=0.75)
ax.annotate("11 — likely-deception threshold  (Ch. 25–26)",
            xy=(len(labels) - 1, THRESHOLD), xytext=(0, 7),
            textcoords="offset points", ha="right", va="bottom",
            fontsize=9.5, color=INK, fontstyle="italic",
            fontfamily="sans-serif")

ax.set_ylim(0, 19)
ax.set_ylabel("Deception Rating Scale (points)", fontsize=10, color=MUTED,
              fontfamily="sans-serif")
ax.set_title("Do the Points Clear the Deception Threshold?",
             fontsize=13.5, fontweight="bold", color=INK, pad=16,
             fontfamily="sans-serif")
ax.set_xticks(x)
ax.set_xticklabels(labels, fontsize=9.5, color=INK, fontfamily="sans-serif")

ax.yaxis.grid(True, color=RULE, linewidth=0.6, alpha=0.6, zorder=0)
ax.set_axisbelow(True)
for spine_name, spine in ax.spines.items():
    if spine_name in ("top", "right", "left"):
        spine.set_visible(False)
    else:
        spine.set_color(RULE)
ax.tick_params(left=False, bottom=False)
ax.set_yticks([0, 4, 8, 11, 16])

legend_elements = [
    plt.Rectangle((0, 0), 1, 1, facecolor=WARN, edgecolor=PAPER,
                  label="≥ 11 — deception highly likely"),
    plt.Rectangle((0, 0), 1, 1, facecolor=ACCENT, edgecolor=PAPER,
                  label="< 11 — a real data point, not enough alone"),
]
legend = ax.legend(handles=legend_elements, loc="upper right", fontsize=9,
                    frameon=False)
for text in legend.get_texts():
    text.set_color(INK)

plt.tight_layout()
plt.savefig(OUT, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"Saved: {OUT}")
