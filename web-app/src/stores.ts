import { create } from 'zustand';
import { api, type EnvironmentConfig, type HealthResponse, type NormalizedSpec, type RunReport } from './lib/api';

interface AppState {
  health: HealthResponse | null;
  currentSpec: NormalizedSpec | null;
  environments: EnvironmentConfig[];
  activeRun: RunReport | null;
  loading: boolean;
  error: string | null;
  checkHealth: () => Promise<void>;
  importSpec: (document: unknown) => Promise<NormalizedSpec>;
  importSpecUrl: (url: string) => Promise<NormalizedSpec>;
  createEnvironment: (data: EnvironmentConfig) => Promise<EnvironmentConfig>;
  deleteEnvironment: (id: string) => Promise<void>;
  loadEnvironments: (specId: string) => Promise<void>;
  setActiveRun: (run: RunReport | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  health: null, currentSpec: null, environments: [], activeRun: null, loading: false, error: null,
  checkHealth: async () => { try { set({ health: await api.health(), error: null }); } catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to reach API' }); } },
  importSpec: async (document) => { set({ loading: true, error: null }); try { const currentSpec = await api.importSpec(document); set({ currentSpec, loading: false }); return currentSpec; } catch (error) { const message = error instanceof Error ? error.message : 'Unable to import specification'; set({ loading: false, error: message }); throw error; } },
  importSpecUrl: async (url) => { set({ loading: true, error: null }); try { const currentSpec = await api.importSpecUrl(url); set({ currentSpec, environments: [], activeRun: null, loading: false }); return currentSpec; } catch (error) { const message = error instanceof Error ? error.message : 'Unable to import specification URL'; set({ loading: false, error: message }); throw error; } },
  createEnvironment: async (data) => { set({ loading: true, error: null }); try { const environment = await api.createEnvironment(data); set((state) => ({ environments: [...state.environments, environment], loading: false })); return environment; } catch (error) { const message = error instanceof Error ? error.message : 'Unable to create environment'; set({ loading: false, error: message }); throw error; } },
  deleteEnvironment: async (id) => { set({ loading: true, error: null }); try { await api.deleteEnvironment(id); set((state) => ({ environments: state.environments.filter((environment) => environment.id !== id), loading: false })); } catch (error) { const message = error instanceof Error ? error.message : 'Unable to delete environment'; set({ loading: false, error: message }); throw error; } },
  loadEnvironments: async (specId) => { try { set({ environments: await api.listEnvironments(specId), error: null }); } catch (error) { set({ error: error instanceof Error ? error.message : 'Unable to load environments' }); } },
  setActiveRun: (activeRun) => set({ activeRun }),
  clearError: () => set({ error: null }),
}));