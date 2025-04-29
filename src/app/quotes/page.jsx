"use client";
import React, { useState } from "react";
import PersonaQuoteBox from "@/components/PersonaQuoteBox";
import QuotePopup from "@/components/QuotePopup";
import {
  GlassContainer,
  GlassCard,
  BackButton,
  ModernHeading,
  ModernButton,
  ModernSelect,
  ModernFormGroup,
  ModernLabel,
  ModernCheckbox
} from "@/components/ui/ModernUI";

export default function QuotesPage() {
  const [settings, setSettings] = useState({
    autoRotate: true,
    rotationInterval: 10000,
    showControls: true,
  });

  const [showPopup, setShowPopup] = useState(false);

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleShowPopup = () => {
    setShowPopup(true);
    // Auto-hide after 20 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 20000);
  };

  return (
    <GlassContainer>
      <div className="mb-6">
        <BackButton />
      </div>

      <ModernHeading level={1} className="text-center mb-8">
        Daily Inspiration
      </ModernHeading>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Quote Box */}
        <PersonaQuoteBox
          autoRotate={settings.autoRotate}
          rotationInterval={settings.rotationInterval}
          showControls={settings.showControls}
          className="max-w-2xl mx-auto"
        />

        {/* Settings Card */}
        <GlassCard className="max-w-2xl mx-auto">
          <ModernHeading level={3}>Quote Box Settings</ModernHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <ModernFormGroup>
              <ModernCheckbox
                id="autoRotate"
                checked={settings.autoRotate}
                onChange={(e) => handleSettingChange("autoRotate", e.target.checked)}
                label="Auto-rotate quotes"
              />
            </ModernFormGroup>

            <ModernFormGroup>
              <ModernCheckbox
                id="showControls"
                checked={settings.showControls}
                onChange={(e) => handleSettingChange("showControls", e.target.checked)}
                label="Show controls"
              />
            </ModernFormGroup>

            <ModernFormGroup>
              <ModernLabel htmlFor="rotationInterval">Rotation Interval</ModernLabel>
              <ModernSelect
                id="rotationInterval"
                value={settings.rotationInterval}
                onChange={(e) => handleSettingChange("rotationInterval", parseInt(e.target.value))}
                options={[
                  { value: 5000, label: "5 seconds" },
                  { value: 10000, label: "10 seconds" },
                  { value: 15000, label: "15 seconds" },
                  { value: 30000, label: "30 seconds" },
                  { value: 60000, label: "1 minute" },
                ]}
              />
            </ModernFormGroup>
          </div>

          <div className="mt-6">
            <ModernHeading level={4}>Test Popup Mode</ModernHeading>
            <p className="text-gray-600 mb-4">
              See how the quote popup will appear to users. In the actual implementation,
              this will show occasionally while browsing the site.
            </p>
            <ModernButton onClick={handleShowPopup}>
              Show Quote Popup
            </ModernButton>
          </div>
        </GlassCard>
      </div>

      {/* Demo popup that appears when button is clicked */}
      {showPopup && (
        <QuotePopup
          enabled={true}
          initialDelay={0}
          showDuration={20000}
        />
      )}
    </GlassContainer>
  );
}
