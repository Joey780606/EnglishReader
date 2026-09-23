import { useState } from "react";
import { TabKey, TopTabs } from "./components/TopTabs";
import { AdHocTextPage } from "./pages/AdHocTextPage";
import { EnglishToChinesePage } from "./pages/EnglishToChinesePage";
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
      <div style={{ display: activeTab === "adhoc" ? "contents" : "none" }}>
        <AdHocTextPage />
      </div>
      <div style={{ display: activeTab === "en2zh" ? "contents" : "none" }}>
        <EnglishToChinesePage />
      </div>
    </div>
  );
}
