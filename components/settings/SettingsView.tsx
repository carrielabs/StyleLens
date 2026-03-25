'use client'

import ApiKeysSection from './sections/ApiKeysSection'

interface SettingsViewProps {
  onClose: () => void
}

/**
 * SettingsView - Claude-inspired Premium Workspace Settings
 * 
 * Alignment Fixes:
 * - "SETTINGS" aligns vertically with "New Extraction" in the main sidebar.
 * - Navigation items and main content titles are aligned for a professional flow.
 */
export default function SettingsView({ onClose }: SettingsViewProps) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      height: '100%',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      animation: 'settingsFadeIn 0.2s ease-out',
      fontFamily: 'var(--font-sans)',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes settingsFadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .settings-nav-item {
          transition: all 0.15s ease;
        }
        .settings-nav-item:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      `}} />

      {/* Settings Navigation Sidebar (Narrow Left Column) */}
      <div style={{
        width: '200px',
        flexShrink: 0,
        padding: '58px 12px 32px', /* Aligns "SETTINGS" with "New Extraction" */
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#8E8E93',
          letterSpacing: '0.04em',
          padding: '0 12px',
          marginBottom: '8px',
        }}>
          Settings
        </h3>

        {/* Sync "API 配置" item vertical position with right content title */}
        <button
          className="settings-nav-item"
          style={{
            textAlign: 'left',
            padding: '8px 12px',
            border: 'none',
            background: 'rgba(0,0,0,0.06)',
            color: '#1D1D1F',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'default',
            width: '100%',
          }}
        >
          API 配置
        </button>
      </div>

      {/* Settings Main Content (Spacious Right Column) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        /* Align API Keys title with left nav item: 
           Nav starts at 58px + 13px(Settings) + 8px(margin) + 8px(padding) = ~87px
        */
        padding: '87px 48px 48px', 
      }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <ApiKeysSection />
        </div>
      </div>
    </div>
  )
}
