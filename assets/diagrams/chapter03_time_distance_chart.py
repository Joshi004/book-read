"""
Generates the Time-Distance graph described in Chapter 3 of Behavior Ops.
Red circle = where most modern experts operate.
Green circle = the goal (major behavior change, short time).
Gray dashed arrow = the "missing bridge."

Run: python3 assets/diagrams/chapter03_time_distance_chart.py
Output: assets/diagrams/chapter03_time_distance.png
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
import os

OUT = os.path.join(os.path.dirname(__file__), "chapter03_time_distance.png")

fig, ax = plt.subplots(figsize=(8, 6))
fig.patch.set_facecolor("#F4F1EA")
ax.set_facecolor("#F4F1EA")

# --- Axis style ---
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.set_xlabel("TIME  →  (how long it takes to produce the change)",
               fontsize=10, labelpad=10, color="#1A1A1A", fontfamily="sans-serif")
ax.set_ylabel("DISTANCE  →  (how far from normal behavior)",
               fontsize=10, labelpad=10, color="#1A1A1A", fontfamily="sans-serif")
ax.set_title("The Time-Distance Problem of Influence",
             fontsize=13, fontweight="bold", color="#2E5A87", pad=16,
             fontfamily="sans-serif")

for spine in ax.spines.values():
    spine.set_color("#C9C2B2")
ax.tick_params(colors="#C9C2B2")
ax.set_xticks([])
ax.set_yticks([])

# --- Distance scale labels (left margin, tracing what Charles describes) ---
distance_labels = [
    (1.2, "Trying a new restaurant"),
    (3.5, "Buying a car you can't afford"),
    (6.0, "Joining a cult / minor crime"),
    (9.2, "Treason / extreme deviation"),
]
for y, label in distance_labels:
    ax.annotate(label, xy=(0.05, y), fontsize=8, color="#555",
                va="center", fontstyle="italic")
    ax.axhline(y=y, xmin=0.01, xmax=0.98, color="#C9C2B2", linewidth=0.4,
               linestyle="--", alpha=0.5)

# --- "Current experts" curve (rises slowly, trends right) ---
import numpy as np
t = np.linspace(0.2, 9, 300)
# Logarithmic — lots of time for modest gain
expert_curve = 3.5 * np.log(t + 1) / np.log(10)
ax.plot(t, expert_curve, color="#C9C2B2", linewidth=1.5, label="Expert capability curve")

# --- Red circle (where most experts operate) ---
red_x, red_y = 7.0, 3.5
ax.scatter(red_x, red_y, s=280, color="#B23A48", zorder=5, edgecolors="white",
           linewidths=1.5)
ax.annotate("Red Circle\n(Most modern experts)", xy=(red_x, red_y),
            xytext=(red_x + 0.3, red_y - 1.3), fontsize=8.5, color="#B23A48",
            fontweight="bold", arrowprops=dict(arrowstyle="-", color="#B23A48",
                                               lw=0.8))

# --- Green circle (the goal) ---
green_x, green_y = 2.2, 8.5
ax.scatter(green_x, green_y, s=280, color="#2E7D32", zorder=5,
           edgecolors="white", linewidths=1.5)
ax.annotate("Green Circle\n(<1% of practitioners)", xy=(green_x, green_y),
            xytext=(green_x + 0.5, green_y - 1.5), fontsize=8.5, color="#2E7D32",
            fontweight="bold", arrowprops=dict(arrowstyle="-", color="#2E7D32",
                                               lw=0.8))

# --- Gray dashed "missing bridge" arrow ---
ax.annotate("", xy=(green_x, green_y), xytext=(red_x, red_y),
            arrowprops=dict(arrowstyle="-|>", color="#888888",
                            linestyle="dashed", lw=1.8,
                            connectionstyle="arc3,rad=-0.25"))
# Label the bridge
ax.text(4.8, 6.8, "The Missing Bridge", fontsize=9, color="#888888",
        fontstyle="italic", rotation=-35)

# --- Legend ---
legend_elements = [
    mpatches.Patch(facecolor="#B23A48", edgecolor="white", label="Red Circle — current experts"),
    mpatches.Patch(facecolor="#2E7D32", edgecolor="white", label="Green Circle — mastery (<1%)"),
    plt.Line2D([0], [0], color="#888888", linestyle="--", linewidth=1.5,
               label="The Missing Bridge"),
]
ax.legend(handles=legend_elements, loc="lower right", fontsize=8,
          framealpha=0.85, facecolor="#F4F1EA", edgecolor="#C9C2B2")

plt.tight_layout()
plt.savefig(OUT, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"Saved: {OUT}")
