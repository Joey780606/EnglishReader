import { useState } from "react";
import { TabKey, TopTabs } from "./components/TopTabs";
import { ReaderPage } from "./pages/ReaderPage";
import { VocabularyListPage } from "./pages/VocabularyListPage";

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("reader");

  return (
    <div className="app-shell">
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ display: activeTab === "reader" ? "contents" : "none" }}>
        <ReaderPage />
      </div>
      <div style={{ display: activeTab === "vocabulary" ? "contents" : "none" }}>
        <VocabularyListPage active={activeTab === "vocabulary"} />
      </div>
    </div>
  );
}
