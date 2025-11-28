// API Client for backend communication
const API_BASE_URL = window.location.origin;

// API functions
const api = {
  // Players
  async getPlayers() {
    const response = await fetch(`${API_BASE_URL}/api/players`);
    if (!response.ok) throw new Error('Failed to fetch players');
    return await response.json();
  },

  async getPlayer(playerId) {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}`);
    if (!response.ok) throw new Error('Failed to fetch player');
    return await response.json();
  },

  async updatePlayer(playerId, data) {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update player');
    return await response.json();
  },

  // Picks
  async getPicks(playerId) {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/picks`);
    if (!response.ok) throw new Error('Failed to fetch picks');
    return await response.json();
  },

  async savePick(playerId, stageId, slotKey, teamName) {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/picks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, slotKey, teamName })
    });
    if (!response.ok) throw new Error('Failed to save pick');
    return await response.json();
  },

  async deletePick(playerId, stageId, slotKey) {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/picks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, slotKey })
    });
    if (!response.ok) throw new Error('Failed to delete pick');
    return await response.json();
  },

  // Admin Results
  async getAdminResults(stageId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/results/${stageId}`);
    if (!response.ok) {
      // Return empty results if not found
      return { '30': [], '03': [], '31-32': [] };
    }
    return await response.json();
  },

  async getChampionResult() {
    const response = await fetch(`${API_BASE_URL}/api/admin/champion`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.champion || null;
  },

  async saveChampionResult(champion) {
    const response = await fetch(`${API_BASE_URL}/api/admin/champion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ champion })
    });
    if (!response.ok) throw new Error('Failed to save champion');
    return await response.json();
  },

  async deleteChampionResult() {
    const response = await fetch(`${API_BASE_URL}/api/admin/champion`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete champion');
    return await response.json();
  },

  async getChampionStatus() {
    const response = await fetch(`${API_BASE_URL}/api/admin/champion-status`);
    if (!response.ok) {
      return { is_open: 1 }; // Default to open
    }
    return await response.json();
  },

  async updateChampionStatus(isOpen) {
    const response = await fetch(`${API_BASE_URL}/api/admin/champion-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen ? 1 : 0 })
    });
    if (!response.ok) throw new Error('Failed to update champion status');
    return await response.json();
  },

  async saveAdminResults(stageId, results) {
    const response = await fetch(`${API_BASE_URL}/api/admin/results/${stageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    });
    if (!response.ok) throw new Error('Failed to save results');
    return await response.json();
  },

  async deleteAdminResults(stageId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/results/${stageId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete results');
    return await response.json();
  },

  // Stage Status
  async getStageStatus(stageId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/stage-status/${stageId}`);
    if (!response.ok) {
      // Default: stage is open
      return { stage_id: stageId, is_open: 1 };
    }
    return await response.json();
  },

  async getAllStageStatuses() {
    const response = await fetch(`${API_BASE_URL}/api/admin/stage-status`);
    if (!response.ok) throw new Error('Failed to fetch stage statuses');
    return await response.json();
  },

  async updateStageStatus(stageId, isOpen) {
    const response = await fetch(`${API_BASE_URL}/api/admin/stage-status/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen })
    });
    if (!response.ok) throw new Error('Failed to update stage status');
    return await response.json();
  }
};

// Export api to window for global access
window.api = api;
console.log('[API] api object exported to window');

