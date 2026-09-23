export type TabKey = "reader" | "vocabulary" | "adhoc" | "en2zh";

interface TopTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "reader", label: "閱讀器" },
  { key: "vocabulary", label: "單字列表" },
  { key: "adhoc", label: "隨選文字" },
  { key: "en2zh", label: "英翻中" },
];

export function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  return (
    <div className="top-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`top-tab ${activeTab === tab.key ? "top-tab-active" : ""}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
