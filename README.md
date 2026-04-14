# Aether - Semantic Media Knowledge Graph

Aether is a high-performance, full-stack intelligence platform that transforms cinematic data into a multi-dimensional Knowledge Graph. It leverages Graph Science and Natural Language Processing (NLP) to map complex relationships between films, creators, and narrative themes.

---

## 🧠 Graph Science & Neural Embeddings

The core intelligence of Aether operates on a hybrid architecture combining Graph Theory with Neural Vector Search. Here is exactly how media data is mapped to the semantic domain:

1. **The Semantic Graph (Neo4j):** Unlike flat databases, Aether stores data as a networked mesh.
   - **Nodes:** Physical entities like Movies, Actors, Directors, and Genres.
   - **Relationships:** Directed edges (`ACTED_IN`, `DIRECTED`, `BELONGS_TO`) that define the "flow" of cinematic influence.
2. **Neural Embeddings (NLP):** Every movie overview is processed through a **Transformer-based model** (`all-MiniLM-L6-v2`).
   - This encodes the "vibe" and plot of a movie into a 384-dimensional mathematical vector.
3. **Multi-Dimensional Search:**
   - **Graph Traversal:** Finding actors' "Degrees of Separation" via multi-hop traversal.
   - **Vector Similarity:** Calculating the **Cosine Similarity** between movie embeddings to recommend films with similar narrative themes (e.g., matching the psychological tone of *Inception* to *Shutter Island* even if they share no actors).
4. **Network Intelligence Analytics:**
   - **Graph Density:** Measures the interconnectedness of the media database.
   - **Degree Centrality:** Identifies "Knowledge Hubs"—entities like Martin Scorsese or Leonardo DiCaprio who act as primary bridges in the network.
   - **Sentiment & Year Grouping:** Aggregating temporal trends and genre distribution across the entire Knowledge Graph.

---

## ✨ Core Application Features

### 🕸️ Interactive Knowledge Graph
- **Real-Time Visualization:** A dynamic 3D/2D force-directed graph (powered by D3) that allows you to fly through the cinematic universe.
- **Node Isolation:** Clicking any entity isolates its immediate network, silencing the noise to reveal local social and creative clusters.

### 🧠 Semantic Discovery Engine
- **Narrative Matching:** Discover movies based on deep plot similarities rather than just tagging.
- **Cross-Entity Intelligence:** Find links between different directors and actors who have never worked together but share frequent thematic collaborators.

### 📊 Network Analytics Suite
- **Graph Health Monitoring:** View live stats on Network Density, Average Degree, and Connectivity.
- **Genre & Temporal Distro:** Beautiful, theme-aware bar and area charts (built with Recharts) that map the skew of the media world.

### ⚡ Automated Knowledge Ingestion
- **Live TMDB Bridge:** A seamless integration with the TMDB API that intelligently cross-references and structures incoming raw data into the specialized Neo4j graph schema.
- **Deduplication:** Ensures entity integrity by merging duplicate nodes while preserving historical relationships.

### 🎨 Premium Monochrome Interface
- **State-of-the-Art Aesthetic:** High-contrast, theme-aware UI utilizing the **Geist Typography** system for a technical, high-resolution feel.
- **Micro-Animations:** Subtle, buttery-smooth transitions and glassmorphic layouts that prioritize data legibility.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
A technical, high-resolution dashboard built for complex data visualization.
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + Geist Sans/Mono
- **Icons:** `lucide-react`
- **Visualization:** `react-force-graph` (D3 Engine), `recharts`
- **Theme:** `next-themes` (High-contrast Monochrome)

### Backend
A high-throughput asynchronous API managing graph logistics and NLP pipelines.
- **Framework:** FastAPI
- **Database:** Neo4j (Graph Database)
- **NLP/Machine Learning:** PyTorch + `sentence-transformers`
- **External Integration:** TMDB API (httpx)
- **Infrastructure:** Pydantic v2 Settings Management

---

## 🚀 Full Setup & Installation Guide

To run Aether locally, you will need to open **two separate terminals**—one for the backend (Python) and one for the frontend (Node.js).

### Prerequisites
- **Neo4j Desktop** or **AuraDB** instance running.
- **Python 3.10+** installed.
- **Node.js 18+** installed.

### Part 1: Backend (Graph API & NLP)

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. **Create and Activate Virtual Environment:**
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend` folder:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   TMDB_API_KEY=your_key
   ```

5. **Start the API Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Part 2: Frontend (Intelligence Dashboard)

1. Open a **new terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. **Install Node.js Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **View the Application:**
   Open your browser to: `http://localhost:3000`

---
**Explore the hidden architecture of cinema with Aether.**
