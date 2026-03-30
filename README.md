# Petri Nets Simulator

An interactive Petri Net modeling and simulation environment built with React, TypeScript, and React Flow. Patterned after technical drafting interfaces and utilizing the cohesive Nord color palette, Petri Nets Sim allows students and educators to build, simulate, and analyze discrete event systems with mathematical precision.

> **Note:** This is an educational tool designed primarily for learning and demonstration purposes. It is not intended for professional-grade or production-critical system modeling.

## 🌟 Key Features

### 1. Advanced Visual Modeling

* **Intuitive Drag-and-Drop Canvas:** Seamlessly construct complex nets with an infinite canvas, powered by React Flow.
* **Precise Arc Control:** Adjust arc curvature manually to neatly route connections around nodes—solving traditional edge-crossing clutter.
* **High-Fidelity Aesthetics:** The entire UI is built on the premium **Nord color system**, providing a distraction-free, "blueprint" aesthetic with clear typography and subtle glassmorphism effects.

### 2. Powerful Simulation Engine

* **Liveness & Deadlock Detection:** Real-time continuous evaluation of system state.
* **Auto-Flow Token Animation:** Sit back and let the engine automate token firing with smooth visual transitions, or toggle it off for manual, step-by-step control.
* **Historical Timeline:** Safely step forward or backward through the firing history, or instantly reset to the original $M_0$ marking.
* **Weighted Arcs:** Define custom arc multiplicity (weights) easily through the properties panel.

### 3. Formal System Analysis

Petri Nets Sim acts as a complete mathematical diagnostic suite via two dedicated sidebars (which can be hidden for full-screen modeling):

* **Structural Analysis:** Real-time bounds checking for *Safeness*, *Boundedness*, and *Conservativeness*.
* **Behavioral Diagnostics:** Evaluates the net for *Liveness*, *Reversibility*, and generic *Deadlock* states.
* **Matrix View:** Instantly generates and visualizes the formal arrays of your model:
  * Pre-Incidence Matrix ($W^-$)
  * Post-Incidence Matrix ($W^+$)
  * Incidence Matrix ($W$)

### 4. Built-in Example Library

Petri Nets Sim comes pre-loaded with structurally perfect, geometrically-aligned examples demonstrating classic concurrency problems:

* Producer-Consumer Problem
* Mutual Exclusion (Mutex)
* Dining Philosophers
* Traffic Light Controller
* ...and many more.

### 5. Export & Portability

Save your custom models as localized JSON schema files and import them later, or share them securely.

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

1. **Add Nodes:** Use the `Elements` toolbar on the left to add **Places** (circles) and **Transitions** (squares) to the canvas.
2. **Connect Nodes:** Drag from a node's visual handle to another node. Note: The system mathematically enforces bipartite mapping (Places must connect to Transitions, and vice-versa).
3. **Edit Properties:** Click on any Place, Transition, or Arc. The **Props** sidebar on the right will allow you to rename the entity, set token counts, define arc weights, or modify arc curvature.

### Running a Simulation

1. **Step by Step:** Use the `Step Forward` and `Step Backward` buttons in the left toolbar to navigate the system manually.
2. **Auto-Play:** Click `Play` to let the engine automatically fire enabled transitions at a continuous interval. You can stop this process at any time.
3. **Resetting:** Use `Restart Model` to revert the simulation back to the defined initial state.

### Analyzing the Net

1. **View Toggles:** Ensure the **Panels (Right Sidebars)** are toggled `ON` in the toolbar.
2. Read the **Structural** and **Behavioral Analysis** panels to see if your net violates bounds or reaches deadlock.
3. Toggle the **Matrix** tab to audit the mathematical incidence of your routing in a clear, tabular format.

---

## 🛠️ Technology Stack

* **Core:** React 18, TypeScript, Vite
* **Canvas Routing:** `@xyflow/react` (React Flow)
* **Styling & UI:** Tailwind CSS, `clsx`, Lucide React Icons
* **Aesthetic Scheme:** [Nord Theme](https://www.nordtheme.com/)
