// Weave Graph - Interactive Query Simulator

const queryData = {
  callers: {
    command: 'weave query "callers(Storage::purge_file_edges_bidirectional)"',
    speed: '1.4ms',
    output: `Found 3 inbound caller(s) across 2 crates:
  1. crates/weave-graph-core/src/engine.rs:142
     └── GraphEngine::reindex_file(file_id: FileId) -> Result<()>
  2. crates/weave-graph-core/src/engine.rs:189
     └── GraphEngine::handle_file_deletion(path: &Path) -> Result<()>
  3. crates/weave-graph-cli/src/commands/rebuild.rs:88
     └── RebuildWorker::execute_atomic_swap() -> Result<()>

CSR Traversal: 3 hops | Adjacency lookups: 12 | RAM: 1.2MB`,
    rawTokens: '28,450 tokens',
    weaveTokens: '820 tokens',
    reduction: '97.1%'
  },
  callees: {
    command: 'weave query "callees(GraphEngine::reindex_file)"',
    speed: '0.9ms',
    output: `Found 4 outbound callee(s):
  ├── Storage::purge_file_edges_bidirectional [bidirectional purge invariant]
  ├── ParserRegistry::parse_source [tree-sitter microsecond parse]
  ├── CsrMatrix::insert_edge_batch [uint32 integer compaction]
  └── Storage::commit_atomic_batch [WAL-journaled transaction]

CSR Traversal: 1 hop | Adjacency lookups: 4 | RAM: 0.8MB`,
    rawTokens: '34,200 tokens',
    weaveTokens: '950 tokens',
    reduction: '97.2%'
  },
  impact: {
    command: 'weave query "impact(crates/weave-graph-core/src/model.rs)"',
    speed: '3.2ms',
    output: `Blast Radius Analysis for: crates/weave-graph-core/src/model.rs
  Direct dependents: 4 crates (weave-graph-parse, weave-graph-store-sqlite, weave-graph-mcp, weave-graph-cli)
  Impacted symbols: 18 definitions
  Upstream consumer files: 42 files
  High-risk call sites: 6 (public trait contracts)
  
Summary: Core type alteration requires recompiling 4 workspace crates.`,
    rawTokens: '89,600 tokens',
    weaveTokens: '1,840 tokens',
    reduction: '97.9%'
  },
  path: {
    command: 'weave query "path(SymbolIndex, CsrMatrix)"',
    speed: '2.1ms',
    output: `Shortest Directed Path (Length: 3 hops):
  [Symbol] weave_graph_core::model::SymbolIndex
    └── (implements) -> weave_graph_core::traits::IndexLookup
        └── (delegates_to) -> weave_graph_core::csr::CsrAdjacencyList
            └── (stores_in) -> petgraph::csr::CsrMatrix<u32, u32>

Verification: 100% deterministic traversal via integer bitmask.`,
    rawTokens: '19,800 tokens',
    weaveTokens: '610 tokens',
    reduction: '96.9%'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const playground = document.querySelector('.playground-box');
  if (!playground) return;

  const buttons = playground.querySelectorAll('.playground-btn');
  const cmdElem = playground.querySelector('.playground-cmd');
  const speedElem = playground.querySelector('.playground-speed');
  const outputElem = playground.querySelector('.playground-output');
  const rawTokensElem = playground.querySelector('.tokens-raw');
  const weaveTokensElem = playground.querySelector('.tokens-weave');
  const reductionElem = playground.querySelector('.tokens-reduction');

  function setQuery(key) {
    const data = queryData[key];
    if (!data) return;

    if (cmdElem) cmdElem.textContent = data.command;
    if (speedElem) speedElem.textContent = data.speed;
    if (outputElem) outputElem.textContent = data.output;
    if (rawTokensElem) rawTokensElem.textContent = data.rawTokens;
    if (weaveTokensElem) weaveTokensElem.textContent = data.weaveTokens;
    if (reductionElem) reductionElem.textContent = data.reduction;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const queryKey = btn.getAttribute('data-query');
      setQuery(queryKey);
    });
  });

  // Initialize with first button
  if (buttons.length > 0) {
    buttons[0].click();
  }
});
