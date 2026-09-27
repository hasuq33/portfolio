/** Shared by toolbars, dialogs, and commands; UI focus never owns the edit range. */
export class EditorSelection {
  private saved: Range | null = null;
  private holds = new Set<unknown>();
  get isHeld() {
    return this.holds.size > 0;
  }
  constructor(private readonly root: HTMLElement) {}
  contains(node: Node | null): node is Node {
    return Boolean(node && (node === this.root || this.root.contains(node)));
  }
  capture() {
    if (this.isHeld) return;
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      this.contains(selection.anchorNode) &&
      this.contains(selection.focusNode)
    ) {
      this.saved = selection.getRangeAt(0).cloneRange();
    }
  }
  range() {
    this.capture();
    if (
      this.saved &&
      this.contains(this.saved.startContainer) &&
      this.contains(this.saved.endContainer)
    )
      return this.saved.cloneRange();
    const range = document.createRange();
    range.selectNodeContents(this.root);
    range.collapse(false);
    return range;
  }
  select(range: Range) {
    if (
      !this.contains(range.startContainer) ||
      !this.contains(range.endContainer)
    )
      return;
    this.root.focus({ preventScroll: true });
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.saved = range.cloneRange();
  }
  hold(owner: unknown = this) {
    this.capture();
    this.holds.add(owner);
  }
  release(owner: unknown = this) {
    this.holds.delete(owner);
  }
  reset() {
    this.saved = null;
    this.holds.clear();
  }
}
