// ---------------------------------------------------------------------------
// worms.arena — AI Agent Profile & Preset Agents
// ---------------------------------------------------------------------------
/**
 * 16 preset AI agents with distinct personalities.
 */
export const PRESET_AGENTS = [
    {
        id: 'terminator',
        name: 'Terminator',
        aggression: 0.95,
        riskTolerance: 0.9,
        accuracy: 0.85,
        preferredRange: 'far',
    },
    {
        id: 'sniper',
        name: 'Sniper',
        aggression: 0.6,
        riskTolerance: 0.3,
        accuracy: 0.95,
        preferredRange: 'far',
    },
    {
        id: 'berserker',
        name: 'Berserker',
        aggression: 1.0,
        riskTolerance: 1.0,
        accuracy: 0.5,
        preferredRange: 'close',
    },
    {
        id: 'tactician',
        name: 'Tactician',
        aggression: 0.5,
        riskTolerance: 0.4,
        accuracy: 0.8,
        preferredRange: 'medium',
    },
    {
        id: 'coward',
        name: 'Coward',
        aggression: 0.2,
        riskTolerance: 0.1,
        accuracy: 0.7,
        preferredRange: 'far',
    },
    {
        id: 'random-rick',
        name: 'Random Rick',
        aggression: 0.5,
        riskTolerance: 0.5,
        accuracy: 0.4,
        preferredRange: 'medium',
    },
    {
        id: 'predator',
        name: 'Predator',
        aggression: 0.9,
        riskTolerance: 0.8,
        accuracy: 0.75,
        preferredRange: 'close',
    },
    {
        id: 'ghost',
        name: 'Ghost',
        aggression: 0.3,
        riskTolerance: 0.2,
        accuracy: 0.9,
        preferredRange: 'far',
    },
    {
        id: 'tank',
        name: 'Tank',
        aggression: 0.85,
        riskTolerance: 0.95,
        accuracy: 0.6,
        preferredRange: 'close',
    },
    {
        id: 'ninja',
        name: 'Ninja',
        aggression: 0.7,
        riskTolerance: 0.6,
        accuracy: 0.85,
        preferredRange: 'medium',
    },
    {
        id: 'veteran',
        name: 'Veteran',
        aggression: 0.65,
        riskTolerance: 0.5,
        accuracy: 0.88,
        preferredRange: 'medium',
    },
    {
        id: 'chaos',
        name: 'Chaos',
        aggression: 0.8,
        riskTolerance: 0.9,
        accuracy: 0.45,
        preferredRange: 'close',
    },
    {
        id: 'precision',
        name: 'Precision',
        aggression: 0.4,
        riskTolerance: 0.25,
        accuracy: 0.92,
        preferredRange: 'far',
    },
    {
        id: 'rush',
        name: 'Rush',
        aggression: 0.95,
        riskTolerance: 0.85,
        accuracy: 0.55,
        preferredRange: 'close',
    },
    {
        id: 'defender',
        name: 'Defender',
        aggression: 0.35,
        riskTolerance: 0.15,
        accuracy: 0.75,
        preferredRange: 'far',
    },
    {
        id: 'balanced',
        name: 'Balanced',
        aggression: 0.6,
        riskTolerance: 0.5,
        accuracy: 0.7,
        preferredRange: 'medium',
    },
];
export function getAgentById(id) {
    return PRESET_AGENTS.find((a) => a.id === id);
}
//# sourceMappingURL=agent.js.map