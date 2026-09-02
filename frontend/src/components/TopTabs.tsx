export type TabKey = "reader" | "vocabulary";

interface TopTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "reader", label: "閱讀器" },
  { key: "vocabulary", label: "單字列表" },
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
