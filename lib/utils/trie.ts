interface TrieNode {
  children: Map<string, TrieNode>;
  indices: Set<number>;
  isTerminal: boolean;
}

function createNode(): TrieNode {
  return {
    children: new Map<string, TrieNode>(),
    indices: new Set<number>(),
    isTerminal: false
  };
}

export class SearchTrie {
  private root = createNode();

  insert(term: string, index: number): void {
    let current = this.root;

    for (const character of term.toLowerCase()) {
      if (!current.children.has(character)) {
        current.children.set(character, createNode());
      }

      current.indices.add(index);
      current = current.children.get(character) as TrieNode;
    }

    current.indices.add(index);
    current.isTerminal = true;
  }

  search(prefix: string): number[] {
    if (!prefix) {
      return Array.from(this.root.indices);
    }

    let current: TrieNode | undefined = this.root;

    for (const character of prefix.toLowerCase()) {
      current = current.children.get(character);

      if (!current) {
        return [];
      }
    }

    return Array.from(current.indices);
  }

  static fromTerms(terms: string[]): SearchTrie {
    const trie = new SearchTrie();

    terms.forEach((term, index) => {
      trie.insert(term, index);
    });

    return trie;
  }
}
