import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 sm:right-4 sm:bottom-4 m-4 p-4 border border-app-border rounded-lg bg-app-surface shadow-xl z-[9999] max-w-[calc(100vw-2rem)] sm:max-w-sm animate-fadeIn">
      <div className="mb-4">
        {offlineReady ? (
          <span className="text-sm font-medium text-app-primary">
            App ready to work offline.
          </span>
        ) : (
          <span className="text-sm font-medium text-app-primary">
            New version available! Reload to update.
          </span>
        )}
      </div>
      <div className="flex gap-3 justify-end">
        {needRefresh && (
          <button
            id="shared-reload-confirm"
            data-testid="shared-reload-confirm"
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-2 bg-app-brand text-app-canvas rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        )}
        <button
          id="shared-reload-close"
          data-testid="shared-reload-close"
          onClick={() => close()}
          className="px-4 py-2 bg-app-surface text-app-secondary border border-app-border rounded-md text-sm font-medium hover:bg-app-canvas transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ReloadPrompt;
