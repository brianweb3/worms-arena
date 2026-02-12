// ---------------------------------------------------------------------------
// worms.arena — Agent Image Utilities
// ---------------------------------------------------------------------------

/**
 * Get agent image path based on agent ID.
 * Maps agent IDs to worm sprite images (agent-1.png through agent-14.png)
 */
export function getAgentImagePath(agentId: string): string {
  // Use hash of agent ID to consistently map to one of 14 images
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash) + agentId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const imageIndex = (Math.abs(hash) % 14) + 1;
  return `/assets/agent-${imageIndex}.png`;
}

/**
 * Preload agent images for faster rendering
 */
export function preloadAgentImages(agentIds: string[]): void {
  const uniqueIds = [...new Set(agentIds)];
  for (const agentId of uniqueIds) {
    const img = new Image();
    img.src = getAgentImagePath(agentId);
  }
}

/**
 * Get agent image path by index (0-13 maps to agent-1.png through agent-14.png)
 */
export function getAgentImageByIndex(index: number): string {
  const imageIndex = (index % 14) + 1;
  return `/assets/agent-${imageIndex}.png`;
}
