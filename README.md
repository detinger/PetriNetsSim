# Petri Nets Simulator

An interactive Petri Net modeling and simulation environment built with React, TypeScript, and React Flow. Patterned after technical drafting interfaces, Petri Nets Sim allows students and educators to build, simulate, and analyze discrete event systems with mathematical precision.

> **Note:** This is an educational tool designed primarily for learning and demonstration purposes. It is not intended for professional-grade or production-critical system modeling.

## 🌟 Key Features

### 1. Visual Modeling

* **Drag-and-Drop Canvas:** Build nets on an infinite, snap-to-grid canvas powered by React Flow.
* **Direct Connecting:** Drag from any point on a node's border and drop anywhere on another node; the arc exits and enters at the exact outline point facing the target, routing as a straight line. When two arcs run in opposite directions between the same pair, both bow gently to stay legible. Drop on empty space to create the next element already connected. Invalid links (place → place, transition → transition) turn red while you drag.
* **Arc Editing:** Double-click an arc to change its weight, drag the end of a selected arc to move it, and a second arc between the same pair simply adds to the weight.
* **Undo and Redo:** Every edit can be undone (`⌘/Ctrl+Z`) and redone (`⌘/Ctrl+Shift+Z`).
* **Light and Dark Themes:** A calm, compact interface that follows your system theme or a choice you make in the header.

### 2. Simulation

* **Token Game:** Double-click an enabled (orange) transition to fire it, press `Step` to fire a random enabled one, or `Run simulation` at four speeds.
* **Token Animation:** Optionally watch tokens travel along the arcs; the transition that fired and the places it changed are briefly highlighted.
* **History:** Step back through firings or reset to the initial marking $M_0$. Stepping back only restores token counts, never your edits.
* **Weighted Arcs:** Arc multiplicities are shown on the arcs and used by the simulation, the matrices and the analysis.
* **Firing Log:** Every firing is numbered with the marking it produced.

### 3. Formal Analysis

The inspector on the right (toggle it with `I`) has four tabs:

* **Properties:** Edit the selection and read the analysis of the net from $M_0$: *bounded*, *safe*, *conservative*, *deadlock free*, *live* and *reversible*. The app explores the reachability graph (or a Karp–Miller coverability graph with ω when the net is unbounded) and shows a firing sequence that breaks a property when one exists. Properties it can't decide are marked *Unknown*.
* **Matrices:** The current marking next to $M_0$, the enabled transitions, and the formal arrays of the model:
  * Pre-Incidence Matrix ($W^-$)
  * Post-Incidence Matrix ($W^+$)
  * Incidence Matrix ($W$)
* **Reachability:** The reachability or coverability graph, drawn for up to 60 markings and listed as a table, with $M_0$, the current marking and dead markings highlighted.
* **Log:** The firing history.

### 4. Built-in Example Library

Pick an example from the header to start from a working model:

* Producer-Consumer
* Mutual Exclusion
* Vending Machine
* Client-Server Interaction
* Document Approval
* Order Fulfillment
* Student Enrollment
* Service Queue (M/M/1)
* Compensation Request
* Machine Repair Shop
* Kanban Board

### 5. Import & Export

Export models as JSON and import them later. PNML files (ISO/IEC 15909, including PIPE, GreatSPN and WoPeD variants) can be imported too.

---

## 🚀 Installation & Setup

You will need [Node.js](https://nodejs.org/) installed on your machine.

1. **Clone or Download the Repository**
2. **Navigate to the Directory:**

   ```bash
   cd PetriNetsSim
   ```

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Start the Development Server:**

   ```bash
   npm run dev
   ```

5. **Open in Browser:** Navigate to `http://localhost:5173`

---

## 📖 How to Use Petri Nets Sim

### Building a Model

1. **Add Nodes:** Use `Add place` and `Add transition` in the toolbar (or press `P` and `T`). New nodes appear in the middle of the visible canvas.
2. **Connect Nodes:** Hover a node to show the dots on its edges, drag from one and drop onto another node. Places can only connect to transitions and vice versa.
3. **Grow the Net Quickly:** Drop a connection on empty canvas to create a transition (from a place) or a place (from a transition) and type its name straight away.
4. **Edit Properties:** Select a place, transition or arc and use the **Properties** tab to rename it, set tokens, change the arc weight, fire it or delete it. Shift-click to select several elements and set their tokens together.

### Running a Simulation

1. **Step by Step:** `Step` (`Space`) fires one enabled transition; the step-back button (`B`) undoes the last firing.
2. **Auto-Play:** `Run simulation` (`Shift+Space`) keeps firing enabled transitions at the chosen speed. Editing is locked while it runs, and it stops by itself at a deadlock.
3. **Resetting:** `Reset` (`R`) returns to the initial marking. Token changes made before the first step define that marking.

Press `?` at any time to see every keyboard shortcut.

### Analyzing the Net

1. Open the **Properties** tab to see which behavioral properties hold, with a counterexample for each one that fails.
2. Open **Reachability** to explore the markings the net can reach.
3. Open **Matrices** to audit the incidence matrices; selecting a place or transition highlights its row or column.

---

## 🛠️ Technology Stack

* **Core:** React 19, TypeScript, Vite
* **Canvas Routing:** `@xyflow/react` (React Flow)
* **Styling & UI:** Tailwind CSS with semantic light/dark theme tokens, `clsx`, Lucide React icons
* **Typography:** Inter and JetBrains Mono, self-hosted via Fontsource
