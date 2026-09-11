/**
 * Weave Graph - Interactive 3D Visualisation Engine
 * Features: AST Parsing, CSR Matrix, Bidirectional Edges, MCP Slicing, Local SLM, and Multi-Repo Federation
 * Powered by Three.js (r128) - Zero-network local rendering
 */

(function() {
  'use strict';

  const container = document.getElementById('three-graph-container');
  if (!container || typeof THREE === 'undefined') return;

  // Scene variables
  let scene, camera, renderer;
  let nodesGroup, edgesGroup, particlesGroup, federatedClustersGroup;
  let activeStage = 1;
  let isRotating = true;
  let targetRotationX = 0.2, targetRotationY = 0;
  let currentRotationX = 0.2, currentRotationY = 0;
  let isDragging = false;
  let prevMouseX = 0, prevMouseY = 0;
  let raycaster, mouse;
  let hoveredNode = null;
  let animFrameId = null;

  // Symbols representing all Weave Graph features across workspace crates
  const symbolsData = [
    // 1. Core Engine (Cyan - 0x00f0ff)
    { id: 0, name: 'GraphEngine::reindex_file', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 4, callees: 6 },
    { id: 1, name: 'Storage::purge_file_edges_bidirectional', crate: 'weave-graph-core', repo: 'core', type: 'trait fn', color: 0x00f0ff, callers: 3, callees: 2, target: true },
    { id: 2, name: 'CsrMatrix::insert_edge_batch', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 5, callees: 1 },
    { id: 3, name: 'SymbolIndex::resolve_id', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 8, callees: 0 },
    { id: 4, name: 'RoaringBitmap::contains', crate: 'weave-graph-core', repo: 'core', type: 'struct', color: 0x00f0ff, callers: 12, callees: 0 },
    { id: 5, name: 'AdjacencyList::get_callers', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 6, callees: 3 },
    { id: 6, name: 'AdjacencyList::get_callees', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 6, callees: 3 },
    { id: 7, name: 'AtomicSwap::execute_rebuild', crate: 'weave-graph-core', repo: 'core', type: 'fn', color: 0x00f0ff, callers: 2, callees: 1 },

    // 2. Tree-sitter Parsers (Purple - 0xa855f7)
    { id: 8, name: 'ParserRegistry::parse_source', crate: 'weave-graph-parse', repo: 'core', type: 'fn', color: 0xa855f7, callers: 3, callees: 4 },
    { id: 9, name: 'RustParser::extract_symbols', crate: 'weave-graph-parse', repo: 'core', type: 'struct', color: 0xa855f7, callers: 2, callees: 2 },
    { id: 10, name: 'PythonParser::extract_defs', crate: 'weave-graph-parse', repo: 'core', type: 'struct', color: 0xa855f7, callers: 2, callees: 2 },
    { id: 11, name: 'TsParser::extract_call_sites', crate: 'weave-graph-parse', repo: 'core', type: 'struct', color: 0xa855f7, callers: 2, callees: 2 },
    { id: 12, name: 'AstQuery::match_identifiers', crate: 'weave-graph-parse', repo: 'core', type: 'fn', color: 0xa855f7, callers: 4, callees: 1 },

    // 3. SQLite Storage Engine (Emerald Green - 0x27c93f)
    { id: 13, name: 'SqliteStorage::commit_tx', crate: 'weave-graph-store-sqlite', repo: 'core', type: 'fn', color: 0x27c93f, callers: 3, callees: 2 },
    { id: 14, name: 'SqliteStorage::query_raw_edges', crate: 'weave-graph-store-sqlite', repo: 'core', type: 'fn', color: 0x27c93f, callers: 4, callees: 1 },
    { id: 15, name: 'WalJournal::checkpoint', crate: 'weave-graph-store-sqlite', repo: 'core', type: 'fn', color: 0x27c93f, callers: 1, callees: 0 },

    // 4. MCP Agent Protocol (Electric Blue - 0x3b82f6)
    { id: 16, name: 'McpServer::handle_callers_tool', crate: 'weave-graph-mcp', repo: 'core', type: 'fn', color: 0x3b82f6, callers: 1, callees: 5, target: true },
    { id: 17, name: 'McpServer::handle_impact_tool', crate: 'weave-graph-mcp', repo: 'core', type: 'fn', color: 0x3b82f6, callers: 1, callees: 4 },
    { id: 18, name: 'StdioTransport::write_response', crate: 'weave-graph-mcp', repo: 'core', type: 'fn', color: 0x3b82f6, callers: 4, callees: 0 },
    { id: 19, name: 'SseTransport::broadcast_event', crate: 'weave-graph-mcp', repo: 'core', type: 'fn', color: 0x3b82f6, callers: 2, callees: 0 },

    // 5. Local SLM Intent Router (Amber Gold - 0xf59e0b)
    { id: 20, name: 'IntentRouter::route_terminal_ask', crate: 'weave-graph-cli', repo: 'cli', type: 'fn', color: 0xf59e0b, callers: 2, callees: 3, slm: true },
    { id: 21, name: 'GgufModel::infer_intent', crate: 'weave-graph-cli', repo: 'cli', type: 'struct', color: 0xf59e0b, callers: 1, callees: 0, slm: true },
    { id: 22, name: 'SymbolGrounder::verify_token', crate: 'weave-graph-cli', repo: 'cli', type: 'fn', color: 0xf59e0b, callers: 2, callees: 2, slm: true },
    { id: 23, name: 'AdrRuleMiner::extract_invariants', crate: 'weave-graph-cli', repo: 'cli', type: 'fn', color: 0xf59e0b, callers: 1, callees: 1, slm: true },

    // 6. Multi-Repo Federation Nodes (Magenta Pink - 0xec4899)
    { id: 24, name: 'FederationSchema::link_repo', crate: 'weave-graph-core', repo: 'api', type: 'fn', color: 0xec4899, callers: 2, callees: 2, fed: true },
    { id: 25, name: 'CrossRepoCall::resolve_boundary', crate: 'weave-graph-core', repo: 'api', type: 'fn', color: 0xec4899, callers: 3, callees: 1, fed: true },
    { id: 26, name: 'TarjanScc::find_circular_deps', crate: 'weave-graph-core', repo: 'auth', type: 'fn', color: 0xec4899, callers: 1, callees: 2, fed: true },
    { id: 27, name: 'AuthToken::verify_signature', crate: 'external-auth-service', repo: 'auth', type: 'fn', color: 0xec4899, callers: 2, callees: 0, fed: true }
  ];

  // Edges connecting nodes
  const edgesData = [
    [0, 1], [0, 2], [0, 8], [0, 13],
    [1, 5], [1, 14],
    [2, 3], [2, 4],
    [5, 3], [5, 4],
    [6, 3], [6, 4],
    [7, 13], [7, 15],
    [8, 9], [8, 10], [8, 11], [8, 12],
    [12, 3],
    [16, 5], [16, 18], [16, 1],
    [17, 5], [17, 6], [17, 18],
    [20, 21], [20, 22], [20, 16],
    [22, 3], [23, 1],
    // Federation cross-repo edges
    [24, 0], [25, 24], [25, 27], [26, 25], [16, 25]
  ];

  const nodeMeshes = [];
  const edgeLines = [];
  const pulseParticles = [];

  // Stage description text for all 6 features
  const stageDescriptions = {
    1: {
      title: 'Stage 1: Tree-sitter AST Syntax Parsing',
      badge: 'Zero-LLM Syntax Extraction',
      description: 'Raw source files (Rust, Python, TypeScript) are parsed deterministically across CPU cores using native Tree-sitter C/Rust bindings. Extracts symbols, signatures, and call sites in microseconds with zero AST tree leaks across threads.'
    },
    2: {
      title: 'Stage 2: Compressed CSR Matrix Encoding',
      badge: 'uint32 Integer Compaction & Roaring Bitmasks',
      description: 'Instead of pointer-heavy structs, all symbol names and file paths are interned into contiguous 32-bit integer arrays. Adjacency lists are compressed into CSR (Compressed Sparse Row) matrices with Roaring bitmasks, bounding peak RAM to <80MB for 500k symbols.'
    },
    3: {
      title: 'Stage 3: Bidirectional Edge Linking & Atomic Reindexing',
      badge: 'Crash Resilience & Bidirectional Invariant',
      description: 'Directed graph edges link source and target symbols in microsecond CSR hops. Incremental reindexing purges both inbound (target_id) AND outbound (source_id) edges to prevent orphaned pointers, and swaps databases atomically.'
    },
    4: {
      title: 'Stage 4: Subgraph Slicing for AI Agents (MCP)',
      badge: '92% Token Context Reduction',
      description: 'When Claude Code, Cursor, or Windsurf queries a symbol, Weave Graph extracts only the exact directed sub-graph. The agent receives an 800-token high-density slice instead of a 35,000-token file dump, eliminating attention dilution.'
    },
    5: {
      title: 'Stage 5: Local SLM Intent Routing (weave ask)',
      badge: '0.5B–3B On-Device Edge Models',
      description: 'Optional on-device SLM linking allows developers to ask questions in plain English. The SLM translates intents into exact MCP tool calls with strict AST parameter grounding (zero hallucinations) and 0MB idle RAM.'
    },
    6: {
      title: 'Stage 6: Multi-Repo Federation & Cycle Detection',
      badge: 'Virtual Schemas & Tarjan SCC',
      description: 'Link sibling workspaces via weave repo add. Cross-repository call edges are resolved across workspace boundaries while Tarjan Strongly Connected Components (SCC) algorithms detect circular dependencies between services.'
    }
  };

  function init() {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b14, 0.002);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 2200);
    camera.position.set(0, 35, 300);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x070b14, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pl1 = new THREE.PointLight(0x00f0ff, 2.2, 450);
    pl1.position.set(120, 160, 120);
    scene.add(pl1);

    const pl2 = new THREE.PointLight(0xa855f7, 2, 450);
    pl2.position.set(-120, -120, -60);
    scene.add(pl2);

    createBackgroundStars();

    nodesGroup = new THREE.Group();
    edgesGroup = new THREE.Group();
    scene.add(edgesGroup);
    scene.add(nodesGroup);

    createNodes();
    createEdges();
    createPulseParticles();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupEventListeners();
    setStage(1);
    animate();
  }

  function createBackgroundStars() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 900;
      positions[i + 1] = (Math.random() - 0.5) * 900;
      positions[i + 2] = (Math.random() - 0.5) * 900;
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starField = new THREE.Points(starsGeo, new THREE.PointsMaterial({
      color: 0x4f6b94,
      size: 1.5,
      transparent: true,
      opacity: 0.6
    }));
    scene.add(starField);
  }

  function createNodes() {
    const sphereGeo = new THREE.SphereGeometry(3.2, 24, 24);

    symbolsData.forEach((data, index) => {
      const angle = (index / symbolsData.length) * Math.PI * 2;
      const radius = 65 + Math.sin(index * 2) * 25;
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * 60;
      const z = Math.sin(angle) * radius;

      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { ...data, baseColor: data.color, originalPos: new THREE.Vector3(x, y, z) };

      // Glow aura
      const glowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(4.4, 16, 16),
        new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.25, wireframe: true })
      );
      mesh.add(glowMesh);

      nodesGroup.add(mesh);
      nodeMeshes.push(mesh);
    });
  }

  function createEdges() {
    edgesData.forEach(([srcIdx, dstIdx]) => {
      const srcNode = nodeMeshes[srcIdx];
      const dstNode = nodeMeshes[dstIdx];
      if (!srcNode || !dstNode) return;

      const geometry = new THREE.BufferGeometry().setFromPoints([srcNode.position, dstNode.position]);
      const material = new THREE.LineBasicMaterial({
        color: 0x22416b,
        transparent: true,
        opacity: 0.45
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { srcIdx, dstIdx };
      edgesGroup.add(line);
      edgeLines.push(line);
    });
  }

  function createPulseParticles() {
    particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    const pulseGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });

    edgesData.forEach(([srcIdx, dstIdx]) => {
      const p = new THREE.Mesh(pulseGeo, pulseMat.clone());
      p.userData = { srcIdx, dstIdx, progress: Math.random(), speed: 0.006 + Math.random() * 0.008 };
      particlesGroup.add(p);
      pulseParticles.push(p);
    });
  }

  function setStage(stageNum) {
    activeStage = stageNum;

    document.querySelectorAll('.stage-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.stage) === stageNum);
    });

    const info = stageDescriptions[stageNum];
    const badgeElem = document.getElementById('stage-badge');
    const titleElem = document.getElementById('stage-title');
    const descElem = document.getElementById('stage-desc');

    if (badgeElem) badgeElem.textContent = info.badge;
    if (titleElem) titleElem.textContent = info.title;
    if (descElem) descElem.textContent = info.description;

    applyStageTransforms(stageNum);
  }

  function applyStageTransforms(stage) {
    const targetSymbolIndices = [1, 0, 5, 14, 16]; // Core MCP target sub-graph
    const slmSymbolIndices = [20, 21, 22, 23, 16, 1]; // SLM routing to MCP
    const federationIndices = [24, 25, 26, 27, 0, 16]; // Multi-repo cross-boundary

    nodeMeshes.forEach((mesh, index) => {
      mesh.material.transparent = true;

      if (stage === 1) {
        // Stage 1: Tree-sitter AST Syntax Clusters
        const angle = (index / nodeMeshes.length) * Math.PI * 2;
        const r = 70;
        mesh.userData.targetPos = new THREE.Vector3(
          Math.cos(angle) * r + (Math.random() - 0.5) * 20,
          Math.sin(index * 1.5) * 45,
          Math.sin(angle) * r
        );
        mesh.material.opacity = 1.0;
        mesh.material.emissiveIntensity = 0.5;
        mesh.scale.set(1, 1, 1);
      }
      else if (stage === 2) {
        // Stage 2: CSR Matrix Grid Layout (uint32 Integer Compaction)
        const row = Math.floor(index / 7);
        const col = index % 7;
        mesh.userData.targetPos = new THREE.Vector3(
          (col - 3) * 24,
          (row - 1.5) * 26,
          0
        );
        mesh.material.opacity = 0.95;
        mesh.material.emissiveIntensity = 0.7;
        mesh.scale.set(0.9, 0.9, 0.9);
      }
      else if (stage === 3) {
        // Stage 3: Bidirectional Edge Network (Purge Invariants)
        const phi = Math.acos(-1 + (2 * index) / nodeMeshes.length);
        const theta = Math.sqrt(nodeMeshes.length * Math.PI) * phi;
        const radius = 80;
        mesh.userData.targetPos = new THREE.Vector3(
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi)
        );
        mesh.material.opacity = 1.0;
        mesh.material.emissiveIntensity = 0.8;
        mesh.scale.set(1.1, 1.1, 1.1);
      }
      else if (stage === 4) {
        // Stage 4: Subgraph Slicing for Agents (92% Pruning)
        const isTarget = targetSymbolIndices.includes(index);
        if (isTarget) {
          mesh.userData.targetPos = new THREE.Vector3(
            (index % 3 - 1) * 35,
            (Math.floor(index / 3) - 0.5) * 35,
            20
          );
          mesh.material.opacity = 1.0;
          mesh.material.emissiveIntensity = 1.3;
          mesh.scale.set(1.4, 1.4, 1.4);
        } else {
          mesh.userData.targetPos = mesh.userData.originalPos.clone().multiplyScalar(1.6);
          mesh.material.opacity = 0.12;
          mesh.material.emissiveIntensity = 0.05;
          mesh.scale.set(0.6, 0.6, 0.6);
        }
      }
      else if (stage === 5) {
        // Stage 5: Local SLM Intent Routing
        const isSlm = slmSymbolIndices.includes(index);
        if (isSlm) {
          mesh.userData.targetPos = new THREE.Vector3(
            (index - 20) * 32 - 30,
            (index % 2 === 0 ? 25 : -25),
            15
          );
          mesh.material.opacity = 1.0;
          mesh.material.emissiveIntensity = 1.25;
          mesh.scale.set(1.35, 1.35, 1.35);
        } else {
          mesh.userData.targetPos = mesh.userData.originalPos.clone().multiplyScalar(1.5);
          mesh.material.opacity = 0.15;
          mesh.material.emissiveIntensity = 0.08;
          mesh.scale.set(0.6, 0.6, 0.6);
        }
      }
      else if (stage === 6) {
        // Stage 6: Multi-Repo Federation (Clusters for core, api, auth)
        let clusterCenter = new THREE.Vector3(0, 0, 0);
        if (mesh.userData.repo === 'api') clusterCenter = new THREE.Vector3(70, 30, -20);
        else if (mesh.userData.repo === 'auth') clusterCenter = new THREE.Vector3(-70, -30, 20);
        else if (mesh.userData.repo === 'cli') clusterCenter = new THREE.Vector3(0, 75, 0);
        else clusterCenter = new THREE.Vector3(-20, 0, 0);

        mesh.userData.targetPos = clusterCenter.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 45, (Math.random() - 0.5) * 45, (Math.random() - 0.5) * 45)
        );
        mesh.material.opacity = 0.95;
        mesh.material.emissiveIntensity = federationIndices.includes(index) ? 1.2 : 0.6;
        mesh.scale.set(1.1, 1.1, 1.1);
      }
    });

    // Update Edges visibility per stage
    edgeLines.forEach(line => {
      if (stage === 4) {
        const isConn = targetSymbolIndices.includes(line.userData.srcIdx) && targetSymbolIndices.includes(line.userData.dstIdx);
        line.material.opacity = isConn ? 0.9 : 0.04;
        line.material.color.setHex(isConn ? 0x00f0ff : 0x1a2638);
      } else if (stage === 5) {
        const isConn = slmSymbolIndices.includes(line.userData.srcIdx) && slmSymbolIndices.includes(line.userData.dstIdx);
        line.material.opacity = isConn ? 0.9 : 0.05;
        line.material.color.setHex(isConn ? 0xf59e0b : 0x1a2638);
      } else if (stage === 6) {
        const isFed = federationIndices.includes(line.userData.srcIdx) || federationIndices.includes(line.userData.dstIdx);
        line.material.opacity = isFed ? 0.85 : 0.2;
        line.material.color.setHex(isFed ? 0xec4899 : 0x22416b);
      } else if (stage === 3) {
        line.material.opacity = 0.65;
        line.material.color.setHex(0x00f0ff);
      } else {
        line.material.opacity = 0.35;
        line.material.color.setHex(0x22416b);
      }
    });
  }

  function setupEventListeners() {
    document.querySelectorAll('.stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setStage(parseInt(btn.dataset.stage));
      });
    });

    const rotateBtn = document.getElementById('btn-toggle-rotate');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        isRotating = !isRotating;
        rotateBtn.classList.toggle('active', isRotating);
        rotateBtn.innerHTML = isRotating ? '<span>⏸ Pause Orbit</span>' : '<span>▶ Auto Orbit</span>';
      });
    }

    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        targetRotationX = 0.2;
        targetRotationY = 0;
        camera.position.set(0, 35, 300);
      });
    }

    // Drag Orbit
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (isDragging) {
        targetRotationY += (e.clientX - prevMouseX) * 0.005;
        targetRotationX += (e.clientY - prevMouseY) * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.position.z = Math.max(120, Math.min(550, camera.position.z + e.deltaY * 0.25));
    }, { passive: false });

    // Touch support
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        targetRotationY += (e.touches[0].clientX - prevMouseX) * 0.005;
        targetRotationX += (e.touches[0].clientY - prevMouseY) * 0.005;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function updateTooltip(mesh) {
    const tooltip = document.getElementById('graph-tooltip');
    if (!tooltip) return;

    if (mesh) {
      const data = mesh.userData;
      tooltip.innerHTML = `
        <div style="font-weight: 700; color: #00f0ff; margin-bottom: 2px;">${data.name}</div>
        <div style="font-size: 0.75rem; color: #94a3b8;">Crate: <strong style="color:#fff;">${data.crate}</strong> • Workspace: <strong style="color:#a855f7;">${data.repo}</strong></div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">Callers: ${data.callers} | Callees: ${data.callees}</div>
      `;
      tooltip.style.display = 'block';
    } else {
      tooltip.style.display = 'none';
    }
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    if (isRotating && !isDragging) {
      targetRotationY += 0.002;
    }

    currentRotationX += (targetRotationX - currentRotationX) * 0.08;
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;

    scene.rotation.x = currentRotationX;
    scene.rotation.y = currentRotationY;

    nodeMeshes.forEach(mesh => {
      if (mesh.userData.targetPos) {
        mesh.position.lerp(mesh.userData.targetPos, 0.06);
      }
    });

    edgeLines.forEach(line => {
      const srcNode = nodeMeshes[line.userData.srcIdx];
      const dstNode = nodeMeshes[line.userData.dstIdx];
      if (srcNode && dstNode) {
        const positions = line.geometry.attributes.position.array;
        positions[0] = srcNode.position.x;
        positions[1] = srcNode.position.y;
        positions[2] = srcNode.position.z;
        positions[3] = dstNode.position.x;
        positions[4] = dstNode.position.y;
        positions[5] = dstNode.position.z;
        line.geometry.attributes.position.needsUpdate = true;
      }
    });

    pulseParticles.forEach(p => {
      p.userData.progress += p.userData.speed;
      if (p.userData.progress > 1) p.userData.progress = 0;

      const src = nodeMeshes[p.userData.srcIdx];
      const dst = nodeMeshes[p.userData.dstIdx];
      if (src && dst) {
        p.position.lerpVectors(src.position, dst.position, p.userData.progress);
        p.visible = activeStage >= 3;
      }
    });

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodeMeshes);

    if (intersects.length > 0) {
      const topHit = intersects[0].object;
      if (hoveredNode !== topHit) {
        if (hoveredNode) hoveredNode.scale.multiplyScalar(0.85);
        hoveredNode = topHit;
        hoveredNode.scale.multiplyScalar(1.18);
        updateTooltip(hoveredNode);
        container.style.cursor = 'pointer';
      }
    } else {
      if (hoveredNode) {
        hoveredNode.scale.multiplyScalar(0.85);
        hoveredNode = null;
        updateTooltip(null);
        container.style.cursor = 'grab';
      }
    }

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
